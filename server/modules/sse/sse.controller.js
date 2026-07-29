const clients = new Map(); // userId (string) → Express response

export const sseConnect = (req, res) => {
  const userId = req.user.userId.toString();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);
  clients.set(userId, res);

  const heartbeat = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeat);
      return;
    }
    res.write(': heartbeat\n\n');
  }, 30_000);

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
