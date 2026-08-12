import * as expenseService from './expense.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllExpenses = async (req, res, next) => {
  try {
    const { category, from, to, search, branchId } = req.query;
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || branchId || null;
    const result = await expenseService.getAllExpenses({ category, from, to, search, branchId: effectiveBranchId }, tenantId);
    return ApiResponse.success(res, result);
  } catch (error) { next(error); }
};

export const createExpense = async (req, res, next) => {
  try {
    const username = req.user?.username || 'system';
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.body.branchId || req.selectedBranchId || req.user?.branchId || null;
    const expenseData = { ...req.body, branchId: effectiveBranchId };
    const expense = await expenseService.createExpense(expenseData, username, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'expense', entityId: expense._id, entityType: 'Expense', details: { title: expense.title, amount: expense.amount }, req });
    return ApiResponse.created(res, expense, 'Expense recorded successfully');
  } catch (error) { next(error); }
};

export const updateExpense = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const expense = await expenseService.updateExpense(req.params.id, req.body, tenantId, branchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'expense', entityId: expense._id, entityType: 'Expense', details: { title: expense.title, amount: expense.amount }, req });
    return ApiResponse.success(res, expense, 'Expense updated successfully');
  } catch (error) { next(error); }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    await expenseService.deleteExpense(req.params.id, tenantId, branchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'expense', entityId: req.params.id, entityType: 'Expense', req });
    return ApiResponse.success(res, null, 'Expense deleted');
  } catch (error) { next(error); }
};

export const getExpenseCategories = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const categories = await expenseService.getExpenseCategories(tenantId);
    return ApiResponse.success(res, categories);
  } catch (error) { next(error); }
};
