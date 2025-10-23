import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import { z } from 'zod';

import type { JsonValue } from '@abcp/types';

const jsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string(),
  params: z.unknown().optional(),
});

const jsonRpcResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.unknown().optional(),
    })
    .optional(),
});

const notificationSchema = jsonRpcRequestSchema.omit({ id: true });

export type JsonRpcRequest = z.infer<typeof jsonRpcRequestSchema>;
export type JsonRpcResponse = z.infer<typeof jsonRpcResponseSchema>;
export type JsonRpcNotification = z.infer<typeof notificationSchema>;

export interface McpClientOptions {
  url: string;
  headers?: Record<string, string>;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectIntervalMs?: number;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timeout: NodeJS.Timeout;
}

export interface RegisterToolPayload {
  name: string;
  description: string;
  inputSchema: JsonValue;
}

export interface InvokeToolPayload {
  name: string;
  arguments?: JsonValue;
}

type McpEventMap = {
  open: [];
  close: [code: number, reason: Buffer];
  error: [error: Error];
  notification: [notification: JsonRpcNotification];
};

export class McpClient extends EventEmitter {
  private socket: WebSocket | undefined;
  private readonly options: Required<Omit<McpClientOptions, 'headers'>>;
  private readonly headers: Record<string, string> | undefined;
  private reconnectAttempts = 0;
  private readonly pending = new Map<string | number, PendingRequest>();

  constructor(options: McpClientOptions) {
    super();
    this.headers = options.headers;
    this.options = {
      url: options.url,
      reconnect: options.reconnect ?? true,
      reconnectAttempts: options.reconnectAttempts ?? 5,
      reconnectIntervalMs: options.reconnectIntervalMs ?? 1_000,
    };
  }

  async connect(): Promise<void> {
    if (this.socket !== undefined && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const socketOptions = this.headers ? { headers: this.headers } : undefined;
      const socket = new WebSocket(this.options.url, socketOptions);

      this.socket = socket;

      socket.once('open', () => {
        this.reconnectAttempts = 0;
        this.emit('open');
        resolve();
      });

      socket.once('error', (error) => {
        this.emit('error', error);
        reject(error);
      });

      socket.on('message', (data) => {
        this.handleMessage(data.toString());
      });

      socket.once('close', (code, reason) => {
        this.emit('close', code, reason);
        this.handleReconnect(code);
      });
    });
  }

  async disconnect(): Promise<void> {
    if (!this.socket) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.socket?.removeAllListeners('close');
      this.socket?.once('close', () => resolve());
      this.socket?.close();
      this.socket = undefined;
    });
  }

  async call<T = unknown>(method: string, params?: JsonValue, timeoutMs = 10_000): Promise<T> {
    const socket = await this.waitForSocket(timeoutMs);
    const id = randomUUID();
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    const payload = JSON.stringify(request);

    const result = await new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP request timed out: ${method}`));
      }, timeoutMs);

      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
        timeout,
      });
      socket.send(payload, (error) => {
        if (error) {
          clearTimeout(timeout);
          this.pending.delete(id);
          reject(error);
        }
      });
    });

    return result;
  }

  async notify(method: string, params?: JsonValue): Promise<void> {
    const socket = await this.waitForSocket();
    const notification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    socket.send(JSON.stringify(notification));
  }

  async registerTool(tool: RegisterToolPayload): Promise<void> {
    await this.notify('tools/register', {
      tool: {
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      },
    });
  }

  async invokeTool<T = unknown>(payload: InvokeToolPayload): Promise<T> {
    return this.call<T>('tools/call', {
      name: payload.name,
      arguments: payload.arguments,
    });
  }

  private ensureSocket(): WebSocket {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('MCP client is not connected.');
    }

    return this.socket;
  }

  private async waitForSocket(timeoutMs = 5_000): Promise<WebSocket> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return this.socket;
    }

    if (!this.options.reconnect) {
      throw new Error('MCP client is not connected.');
    }

    const waitTimeout = Math.max(
      timeoutMs,
      this.options.reconnectAttempts * this.options.reconnectIntervalMs + 500,
    );

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.off('open', handleOpen);
        reject(new Error('MCP client could not reconnect in time.'));
      }, waitTimeout);

      const handleOpen = () => {
        clearTimeout(timeout);
        this.off('open', handleOpen);
        resolve();
      };

      this.on('open', handleOpen);
    });

    return this.ensureSocket();
  }

  private handleMessage(message: string): void {
    try {
      const parsed = JSON.parse(message) as unknown;
      if (jsonRpcResponseSchema.safeParse(parsed).success) {
        this.resolvePending(parsed as JsonRpcResponse);
        return;
      }

      const notificationResult = notificationSchema.safeParse(parsed);
      if (notificationResult.success) {
        this.emit('notification', notificationResult.data);
        return;
      }

      throw new Error('Received invalid MCP message.');
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Unknown message error'));
    }
  }

  private resolvePending(response: JsonRpcResponse): void {
    const pending = this.pending.get(response.id);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timeout);
    this.pending.delete(response.id);

    if (response.error) {
      pending.reject(
        new Error(`${response.error.message} (code=${response.error.code})`, {
          cause: response.error.data,
        }),
      );
    } else {
      pending.resolve(response.result ?? null);
    }
  }

  private handleReconnect(code: number): void {
    if (!this.options.reconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.options.reconnectAttempts) {
      return;
    }

    if (code === 1000) {
      return;
    }

    this.reconnectAttempts += 1;
    setTimeout(() => {
      void this.connect().catch((error) => this.emit('error', error));
    }, this.options.reconnectIntervalMs);
  }

  public override on<T extends keyof McpEventMap>(
    event: T,
    listener: (...args: McpEventMap[T]) => void,
  ): this {
    return super.on(event, listener);
  }

  public override once<T extends keyof McpEventMap>(
    event: T,
    listener: (...args: McpEventMap[T]) => void,
  ): this {
    return super.once(event, listener);
  }

  public override off<T extends keyof McpEventMap>(
    event: T,
    listener: (...args: McpEventMap[T]) => void,
  ): this {
    return super.off(event, listener);
  }

  public override emit<T extends keyof McpEventMap>(event: T, ...args: McpEventMap[T]): boolean {
    return super.emit(event, ...args);
  }
}
