import { Router } from 'express';
import * as settingsController from './settings.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus, requireSuperAdmin } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

import { uploadCompanyLogo } from '../../config/upload.js';

const router = Router();

// Unauthenticated public route for Landing Page, Footer, and Shop Registration Activation
router.get('/public', settingsController.getPublicSettings);

router.use(authenticate);
router.use(checkTenantStatus);

// Super-Admin platform settings routes
router.get('/platform', requireSuperAdmin, settingsController.getPlatformSettings);
router.put('/platform', requireSuperAdmin, settingsController.updatePlatformSettings);

router.use(authorize('ADMIN'));

router.get('/', settingsController.getAllSettings);
router.get('/array', settingsController.getSettingsArray);
router.put('/', settingsController.updateSettings);
router.post('/logo', uploadCompanyLogo, settingsController.uploadLogo);

// Database Backup & Restore routes — super-admin only (cross-tenant data)
router.get('/backup', requireSuperAdmin, settingsController.exportBackup);
router.get('/backup/list', requireSuperAdmin, settingsController.listBackups);
router.post('/backup/now', requireSuperAdmin, settingsController.triggerManualBackup);
router.post('/restore', requireSuperAdmin, settingsController.restoreBackup);

export default router;
