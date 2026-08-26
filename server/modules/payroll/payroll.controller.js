import * as payrollService from './payroll.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllPayroll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, branch = '', month = '', year = '', status = '', branchId } = req.query;
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || branchId || null;
    const result = await payrollService.getAllPayroll(Number(page), Number(limit), branch, month, year, status, tenantId, effectiveBranchId);
    return ApiResponse.paginated(res, result.payrolls || result.records, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const processPayroll = async (req, res, next) => {
  try {
    const { employeeIds, month, year, branchId, allowances, deductions } = req.body;
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = branchId || req.selectedBranchId || req.user?.branchId || null;
    const result = await payrollService.generatePayroll(month, year, employeeIds, tenantId, effectiveBranchId, allowances, deductions);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'PROCESS_PAYROLL', module: 'payroll', entityType: 'Payroll', details: { processed: result.processed?.length, month, year }, req });
    return ApiResponse.created(res, result, `Processed ${result.processed.length} payroll records`);
  } catch (error) { next(error); }
};

export const markAsPaid = async (req, res, next) => {
  try {
    const { paymentMethod, paymentAccount } = req.body || {};
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || null;
    const payroll = await payrollService.markAsPaid(
      req.params.id,
      req.user._id,
      tenantId,
      effectiveBranchId,
      paymentMethod || 'CASH',
      paymentAccount || null
    );
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'MARK_PAID', module: 'payroll', entityId: payroll._id, entityType: 'Payroll', req });
    return ApiResponse.success(res, payroll, 'Marked as paid');
  } catch (error) { next(error); }
};

export const getPayrollSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || null;
    const summary = await payrollService.getPayrollSummary(Number(month), Number(year), tenantId, effectiveBranchId);
    return ApiResponse.success(res, summary);
  } catch (error) { next(error); }
};

export const getPayslip = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || null;
    const payslip = await payrollService.getPayslip(req.params.id, tenantId, effectiveBranchId);
    return ApiResponse.success(res, payslip);
  } catch (error) { next(error); }
};

export const deletePayroll = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const effectiveBranchId = req.selectedBranchId || null;
    await payrollService.deletePayroll(req.params.id, tenantId, effectiveBranchId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'payroll', entityId: req.params.id, entityType: 'Payroll', req });
    return ApiResponse.success(res, null, 'Payroll record deleted');
  } catch (error) { next(error); }
};
