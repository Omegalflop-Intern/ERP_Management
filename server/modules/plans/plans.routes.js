import { Router } from 'express';
import { listPlans } from './plans.controller.js';

const router = Router();

/**
 * @swagger
 * /plans:
 *   get:
 *     tags:
 *       - Plans
 *     summary: Get all active subscription plans (public)
 *     description: Returns all active SaaS subscription plans. No authentication required.
 *     responses:
 *       200:
 *         description: List of active subscription plans
 */
router.get('/', listPlans);

export default router;
