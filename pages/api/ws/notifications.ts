import type { NextApiRequest, NextApiResponse } from 'next';
import { initWebSocketServer } from '@/lib/websocketServer';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Initialize the WebSocket server on the underlying HTTP server
  if (res.socket) {
    initWebSocketServer((res.socket as any).server);
  }
  // The connection handling is done in the websocketServer module.
  // We just need to prevent the API from resolving.
  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};