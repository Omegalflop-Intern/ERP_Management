const clients = new Map(); // clientId (string) → { userId, res, tenantId }

export const sseConnect = (req, res) => {
  const userId = req.user.userId.toString();
  const tenantId = req.user?.tenantId ? String(req.user.tenantId) : null;
  const clientId = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);
  clients.set(clientId, { userId, res, tenantId });

  const heartbeat = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeat);
      clients.delete(clientId);
      return;
    }
    res.write(': heartbeat\n\n');
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(clientId);
  });
};

/**
 * Push an event to a specific user across all their open connections.
 * @param {string} userId
 * @param {{ type: string, data?: any, message?: string }} event
 */
export const pushToUser = (userId, event) => {
  const uId = String(userId);
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const [clientId, client] of clients) {
    if (client.userId === uId && !client.res.writableEnded) {
      client.res.write(payload);
    }
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
 * Push an event to clients belonging to the given tenant.
 * Platform super admin clients (tenantId null) also receive the event.
 * @param {string} tenantId
 * @param {{ type: string, data?: any, message?: string }} event
 */
export const broadcastToTenant = (tenantId, event) => {
  const tId = tenantId ? String(tenantId) : null;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const [, client] of clients) {
    if (client.res.writableEnded) continue;
    if (!tId || !client.tenantId || String(client.tenantId) === tId) {
      client.res.write(payload);
    }
  }
};

/**
 * Get count of connected SSE clients.
 */
export const getConnectedCount = () => clients.size;
