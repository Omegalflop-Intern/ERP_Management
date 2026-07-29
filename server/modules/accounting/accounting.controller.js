import * as accountingService from './accounting.service.js';
import { Asset } from './asset.model.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';


export const getAllAccounts = async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search = '', type = '' } = req.query;
    const result = await accountingService.getAllAccounts(Number(page), Number(limit), search, type);
    return ApiResponse.paginated(res, result.accounts, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getAccountById = async (req, res, next) => {
  try {
    const account = await accountingService.getAccountById(req.params.id);
    return ApiResponse.success(res, account);
  } catch (error) { next(error); }
};

export const createAccount = async (req, res, next) => {
  try {
    const account = await accountingService.createAccount(req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE_ACCOUNT', module: 'accounting', entityId: account._id, entityType: 'Account', details: { name: account.name, type: account.type }, req });
    return ApiResponse.created(res, account, 'Account created');
  } catch (error) { next(error); }
};

export const updateAccount = async (req, res, next) => {
  try {
    const account = await accountingService.updateAccount(req.params.id, req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE_ACCOUNT', module: 'accounting', entityId: account._id, entityType: 'Account', details: { name: account.name }, req });
    return ApiResponse.success(res, account, 'Account updated');
  } catch (error) { next(error); }
};

export const deleteAccount = async (req, res, next) => {
  try {
    await accountingService.deleteAccount(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE_ACCOUNT', module: 'accounting', entityId: req.params.id, entityType: 'Account', req });
    return ApiResponse.success(res, null, 'Account deleted');
  } catch (error) { next(error); }
};

export const seedDefaultAccounts = async (req, res, next) => {
  try {
    const result = await accountingService.seedDefaultAccounts();
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'SEED_ACCOUNTS', module: 'accounting', entityType: 'Account', details: { count: result.count }, req });
    return ApiResponse.success(res, result, result.message);
  } catch (error) { next(error); }
};


export const getAllJournalEntries = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', from = '', to = '' } = req.query;
    const result = await accountingService.getAllJournalEntries(Number(page), Number(limit), search, status, from, to);
    return ApiResponse.paginated(res, result.entries, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getJournalEntryById = async (req, res, next) => {
  try {
    const entry = await accountingService.getJournalEntryById(req.params.id);
    return ApiResponse.success(res, entry);
  } catch (error) { next(error); }
};

export const createJournalEntry = async (req, res, next) => {
  try {
    const entry = await accountingService.createJournalEntry(req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE_JOURNAL', module: 'accounting', entityId: entry._id, entityType: 'JournalEntry', details: { reference: entry.reference }, req });
    return ApiResponse.created(res, entry, 'Journal entry created');
  } catch (error) { next(error); }
};

export const postJournalEntry = async (req, res, next) => {
  try {
    const entry = await accountingService.postJournalEntry(req.params.id, req.user?.username || 'system');
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'POST_JOURNAL', module: 'accounting', entityId: entry._id, entityType: 'JournalEntry', req });
    return ApiResponse.success(res, entry, 'Journal entry posted');
  } catch (error) { next(error); }
};

export const voidJournalEntry = async (req, res, next) => {
  try {
    const entry = await accountingService.voidJournalEntry(req.params.id, req.user?.username || 'system');
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'VOID_JOURNAL', module: 'accounting', entityId: entry._id, entityType: 'JournalEntry', req });
    return ApiResponse.success(res, entry, 'Journal entry voided');
  } catch (error) { next(error); }
};

export const deleteJournalEntry = async (req, res, next) => {
  try {
    await accountingService.deleteJournalEntry(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE_JOURNAL', module: 'accounting', entityId: req.params.id, entityType: 'JournalEntry', req });
    return ApiResponse.success(res, null, 'Journal entry deleted');
  } catch (error) { next(error); }
};

export const syncHistoricalJournals = async (req, res, next) => {
  try {
    const result = await accountingService.syncHistoricalJournals();
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'SYNC_JOURNALS', module: 'accounting', entityType: 'JournalEntry', details: { count: result.syncedCount }, req });
    return ApiResponse.success(res, result, result.message);
  } catch (error) { next(error); }
};


export const getBalanceSheet = async (req, res, next) => {
  try {
    const { asOf = '' } = req.query;
    const data = await accountingService.getBalanceSheet(asOf);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const getProfitLoss = async (req, res, next) => {
  try {
    const { from = '', to = '' } = req.query;
    const data = await accountingService.getProfitLoss(from, to);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const getTrialBalance = async (req, res, next) => {
  try {
    const data = await accountingService.getTrialBalance();
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};


export const getAssets = async (req, res, next) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    return ApiResponse.success(res, assets);
  } catch (error) { next(error); }
};

export const createAsset = async (req, res, next) => {
  try {
    const asset = await Asset.create(req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE_ASSET', module: 'accounting', entityId: asset._id, entityType: 'Asset', details: { name: asset.assetName, cost: asset.purchaseCost }, req });
    return ApiResponse.created(res, asset, 'Asset registered successfully');
  } catch (error) { next(error); }
};
