import { logAction } from '../utils/auth/auditLog.js';

export const auditDiffInterceptor = (moduleName) => {
  return async (req, res, next) => {
    const method = req.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next();
    }

    const entityId = req.params.id || req.body.id || req.body._id;
    const originalJson = res.json;

    res.json = function (body) {
      res.json = originalJson;

      if (res.statusCode >= 200 && res.statusCode < 300 && body?.success) {
        const newState = body.data || req.body;
        const targetId = entityId || newState?.id || newState?._id;
        const actionName = method === 'POST' ? 'CREATE' : method === 'DELETE' ? 'DELETE' : 'UPDATE';

        logAction({
          userId: req.user?.userId || req.user?.id,
          username: req.user?.username,
          fullName: req.user?.fullName,
          roleName: req.user?.roleName,
          phone: req.user?.phone,
          action: actionName,
          module: moduleName,
          entityId: targetId,
          entityType: moduleName,
          details: { state: newState },
          req,
        }).catch((err) => console.error('AuditInterceptor failed to record diff:', err.message));
      }

      return originalJson.call(this, body);
    };

    next();
  };
};
