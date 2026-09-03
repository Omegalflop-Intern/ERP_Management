import * as investorService from './investor.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllInvestors = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const result = await investorService.getAllInvestors(tenantId);
    return ApiResponse.success(res, result);
  } catch (error) { next(error); }
};

export const createInvestor = async (req, res, next) => {
  try {
    const username = req.user?.username || 'system';
    const tenantId = req.user?.tenantId || null;
    const investor = await investorService.createInvestor(req.body, username, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'investor', entityId: investor._id, entityType: 'Investor', details: { name: investor.name }, req });
    return ApiResponse.created(res, investor, 'Investor profile created successfully');
  } catch (error) { next(error); }
};

export const getInvestorById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const data = await investorService.getInvestorById(req.params.id, tenantId);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const addInvestorTransaction = async (req, res, next) => {
  try {
    const username = req.user?.username || 'system';
    const tenantId = req.user?.tenantId || null;
    const result = await investorService.addInvestorTransaction(req.params.id, req.body, username, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'TRANSACTION', module: 'investor', entityId: req.params.id, entityType: 'InvestorTransaction', details: { type: req.body.type, amount: req.body.amount }, req });
    return ApiResponse.success(res, result, `Investment transaction (${req.body.type}) recorded successfully`);
  } catch (error) { next(error); }
};

export const updateInvestor = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const investor = await investorService.updateInvestor(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'investor', entityId: investor._id, entityType: 'Investor', req });
    return ApiResponse.success(res, investor, 'Investor updated successfully');
  } catch (error) { next(error); }
};

export const deleteInvestor = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await investorService.deleteInvestor(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'investor', entityId: req.params.id, entityType: 'Investor', req });
    return ApiResponse.success(res, null, 'Investor removed');
  } catch (error) { next(error); }
};

export const getAllTransactions = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const txs = await investorService.getAllTransactions(tenantId);
    return ApiResponse.success(res, txs);
  } catch (error) { next(error); }
};

export const calculateProfitLoss = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.user?.tenantId || null;
    const { calculateProfitDistribution } = await import('./profitDistribution.service.js');
    const result = await calculateProfitDistribution(startDate, endDate, tenantId);
    return ApiResponse.success(res, result);
  } catch (error) { next(error); }
};

export const distributeProfitLoss = async (req, res, next) => {
  try {
    const username = req.user?.username || 'system';
    const tenantId = req.user?.tenantId || null;
    const { executeShareDistribution } = await import('./profitDistribution.service.js');
    const result = await executeShareDistribution(req.body, username, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DISTRIBUTION', module: 'investor', entityId: result.investor._id, entityType: 'Investor', details: { actionType: req.body.actionType, amount: req.body.amount }, req });
    return ApiResponse.success(res, result, `Profit share distribution (${req.body.actionType}) processed successfully`);
  } catch (error) { next(error); }
};
