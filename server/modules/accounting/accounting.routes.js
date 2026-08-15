import { Router } from 'express';
import * as accountingController from './accounting.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { createAccountSchema, updateAccountSchema, createJournalEntrySchema, postJournalEntrySchema } from './accounting.validator.js';

const router = Router();

router.use(authenticate);
router.use(checkTenantStatus);

// Accounts
router.get('/accounts', accountingController.getAllAccounts);
router.get('/accounts/:id', accountingController.getAccountById);
router.post('/accounts', authorize('ADMIN', 'MANAGER'), validate(createAccountSchema), accountingController.createAccount);
router.put('/accounts/:id', authorize('ADMIN', 'MANAGER'), validate(updateAccountSchema), accountingController.updateAccount);
router.delete('/accounts/:id', authorize('ADMIN'), accountingController.deleteAccount);
router.post('/accounts/seed', authorize('ADMIN'), accountingController.seedDefaults);

// Journal Entries
router.get('/journal-entries', accountingController.getJournalEntries);
router.get('/journal-entries/:id', accountingController.getJournalEntryById);
router.post('/journal-entries', authorize('ADMIN', 'MANAGER'), validate(createJournalEntrySchema), accountingController.createJournalEntry);
router.post('/journal-entries/sync', authorize('ADMIN', 'MANAGER'), accountingController.syncHistoricalJournals);
router.post('/journal-entries/:id/post', authorize('ADMIN', 'MANAGER'), validate(postJournalEntrySchema), accountingController.postJournalEntry);
router.post('/journal-entries/:id/void', authorize('ADMIN'), accountingController.voidJournalEntry);
router.delete('/journal-entries/:id', authorize('ADMIN'), accountingController.deleteJournalEntry);

// Reports
router.get('/reports/balance-sheet', accountingController.getBalanceSheet);
router.get('/reports/profit-loss', accountingController.getProfitLoss);
router.get('/reports/trial-balance', accountingController.getTrialBalance);

// Assets
router.get('/assets', accountingController.getAssets);
router.post('/assets', authorize('ADMIN', 'MANAGER'), accountingController.createAsset);
router.delete('/assets/:id', authorize('ADMIN', 'MANAGER'), accountingController.deleteAsset);

export default router;
