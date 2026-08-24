import * as recurringExpenseService from './recurringExpense.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllRecurringExpenses = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const branchId = req.selectedBranchId || null;
    const data = await recurringExpenseService.getAllRecurringExpenses(tenantId, branchId);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const createRecurringExpense = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const data = await recurringExpenseService.createRecurringExpense(req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'recurring-expense', entityId: data._id, entityType: 'RecurringExpense', details: { title: data.title, amount: data.amount }, req });
    return ApiResponse.created(res, data, 'Recurring expense created');
  } catch (error) { next(error); }
};

export const updateRecurringExpense = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const data = await recurringExpenseService.updateRecurringExpense(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'recurring-expense', entityId: data._id, entityType: 'RecurringExpense', details: { title: data.title }, req });
    return ApiResponse.success(res, data, 'Recurring expense updated');
  } catch (error) { next(error); }
};

export const deleteRecurringExpense = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await recurringExpenseService.deleteRecurringExpense(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'recurring-expense', entityId: req.params.id, entityType: 'RecurringExpense', req });
    return ApiResponse.success(res, null, 'Recurring expense deleted');
  } catch (error) { next(error); }
};

export const processRecurringExpenses = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const result = await recurringExpenseService.processRecurringExpenses(tenantId);
    return ApiResponse.success(res, result, `Processed ${result.processed} recurring expense(s)`);
  } catch (error) { next(error); }
};
