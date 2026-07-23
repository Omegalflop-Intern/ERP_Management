import { Router } from 'express';
import * as settingsController from './settings.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

import { uploadCompanyLogo } from '../../config/upload.js';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', settingsController.getAllSettings);
router.get('/array', settingsController.getSettingsArray);
router.put('/', settingsController.updateSettings);
router.post('/logo', uploadCompanyLogo, settingsController.uploadLogo);

// Database Backup & Restore routes
router.get('/backup', settingsController.exportBackup);           // Download backup to browser
router.post('/backup/now', settingsController.triggerManualBackup); // Save backup to server disk
router.post('/restore', settingsController.restoreBackup);

export default router;
