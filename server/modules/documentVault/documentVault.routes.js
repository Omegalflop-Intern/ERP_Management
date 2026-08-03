import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { uploadDocument as uploadMiddleware } from '../../config/upload.js';
import * as documentVaultController from './documentVault.controller.js';

const router = Router();

router.use(authenticate);
router.use(checkTenantStatus);

router.get('/', documentVaultController.getDocuments);
router.post('/upload', uploadMiddleware, documentVaultController.uploadDocument);
router.delete('/:id', documentVaultController.deleteDocument);

export default router;
