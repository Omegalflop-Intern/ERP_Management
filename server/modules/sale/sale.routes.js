import { Router } from 'express';
import * as saleController from './sale.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { createSaleSchema, updateSaleSchema, returnSaleSchema } from './sale.validator.js';

const router = Router();

// Public route — no auth required (token-based access, 7-day expiry)
router.get('/public/:token', saleController.getPublicInvoice);
router.get('/public/:token/pdf', saleController.getPublicInvoicePdf);

router.use(authenticate);
router.use(checkTenantStatus);

/**
 * @swagger
 * /sales:
 *   get:
 *     tags:
 *       - Sales
 *     summary: Get all sales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: customer
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, returned, cancelled]
 *     responses:
 *       200:
 *         description: List of sales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sale'
 *                 pagination:
 *                   type: object
 */
router.get('/', saleController.getAllSales);

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     tags:
 *       - Sales
 *     summary: Get sale by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sale details
 *       404:
 *         description: Sale not found
 */
router.get('/:id', saleController.getSaleById);
router.get('/:id/pdf', saleController.getSalePdf);

/**
 * @swagger
 * /sales/invoice/{invoiceNumber}:
 *   get:
 *     tags:
 *       - Sales
 *     summary: Get sale by invoice number
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sale details
 *       404:
 *         description: Sale not found
 */
router.get('/invoice/:invoiceNumber', saleController.getSaleByInvoice);

/**
 * @swagger
 * /sales:
 *   post:
 *     tags:
 *       - Sales
 *     summary: Create a new sale
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               customerName:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - unitPrice
 *                   properties:
 *                     productId:
 *                       type: string
 *                     imeiOrSerial:
 *                       type: string
 *                     qty:
 *                       type: number
 *                       default: 1
 *                     unitPrice:
 *                       type: number
 *                     discount:
 *                       type: number
 *                       default: 0
 *               discount:
 *                 type: number
 *               tax:
 *                 type: number
 *               paymentBreakdown:
 *                 type: object
 *                 properties:
 *                   cash:
 *                     type: number
 *                   bkash:
 *                     type: number
 *                   rocket:
 *                     type: number
 *                   nagad:
 *                     type: number
 *                   bank:
 *                     type: number
 *     responses:
 *       201:
 *         description: Sale created
 *       400:
 *         description: Validation error
 */
router.post('/', validate(createSaleSchema), saleController.createSale);

/**
 * @swagger
 * /sales/{id}/return:
 *   post:
 *     tags:
 *       - Sales
 *     summary: Process a return for a sale
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - lineItemId
 *                     - quantity
 *                   properties:
 *                     lineItemId:
 *                       type: string
 *                     imeiOrSerial:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     reason:
 *                       type: string
 *     responses:
 *       200:
 *         description: Return processed
 *       404:
 *         description: Sale not found
 */
router.post('/:id/return', validate(returnSaleSchema), saleController.processReturn);

/**
 * @swagger
 * /sales/{id}:
 *   put:
 *     tags:
 *       - Sales
 *     summary: Update sale
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentBreakdown:
 *                 type: object
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sale updated
 *       404:
 *         description: Sale not found
 */
router.put('/:id', validate(updateSaleSchema), saleController.updateSale);

/**
 * @swagger
 * /sales/{id}:
 *   delete:
 *     tags:
 *       - Sales
 *     summary: Delete sale (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sale deleted
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', authorize('ADMIN'), saleController.deleteSale);

export default router;

