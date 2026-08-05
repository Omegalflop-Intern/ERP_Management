import * as tempAdminService from './tempAdmin.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';

const DURATIONS = {
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '5h': 5 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

export const createTempAdmin = async (req, res, next) => {
  try {
    const { duration, reason } = req.body;
    const durationMs = DURATIONS[duration] || parseInt(duration, 10);

    if (!durationMs || durationMs <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid duration' });
    }

    const result = await tempAdminService.createTempAdmin({
      tenantId: req.params.id,
      duration: durationMs,
      reason,
      createdBy: req.user.userId,
    });

    return ApiResponse.created(res, result, 'Temp admin created successfully');
  } catch (error) {
    next(error);
  }
};

export const getShopTempAdmins = async (req, res, next) => {
  try {
    const admins = await tempAdminService.getActiveTempAdmins(req.params.id);
    return ApiResponse.success(res, admins, 'Temp admins retrieved');
  } catch (error) {
    next(error);
  }
};

export const getAllActiveTempAdmins = async (req, res, next) => {
  try {
    const admins = await tempAdminService.getAllActiveTempAdmins();
    return ApiResponse.success(res, admins, 'Active temp admins retrieved');
  } catch (error) {
    next(error);
  }
};

export const revokeTempAdmin = async (req, res, next) => {
  try {
    const result = await tempAdminService.revokeTempAdmin(req.params.id, req.user.userId);
    return ApiResponse.success(res, result, 'Temp admin revoked');
  } catch (error) {
    next(error);
  }
};
