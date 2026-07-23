import { Router } from 'express';
import { sseConnect } from './sse.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /sse/connect:
 *   get:
 *     summary: Establish SSE connection for real-time events
 *     tags: [SSE]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SSE stream opened
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 */
router.get('/connect', authenticate, sseConnect);

export default router;
