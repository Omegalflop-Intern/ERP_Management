import { Router } from 'express';
import * as auditController from './auditLog.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../../middleware/tenant.middleware.js';

const router = Router();
router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/', auditController.getSuperAdminAuditLogs);
router.get('/stats', auditController.getAuditLogStats);

export default router;
