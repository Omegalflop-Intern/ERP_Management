import * as investorService from './investor.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllInvestors = async (req, res, next) => {
  try {
    const result = await investorService.getAllInvestors();
    return ApiResponse.success(res, result);
  } catch (error) { next(error); }
};

export const createInvestor = async (req, res, next) => {
  try {
    const username = req.user?.username || 'system';
    const investor = await investorService.createInvestor(req.body, username);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'investor', entityId: investor._id, entityType: 'Investor', details: { name: investor.name }, req });
    return ApiResponse.created(res, investor, 'Investor profile created successfully');
  } catch (error) { next(error); }
};

export const getInvestorById = async (req, res, next) => {
  try {
    const data = await investorService.getInvestorById(req.params.id);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const addInvestorTransaction = async (req, res, next) => {
  try {
    const username = req.user?.username || 'system';
    const result = await investorService.addInvestorTransaction(req.params.id, req.body, username);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'TRANSACTION', module: 'investor', entityId: req.params.id, entityType: 'InvestorTransaction', details: { type: req.body.type, amount: req.body.amount }, req });
    return ApiResponse.success(res, result, `Investment transaction (${req.body.type}) recorded successfully`);
  } catch (error) { next(error); }
};

export const updateInvestor = async (req, res, next) => {
  try {
    const investor = await investorService.updateInvestor(req.params.id, req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'investor', entityId: investor._id, entityType: 'Investor', req });
    return ApiResponse.success(res, investor, 'Investor updated successfully');
  } catch (error) { next(error); }
};

export const deleteInvestor = async (req, res, next) => {
  try {
    await investorService.deleteInvestor(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'investor', entityId: req.params.id, entityType: 'Investor', req });
    return ApiResponse.success(res, null, 'Investor removed');
  } catch (error) { next(error); }
};

export const getAllTransactions = async (req, res, next) => {
  try {
    const txs = await investorService.getAllTransactions();
    return ApiResponse.success(res, txs);
  } catch (error) { next(error); }
};
