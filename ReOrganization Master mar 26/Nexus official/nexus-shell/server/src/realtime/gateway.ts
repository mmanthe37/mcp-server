import type { FastifyPluginAsync } from 'fastify';
import type { WebSocket } from 'ws';

interface ActiveConnection {
  ws: WebSocket;
  userId: string;
  sessionId?: string;
  lastPing: number;
}

const connections = new Map<string, ActiveConnection>();

export const realtimeGateway: FastifyPluginAsync = async (app) => {
  app.get('/', { websocket: true }, (socket, request) => {
    const connectionId = `conn-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const conn: ActiveConnection = {
      ws: socket,
      userId: 'anonymous',
      lastPing: Date.now(),
    };
    connections.set(connectionId, conn);

    app.log.info({ connectionId }, 'WebSocket client connected');

    socket.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        handleMessage(connectionId, message, app);
      } catch {
        // Binary frame — NexusFlow protocol
        handleBinaryFrame(connectionId, raw as Buffer, app);
      }
    });

    socket.on('close', () => {
      connections.delete(connectionId);
      app.log.info({ connectionId }, 'WebSocket client disconnected');
    });

    socket.on('error', (err) => {
      app.log.error({ connectionId, err }, 'WebSocket error');
      connections.delete(connectionId);
    });
  });
};

function handleMessage(connId: string, message: any, app: any): void {
  const conn = connections.get(connId);
  if (!conn) return;

  switch (message.type) {
    case 'heartbeat':
      conn.lastPing = Date.now();
      conn.ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      break;

    case 'terminal:input':
      app.log.debug({ connId, sessionId: message.sessionId }, 'terminal input');
      // Forward to session manager → daemon
      break;

    case 'terminal:resize':
      app.log.debug({ connId, cols: message.cols, rows: message.rows }, 'terminal resize');
      break;

    case 'session:control':
      app.log.info({ connId, action: message.action }, 'session control');
      break;

    default:
      app.log.warn({ connId, type: message.type }, 'unknown message type');
  }
}

function handleBinaryFrame(connId: string, data: Buffer, app: any): void {
  const conn = connections.get(connId);
  if (!conn) return;
  // NexusFlow binary frame processing
  app.log.debug({ connId, bytes: data.byteLength }, 'binary frame received');
}
