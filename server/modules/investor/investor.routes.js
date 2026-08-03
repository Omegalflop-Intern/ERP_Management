import { Router } from 'express';
import * as investorController from './investor.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate);
router.use(checkTenantStatus);

router.get('/', investorController.getAllInvestors);
router.get('/transactions', investorController.getAllTransactions);
router.get('/profit-loss/calculate', investorController.calculateProfitLoss);
router.post('/profit-loss/distribute', authorize('ADMIN', 'MANAGER'), investorController.distributeProfitLoss);
router.get('/:id', investorController.getInvestorById);
router.post('/', authorize('ADMIN', 'MANAGER'), investorController.createInvestor);
router.put('/:id', authorize('ADMIN', 'MANAGER'), investorController.updateInvestor);
router.post('/:id/transactions', authorize('ADMIN', 'MANAGER'), investorController.addInvestorTransaction);
router.delete('/:id', authorize('ADMIN'), investorController.deleteInvestor);

export default router;
