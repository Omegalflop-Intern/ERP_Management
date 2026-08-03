const clients = new Map(); // userId (string) → { res, tenantId }

export const sseConnect = (req, res) => {
  const userId = req.user.userId.toString();
  const tenantId = req.user?.tenantId || null;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);
  clients.set(userId, { res, tenantId });

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
  const client = clients.get(userId.toString());
  if (client && !client.res.writableEnded) {
    client.res.write(`data: ${JSON.stringify(event)}\n\n`);
  }
};

/**
 * Push an event to all connected clients.
 * @param {{ type: string, data?: any, message?: string }} event
 */
export const broadcastAll = (event) => {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const [, client] of clients) {
    if (!client.res.writableEnded) {
      client.res.write(payload);
    }
  }
};

/**
 * Push an event only to clients belonging to the given tenant.
 * Platform super admin clients (tenantId null) also receive the event.
 * @param {string} tenantId
 * @param {{ type: string, data?: any, message?: string }} event
 */
export const broadcastToTenant = (tenantId, event) => {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const [, client] of clients) {
    if (client.res.writableEnded) continue;
    if (client.tenantId === tenantId || client.tenantId === null) {
      client.res.write(payload);
    }
  }
};

/**
 * Get count of connected SSE clients.
 */
export const getConnectedCount = () => clients.size;
