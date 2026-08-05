import { Router } from 'express';
import * as plansController from './plans.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../../middleware/tenant.middleware.js';

const router = Router();

// Public — pricing page
router.get('/', plansController.listPlans);

// Super admin only — plan management
router.get('/manage', authenticate, requireSuperAdmin, plansController.getAllPlans);
router.get('/manage/:id', authenticate, requireSuperAdmin, plansController.getPlanById);
router.post('/manage', authenticate, requireSuperAdmin, plansController.createPlan);
router.put('/manage/:id', authenticate, requireSuperAdmin, plansController.updatePlan);
router.delete('/manage/:id', authenticate, requireSuperAdmin, plansController.deletePlan);
router.patch('/manage/:id/toggle', authenticate, requireSuperAdmin, plansController.togglePlanActive);

export default router;
