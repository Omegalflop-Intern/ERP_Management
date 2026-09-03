import { Router } from 'express';
import * as accountingController from './accounting.controller.js';
import * as accountingService from './accounting.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { createAccountSchema, updateAccountSchema, createJournalEntrySchema, postJournalEntrySchema } from './accounting.validator.js';
import { generateBalanceSheetPdf, generateProfitLossPdf, generateTrialBalancePdf, generateCashFlowPdf } from '../../services/financialReportPdf.service.js';

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
router.get('/reports/cash-flow', accountingController.getCashFlowStatement);

// PDF Exports
router.get('/reports/balance-sheet/pdf', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const data = await accountingService.getBalanceSheet(req.query.asOfDate || '', tenantId);
    const pdf = await generateBalanceSheetPdf(data, tenantId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=balance-sheet.pdf');
    res.send(pdf);
  } catch (err) { next(err); }
});
router.get('/reports/profit-loss/pdf', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const data = await accountingService.getProfitLoss(req.query.from || '', req.query.to || '', tenantId);
    const pdf = await generateProfitLossPdf(data, tenantId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=profit-loss.pdf');
    res.send(pdf);
  } catch (err) { next(err); }
});
router.get('/reports/trial-balance/pdf', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const data = await accountingService.getTrialBalance(tenantId);
    const pdf = await generateTrialBalancePdf(data, tenantId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=trial-balance.pdf');
    res.send(pdf);
  } catch (err) { next(err); }
});
router.get('/reports/cash-flow/pdf', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const data = await accountingService.getCashFlowStatement(req.query.from || '', req.query.to || '', tenantId);
    const pdf = await generateCashFlowPdf(data, tenantId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=cash-flow.pdf');
    res.send(pdf);
  } catch (err) { next(err); }
});

// Assets
router.get('/assets', accountingController.getAssets);
router.post('/assets', authorize('ADMIN', 'MANAGER'), accountingController.createAsset);
router.delete('/assets/:id', authorize('ADMIN', 'MANAGER'), accountingController.deleteAsset);

export default router;
