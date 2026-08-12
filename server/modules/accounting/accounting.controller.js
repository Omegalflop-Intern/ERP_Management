import * as accountingService from './accounting.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';


export const getAllAccounts = async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search = '', type = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const result = await accountingService.getAllAccounts(Number(page), Number(limit), search, type, tenantId);
    return ApiResponse.paginated(res, result.accounts, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getAccountById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const account = await accountingService.getAccountById(req.params.id, tenantId);
    return ApiResponse.success(res, account);
  } catch (error) { next(error); }
};

export const createAccount = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const account = await accountingService.createAccount(req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'accounting', entityId: account.id, entityType: 'Account', details: { name: account.name, code: account.code }, req });
    return ApiResponse.created(res, account, 'Account created');
  } catch (error) { next(error); }
};

export const updateAccount = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const account = await accountingService.updateAccount(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'accounting', entityId: account.id, entityType: 'Account', details: { name: account.name }, req });
    return ApiResponse.success(res, account, 'Account updated');
  } catch (error) { next(error); }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await accountingService.deleteAccount(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'accounting', entityId: req.params.id, entityType: 'Account', req });
    return ApiResponse.success(res, null, 'Account deleted');
  } catch (error) { next(error); }
};

export const seedDefaults = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const result = await accountingService.seedDefaultAccounts(tenantId);
    return ApiResponse.success(res, result, 'Default accounts seeded');
  } catch (error) { next(error); }
};

export const getJournalEntries = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, fromDate = '', toDate = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const result = await accountingService.getAllJournalEntries(Number(page), Number(limit), '', '', fromDate, toDate, tenantId, branchId);
    return ApiResponse.paginated(res, result.entries, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getJournalEntryById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const entry = await accountingService.getJournalEntryById(req.params.id, tenantId);
    return ApiResponse.success(res, entry);
  } catch (error) { next(error); }
};

export const createJournalEntry = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const entry = await accountingService.createJournalEntry(req.body, req.user?.username, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE_JOURNAL', module: 'accounting', entityId: entry.id, entityType: 'JournalEntry', details: { voucherNumber: entry.voucherNumber, totalAmount: entry.totalAmount }, req });
    return ApiResponse.created(res, entry, 'Journal entry recorded');
  } catch (error) { next(error); }
};

export const postJournalEntry = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const entry = await accountingService.postJournalEntry(req.params.id, req.user?.username || 'system', tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'POST_JOURNAL', module: 'accounting', entityId: entry._id, entityType: 'JournalEntry', req });
    return ApiResponse.success(res, entry, 'Journal entry posted');
  } catch (error) { next(error); }
};

export const voidJournalEntry = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const entry = await accountingService.voidJournalEntry(req.params.id, req.user?.username || 'system', tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'VOID_JOURNAL', module: 'accounting', entityId: entry._id, entityType: 'JournalEntry', req });
    return ApiResponse.success(res, entry, 'Journal entry voided');
  } catch (error) { next(error); }
};

export const deleteJournalEntry = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await accountingService.deleteJournalEntry(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE_JOURNAL', module: 'accounting', entityId: req.params.id, entityType: 'JournalEntry', req });
    return ApiResponse.success(res, null, 'Journal entry deleted');
  } catch (error) { next(error); }
};

export const syncHistoricalJournals = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const result = await accountingService.syncHistoricalJournals(tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'SYNC_JOURNALS', module: 'accounting', entityType: 'JournalEntry', details: { count: result.syncedCount }, req });
    return ApiResponse.success(res, result, result.message);
  } catch (error) { next(error); }
};

export const getLedger = async (req, res, next) => {
  try {
    const { accountId, fromDate = '', toDate = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const ledger = await accountingService.getLedger(accountId, fromDate, toDate, tenantId);
    return ApiResponse.success(res, ledger);
  } catch (error) { next(error); }
};

export const getProfitLoss = async (req, res, next) => {
  try {
    const { startDate = '', endDate = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const data = await accountingService.getProfitLoss(startDate, endDate, tenantId, branchId);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const getBalanceSheet = async (req, res, next) => {
  try {
    const { asOfDate = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const data = await accountingService.getBalanceSheet(asOfDate, tenantId);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const getTrialBalance = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const data = await accountingService.getTrialBalance(tenantId);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const getAssets = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const result = await accountingService.getAllAccounts(1, 100, '', 'ASSET', tenantId);
    return ApiResponse.success(res, result.accounts);
  } catch (error) { next(error); }
};

export const createAsset = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const account = await accountingService.createAccount({ ...req.body, type: 'ASSET' }, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE_ASSET', module: 'accounting', entityId: account.id, entityType: 'Account', details: { name: account.name, code: account.code }, req });
    return ApiResponse.created(res, account, 'Asset registered successfully');
  } catch (error) { next(error); }
};
