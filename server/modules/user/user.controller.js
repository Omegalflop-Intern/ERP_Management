import * as userService from './user.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';
import { validateUploadedFile } from '../../config/upload.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const tenantId = req.user?.tenantId || null;
    const result = await userService.getAllUsers(Number(page), Number(limit), search, tenantId);
    return ApiResponse.paginated(res, result.users, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getUserById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const user = await userService.getUserById(req.params.id, tenantId);
    return ApiResponse.success(res, user);
  } catch (error) { next(error); }
};

export const createUser = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const user = await userService.createUser(req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'user', entityId: user._id, entityType: 'User', details: { username: user.username, email: user.email }, req });
    return ApiResponse.created(res, user, 'User created successfully');
  } catch (error) { next(error); }
};

export const updateUser = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const user = await userService.updateUser(req.params.id, req.body, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'user', entityId: user._id, entityType: 'User', details: { username: user.username }, req });
    return ApiResponse.success(res, user, 'User updated successfully');
  } catch (error) { next(error); }
};

export const deleteUser = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    await userService.deleteUser(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'user', entityId: req.params.id, entityType: 'User', req });
    return ApiResponse.success(res, null, 'User deleted successfully');
  } catch (error) { next(error); }
};

export const toggleVerification = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const user = await userService.toggleVerification(req.params.id, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'TOGGLE_VERIFICATION', module: 'user', entityId: user._id, entityType: 'User', details: { username: user.username, isVerified: user.isVerified }, req });
    return ApiResponse.success(res, { isVerified: user.isVerified }, `User ${user.isVerified ? 'verified' : 'unverified'} successfully`);
  } catch (error) { next(error); }
};

import { ApiError } from '../../utils/http/ApiError.js';

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const isAdmin = req.user.roleName === 'ADMIN';
    const isOwnPassword = req.user.userId.toString() === req.params.id;
    if (!isAdmin && !isOwnPassword) {
      throw ApiError.forbidden('You can only change your own password');
    }
    const tenantId = req.user?.tenantId || null;
    await userService.changePassword(req.params.id, currentPassword, newPassword, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CHANGE_PASSWORD', module: 'user', entityId: req.params.id, entityType: 'User', req });
    return ApiResponse.success(res, null, 'Password changed successfully');
  } catch (error) { next(error); }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const user = await userService.getMyProfile(req.user.userId, tenantId);
    return ApiResponse.success(res, user);
  } catch (error) { next(error); }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    await validateUploadedFile(req);
    const tenantId = req.user?.tenantId || null;
    const user = await userService.updateMyProfile(req.user.userId, req.body, req.file, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE_PROFILE', module: 'user', entityId: user._id, entityType: 'User', details: { username: user.username }, req });
    return ApiResponse.success(res, user, 'Profile updated successfully');
  } catch (error) { next(error); }
};
