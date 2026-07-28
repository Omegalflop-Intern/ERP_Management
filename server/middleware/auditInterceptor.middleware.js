import { AuditLog } from '../models/AuditLog.js';

export const auditDiffInterceptor = (moduleName, modelGetter) => {
  return async (req, res, next) => {
    const method = req.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next();
    }

    let previousState = null;
    const entityId = req.params.id || req.body._id;

    if (entityId && modelGetter && ['PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        const Model = modelGetter();
        if (Model) {
          previousState = await Model.findById(entityId).lean();
        }
      } catch (e) {
        // Continue even if pre-fetch fails
      }
    }

    const originalJson = res.json;
    res.json = function (body) {
      res.json = originalJson;

      // After response is processed, log diff asynchronously
      if (res.statusCode >= 200 && res.statusCode < 300 && body?.success) {
        const newState = body.data || req.body;
        const targetId = entityId || newState?._id;

        const actionName =
          method === 'POST' ? 'CREATE' : method === 'DELETE' ? 'DELETE' : 'UPDATE';

        const diff = {
          oldValue: previousState || null,
          newValue: method === 'DELETE' ? null : newState || null,
        };

        AuditLog.create({
          userId: req.user?.userId,
          username: req.user?.username,
          fullName: req.user?.fullName,
          roleName: req.user?.roleName,
          phone: req.user?.phone,
          action: actionName,
          module: moduleName,
          entityId: targetId,
          entityType: moduleName,
          details: diff,
          ipAddress: req.ip || req.headers?.['x-forwarded-for'],
          userAgent: req.headers?.['user-agent'],
        }).catch((err) => console.error('AuditInterceptor failed to record diff:', err.message));
      }

      return originalJson.call(this, body);
    };

    next();
  };
};
