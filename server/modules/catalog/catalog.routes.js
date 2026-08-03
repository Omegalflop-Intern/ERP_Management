import { Router } from 'express';
import * as catalogController from './catalog.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { createCatalogItemSchema, updateCatalogItemSchema, bulkCreateCatalogSchema } from './catalog.validator.js';

const router = Router();

router.use(authenticate);
router.use(checkTenantStatus);

router.get('/stats', catalogController.getCatalogStats);
router.get('/', catalogController.getAllCatalogItems);
router.get('/:id', catalogController.getCatalogItemById);
router.post('/', validate(createCatalogItemSchema), catalogController.createCatalogItem);
router.post('/bulk', validate(bulkCreateCatalogSchema), catalogController.bulkCreateCatalogItems);
router.put('/:id', validate(updateCatalogItemSchema), catalogController.updateCatalogItem);
router.delete('/:id', catalogController.deleteCatalogItem);

export default router;
