import { Router } from 'express';
import * as profileController from './profile.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../../middleware/tenant.middleware.js';
import { uploadAvatar } from '../../config/upload.js';

const router = Router();

router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/profile', profileController.getProfile);
router.put('/profile', uploadAvatar, profileController.updateProfile);
router.patch('/profile/password', profileController.changePassword);

export default router;
