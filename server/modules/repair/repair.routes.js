import { Router } from 'express';
import * as repairController from './repair.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { createRepairSchema, updateStatusSchema, updateRepairSchema } from './repair.validator.js';

const router = Router();

router.use(authenticate);

router.get('/stats', repairController.getRepairStats);
router.get('/', repairController.getAllRepairs);
router.get('/:id', repairController.getRepairById);
router.post('/', validate(createRepairSchema), repairController.createRepair);
router.patch('/:id/status', validate(updateStatusSchema), repairController.updateRepairStatus);
router.put('/:id', validate(updateRepairSchema), repairController.updateRepair);
router.delete('/:id', repairController.deleteRepair);

export default router;
