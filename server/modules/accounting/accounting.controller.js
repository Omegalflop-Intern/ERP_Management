import * as accountingService from './accounting.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';
import { db } from '../../config/db.knex.js';

function applyTenantScope(query, tenantId, tablePrefix = 'accounts') {
  if (tenantId) {
    query.where(`${tablePrefix}.tenant_id`, tenantId);
  }
}

export const getAllAccounts = async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search = '', type = '' } = req.query;
    const tenantId = req.user?.tenantId || null;

    try {
      await accountingService.syncHistoricalJournals(tenantId);
    } catch (err) {
      console.error('[Accounts Sync Error]:', err.message);
    }

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
    const account = await accountingService.createAccount({ ...req.body, tenantId });
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
    const { page = 1, limit = 50, search = '', status = '', fromDate = '', toDate = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const result = await accountingService.getAllJournalEntries(Number(page), Number(limit), search, status, fromDate, toDate, tenantId);
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
    const entry = await accountingService.createJournalEntry({ ...req.body, tenantId, postedBy: req.user?.username });
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
    const fromDate = req.query.from || req.query.startDate || '';
    const toDate = req.query.to || req.query.endDate || '';
    const tenantId = req.user?.tenantId || null;
    const data = await accountingService.getProfitLoss(fromDate, toDate, tenantId);
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

export const getCashFlowStatement = async (req, res, next) => {
  try {
    const { from = '', to = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const data = await accountingService.getCashFlowStatement(from, to, tenantId);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

function formatAssetRow(a) {
  let uLife = 36;
  let pDate = a.created_at;
  let sValue = 0;
  if (a.description) {
    const lifeMatch = a.description.match(/Useful life:\s*(\d+)/i);
    if (lifeMatch) uLife = Number(lifeMatch[1]);
    const dateMatch = a.description.match(/acquired on\s*([\d-]+)/i);
    if (dateMatch) pDate = dateMatch[1];
  }
  const pCost = Number(a.balance || 0);
  return {
    _id: String(a.id),
    id: a.id,
    assetName: a.name,
    category: a.sub_type || 'FURNITURE',
    purchaseDate: pDate,
    purchaseCost: pCost,
    currentBookValue: pCost,
    usefulLifeMonths: uLife,
    salvageValue: sValue,
    code: a.code,
  };
}

export const getAssets = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const query = db('accounts').where({ type: 'ASSET', is_deleted: false });
    applyTenantScope(query, tenantId, 'accounts');
    query.whereNotIn('code', ['1000', '1010', '1011', '1012', '1013', '1020', '1030']);
    const rows = await query.orderBy('created_at', 'desc');

    const mappedAssets = rows.map((a) => formatAssetRow(a));
    return ApiResponse.success(res, mappedAssets);
  } catch (error) { next(error); }
};

export const createAsset = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const data = req.body;
    const pCost = Number(data.purchaseCost || data.balance || 0);
    const code = `AST-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
    const account = await accountingService.createAccount({
      code,
      name: data.assetName || data.name || 'Shop Asset',
      type: 'ASSET',
      subType: data.category || 'FURNITURE',
      balance: pCost,
      description: `Asset acquired on ${data.purchaseDate || new Date().toISOString().split('T')[0]} (Useful life: ${data.usefulLifeMonths || 36} mos)`,
      tenantId,
    });

    if (pCost > 0) {
      const capitalQuery = db('accounts').where({ code: '3000', is_deleted: false });
      applyTenantScope(capitalQuery, tenantId, 'accounts');
      const capitalAcct = await capitalQuery.first();
      if (capitalAcct) {
        await accountingService.createJournalEntry({
          tenantId,
          date: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
          description: `Shop Asset Acquisition: ${account.name}`,
          reference: `AST-BUY-${account.id}`,
          lines: [
            { accountId: account.id, code: account.code, accountName: account.name, debit: pCost, credit: 0 },
            { accountId: capitalAcct.id, code: capitalAcct.code, accountName: capitalAcct.name, debit: 0, credit: pCost },
          ],
        });
      }
    }

    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE_ASSET', module: 'accounting', entityId: account.id, entityType: 'Account', details: { name: account.name, code: account.code }, req });
    return ApiResponse.created(res, {
      _id: String(account.id),
      id: account.id,
      assetName: account.name,
      category: account.subType || 'FURNITURE',
      purchaseDate: data.purchaseDate || account.createdAt,
      purchaseCost: pCost,
      currentBookValue: pCost,
      usefulLifeMonths: Number(data.usefulLifeMonths || 36),
      salvageValue: Number(data.salvageValue || 0),
    }, 'Asset registered successfully');
  } catch (error) { next(error); }
};

export const deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || null;
    const q = db('accounts').where({ id, type: 'ASSET' });
    applyTenantScope(q, tenantId, 'accounts');
    await q.update({ is_deleted: true });
    return ApiResponse.success(res, null, 'Asset deleted successfully');
  } catch (error) { next(error); }
};
