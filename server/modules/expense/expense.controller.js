import * as expenseService from './expense.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllExpenses = async (req, res, next) => {
  try {
    const { category, from, to, search } = req.query;
    const result = await expenseService.getAllExpenses({ category, from, to, search });
    return ApiResponse.success(res, result);
  } catch (error) { next(error); }
};

export const createExpense = async (req, res, next) => {
  try {
    const username = req.user?.username || 'system';
    const expense = await expenseService.createExpense(req.body, username);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'expense', entityId: expense._id, entityType: 'Expense', details: { title: expense.title, amount: expense.amount }, req });
    return ApiResponse.created(res, expense, 'Expense recorded successfully');
  } catch (error) { next(error); }
};

export const updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'expense', entityId: expense._id, entityType: 'Expense', details: { title: expense.title, amount: expense.amount }, req });
    return ApiResponse.success(res, expense, 'Expense updated successfully');
  } catch (error) { next(error); }
};

export const deleteExpense = async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'expense', entityId: req.params.id, entityType: 'Expense', req });
    return ApiResponse.success(res, null, 'Expense deleted');
  } catch (error) { next(error); }
};

export const getExpenseCategories = async (req, res, next) => {
  try {
    const categories = await expenseService.getExpenseCategories();
    return ApiResponse.success(res, categories);
  } catch (error) { next(error); }
};
