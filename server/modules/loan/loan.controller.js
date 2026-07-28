import * as loanService from './loan.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllLoans = async (req, res, next) => {
  try {
    const type = req.query.type || 'LOAN_TAKEN';
    const result = await loanService.getAllLoans(type);
    return ApiResponse.success(res, result);
  } catch (error) { next(error); }
};

export const createLoan = async (req, res, next) => {
  try {
    const username = req.user?.username || 'system';
    const loan = await loanService.createLoan(req.body, username);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'loan', entityId: loan._id, entityType: 'Loan', details: { provider: loan.providerName, amount: loan.loanAmount }, req });
    return ApiResponse.created(res, loan, 'Loan record created successfully');
  } catch (error) { next(error); }
};

export const getLoanById = async (req, res, next) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    return ApiResponse.success(res, loan);
  } catch (error) { next(error); }
};

export const repayLoanInstalment = async (req, res, next) => {
  try {
    const username = req.user?.username || 'system';
    const result = await loanService.repayLoanInstalment(req.params.id, req.body, username);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'REPAY', module: 'loan', entityId: req.params.id, entityType: 'LoanRepayment', details: { amount: req.body.amount }, req });
    return ApiResponse.success(res, result, 'Loan repayment recorded successfully');
  } catch (error) { next(error); }
};

export const deleteLoan = async (req, res, next) => {
  try {
    await loanService.deleteLoan(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'loan', entityId: req.params.id, entityType: 'Loan', req });
    return ApiResponse.success(res, null, 'Loan record deleted');
  } catch (error) { next(error); }
};
