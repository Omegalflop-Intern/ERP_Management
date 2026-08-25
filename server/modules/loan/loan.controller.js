import * as loanService from './loan.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllLoans = async (req, res, next) => {
  try {
    const type = req.query.type || 'LOAN_TAKEN';
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const result = await loanService.getAllLoans(type, tenantId, branchId);
    return ApiResponse.success(res, result);
  } catch (error) { next(error); }
};

export const createLoan = async (req, res, next) => {
  try {
    const username = req.user?.username || 'system';
    const tenantId = req.user?.tenantId || null;
    const loan = await loanService.createLoan(req.body, username, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'loan', entityId: loan._id, entityType: 'Loan', details: { provider: loan.providerName, amount: loan.loanAmount }, req });
    return ApiResponse.created(res, loan, 'Loan record created successfully');
  } catch (error) { next(error); }
};

export const getLoanById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const loan = await loanService.getLoanById(req.params.id, tenantId);
    return ApiResponse.success(res, loan);
  } catch (error) { next(error); }
};

export const repayLoanInstalment = async (req, res, next) => {
  try {
    const username = req.user?.username || 'system';
    const tenantId = req.user?.tenantId || null;
    const result = await loanService.repayLoanInstalment(req.params.id, req.body, username, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'REPAY', module: 'loan', entityId: req.params.id, entityType: 'LoanRepayment', details: { amount: req.body.amount }, req });
    return ApiResponse.success(res, result, 'Loan repayment recorded successfully');
  } catch (error) { next(error); }
};

export const deleteLoan = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await loanService.deleteLoan(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'loan', entityId: req.params.id, entityType: 'Loan', req });
    return ApiResponse.success(res, null, 'Loan record deleted');
  } catch (error) { next(error); }
};
