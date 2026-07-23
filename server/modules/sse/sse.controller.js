// ─── SSE Client Registry ──────────────────────────────────────────────
// Maps userId (string) → Express response object
const clients = new Map();

/**
 * SSE connection endpoint handler.
 * GET /api/v1/sse/connect — requires authentication
 */
export const sseConnect = (req, res) => {
  const userId = req.user.userId.toString();

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

  // Register client
  clients.set(userId, res);

  // Heartbeat every 30s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeat);
      return;
    }
    res.write(': heartbeat\n\n');
  }, 30_000);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(userId);
  });
};

/**
 * Push an event to a specific user.
 * @param {string} userId
 * @param {{ type: string, data?: any, message?: string }} event
 */
export const pushToUser = (userId, event) => {
  const res = clients.get(userId.toString());
  if (res && !res.writableEnded) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }
};

/**
 * Broadcast an event to all connected clients.
 * @param {{ type: string, data?: any, message?: string }} event
 */
export const broadcastAll = (event) => {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const [, res] of clients) {
    if (!res.writableEnded) {
      res.write(payload);
    }
  }
};

/**
 * Get count of connected SSE clients.
 */
export const getConnectedCount = () => clients.size;
