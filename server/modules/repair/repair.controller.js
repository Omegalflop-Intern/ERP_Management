import * as repairService from './repair.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getAllRepairs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status = '', search = '' } = req.query;
    const result = await repairService.getAllRepairs(Number(page), Number(limit), status, search);
    return ApiResponse.paginated(res, result.repairs, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getRepairById = async (req, res, next) => {
  try {
    const ticket = await repairService.getRepairById(req.params.id);
    return ApiResponse.success(res, ticket);
  } catch (error) { next(error); }
};

export const createRepair = async (req, res, next) => {
  try {
    const ticket = await repairService.createRepair(req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'repair', entityId: ticket._id, entityType: 'RepairTicket', details: { ticketNumber: ticket.ticketNumber }, req });
    return ApiResponse.created(res, ticket, 'Repair ticket created');
  } catch (error) { next(error); }
};

export const updateRepairStatus = async (req, res, next) => {
  try {
    const ticket = await repairService.updateRepairStatus(req.params.id, req.body.status);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE_STATUS', module: 'repair', entityId: ticket._id, entityType: 'RepairTicket', details: { status: ticket.status }, req });
    return ApiResponse.success(res, ticket, `Status updated to ${ticket.status}`);
  } catch (error) { next(error); }
};

export const updateRepair = async (req, res, next) => {
  try {
    const ticket = await repairService.updateRepair(req.params.id, req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'repair', entityId: ticket._id, entityType: 'RepairTicket', req });
    return ApiResponse.success(res, ticket, 'Repair ticket updated');
  } catch (error) { next(error); }
};

export const deleteRepair = async (req, res, next) => {
  try {
    await repairService.deleteRepair(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'repair', entityId: req.params.id, entityType: 'RepairTicket', req });
    return ApiResponse.success(res, null, 'Repair ticket deleted');
  } catch (error) { next(error); }
};

export const getRepairStats = async (req, res, next) => {
  try {
    const stats = await repairService.getRepairStats();
    return ApiResponse.success(res, stats);
  } catch (error) { next(error); }
};
