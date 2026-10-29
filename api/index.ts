import type { IncomingMessage, ServerResponse } from 'http';
import { handleGeminiApiRoute } from '../src/server/geminiHandler.ts';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const handled = await handleGeminiApiRoute(req, res);
    if (!handled && !res.headersSent) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
  } catch (error: any) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error?.message || 'Server error' }));
    }
  }
}
