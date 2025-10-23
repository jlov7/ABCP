import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { McpClient } from './client';

let server: ReturnType<typeof createServer>;
let wss: WebSocketServer;
let address: string;

beforeAll(async () => {
  server = createServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as { port: number }).port;
  wss = new WebSocketServer({ server });
  address = `ws://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 200);
    wss.close(() => {
      clearTimeout(timeout);
      resolve();
    });
  });
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 200);
    server.close(() => {
      clearTimeout(timeout);
      resolve();
    });
  });
});

afterEach(() => {
  wss.clients.forEach((client) => client.removeAllListeners());
  wss.clients.forEach((client) => client.terminate());
});

describe('McpClient', () => {
  it('sends requests and receives responses', async () => {
    wss.once('connection', (socket) => {
      socket.on('message', (data) => {
        const parsed = JSON.parse(data.toString());
        if (parsed.method === 'tools/call') {
          socket.send(
            JSON.stringify({
              jsonrpc: '2.0',
              id: parsed.id,
              result: { ok: true }
            })
          );
        }
      });
    });

    const client = new McpClient({ url: address });
    await client.connect();
    const result = await client.invokeTool<{ ok: boolean }>({ name: 'test' });
    expect(result.ok).toBe(true);
    await client.disconnect();
  });

  it('emits notifications', async () => {
    wss.once('connection', (socket) => {
      setTimeout(() => {
        socket.send(
          JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/heartbeat',
            params: { ok: true }
          })
        );
      }, 10);
    });

    const client = new McpClient({ url: address });
    await client.connect();

    const notification = await new Promise((resolve) => {
      client.once('notification', (payload) => resolve(payload));
    });

    expect(notification).toMatchObject({
      method: 'tools/heartbeat'
    });
    await client.disconnect();
  });

  it('reconnects when allowed', async () => {
    let connections = 0;
    wss.on('connection', (socket) => {
      connections += 1;
      if (connections === 1) {
        socket.close(1012, 'Restarting');
      }
      socket.on('message', (data) => {
        const parsed = JSON.parse(data.toString());
        if (parsed.id) {
          socket.send(
            JSON.stringify({
              jsonrpc: '2.0',
              id: parsed.id,
              result: { ok: true }
            })
          );
        }
      });
    });

    const client = new McpClient({
      url: address,
      reconnectIntervalMs: 50,
      reconnectAttempts: 2
    });

    let openCount = 0;
    const reopened = new Promise<void>((resolve) => {
      client.on('open', () => {
        openCount += 1;
        if (openCount === 2) {
          resolve();
        }
      });
    });

    await client.connect();
    await reopened;
    const response = await client.invokeTool<{ ok: boolean }>({ name: 'hello' });
    expect(response.ok).toBe(true);
    await client.disconnect();
  });
});
