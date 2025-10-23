#!/usr/bin/env node
// Minimal MCP server that proxies GET requests to configured origins.

import fetch from 'node-fetch';
import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT ?? 4042);
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '';

const server = new WebSocketServer({ port });

server.on('connection', (socket) => {
  socket.on('message', async (raw) => {
    const message = JSON.parse(raw.toString());
    if (message.method !== 'tools/call' || message.params?.name !== 'http.get') {
      return;
    }

    const url = message.params?.arguments?.url ?? '';
    if (!url.startsWith(allowedOrigin)) {
      socket.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32001,
            message: 'Origin not allowed'
          }
        })
      );
      return;
    }

    try {
      const response = await fetch(url);
      const body = await response.text();
      socket.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body
          }
        })
      );
    } catch (error) {
      socket.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32002,
            message: error instanceof Error ? error.message : 'Unknown fetch error'
          }
        })
      );
    }
  });
});

process.stdout.write(`HTTP search MCP server listening on ws://127.0.0.1:${port}\n`);
