import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';

// In-memory store of connections: userId => Set<WebSocket>
const userConnections = new Map<string, Set<WebSocket>>();

// We'll create a single WebSocket server instance that can be reused.
// This is a simplified approach; in production, you might want to use a proper WebSocket library with rooms.
let wss: WebSocketServer | null = null;

/**
 * Initializes the WebSocket server on an existing HTTP server.
 * This should be called once when the Next.js server starts.
 * For simplicity, we'll attach it to the response.socket.server in the API route.
 */
export function initWebSocketServer(server: import('http').Server) {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
    server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
      // We'll handle authentication in the connection logic; for now, we'll accept all.
      wss!.handleUpgrade(request, socket, head, (ws) => {
        wss!.emit('connection', ws, request);
      });
    });

    wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      // TODO: Authenticate the user via next-auth token (from cookies or query).
      // For now, we'll assume the userId is passed as a query parameter ?userId=...
      const { searchParams } = new URL(request.url || '', 'http://localhost');
      const userId = searchParams.get('userId');
      if (!userId) {
        ws.close(4001, 'Unauthorized');
        return;
      }

      // Add connection to the user's set
      if (!userConnections.has(userId)) {
        userConnections.set(userId, new Set());
      }
      const connections = userConnections.get(userId)!;
      connections.add(ws);

      ws.on('close', () => {
        connections.delete(ws);
        if (connections.size === 0) {
          userConnections.delete(userId);
        }
      });

      ws.on('error', console.error);
    });
  }
  return wss;
}

/**
 * Sends a JSON message to all connections of a given userId.
 */
export function sendToUser(userId: string, data: unknown) {
  const connections = userConnections.get(userId);
  if (!connections) return;
  const message = JSON.stringify(data);
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

/**
 * Closes all connections and the server.
 */
export function closeWebSocketServer() {
  wss?.close();
  wss = null;
  userConnections.clear();
}