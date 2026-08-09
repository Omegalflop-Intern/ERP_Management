import { Router } from 'express';
import * as contactController from './contact.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../../middleware/tenant.middleware.js';

const router = Router();

// Public: submit contact inquiry
router.post('/', contactController.submitContact);

// Super Admin: list & update contact inquiries
router.get('/manage', authenticate, requireSuperAdmin, contactController.getContacts);
router.patch('/manage/:id/status', authenticate, requireSuperAdmin, contactController.updateStatus);

export default router;
