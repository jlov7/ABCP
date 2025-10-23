#!/usr/bin/env node
// Simple MCP file server providing read-only access to a configured directory.

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT ?? 4041);
const root = process.env.ROOT ?? process.cwd();

const server = new WebSocketServer({ port });

server.on('connection', (socket) => {
  socket.on('message', async (raw) => {
    const message = JSON.parse(raw.toString());
    if (message.method !== 'tools/call') {
      return;
    }

    if (message.params?.name !== 'file.read') {
      socket.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32601,
            message: 'Unsupported tool'
          }
        })
      );
      return;
    }

    try {
      const path = resolve(root, message.params?.arguments?.path ?? '');
      const content = await readFile(path, 'utf8');
      socket.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            path,
            content
          }
        })
      );
    } catch (error) {
      socket.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32000,
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      );
    }
  });
});

process.stdout.write(`File MCP server listening on ws://127.0.0.1:${port}\n`);
