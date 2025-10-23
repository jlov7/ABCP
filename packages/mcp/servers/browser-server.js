#!/usr/bin/env node
// Simple MCP-compatible WebSocket server that exposes a synthetic "browser.click" tool.

import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT ?? 4040);

const server = new WebSocketServer({ port });

server.on('connection', (socket) => {
  socket.on('message', (raw) => {
    const message = JSON.parse(raw.toString());
    if (message.method === 'tools/register') {
      // acknowledge registration
      return;
    }

    if (message.method === 'tools/call') {
      socket.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            ok: true,
            tool: message.params?.name ?? 'unknown',
            arguments: message.params?.arguments ?? {}
          }
        })
      );
    }
  });
});

process.stdout.write(`Browser MCP server listening on ws://127.0.0.1:${port}\n`);
