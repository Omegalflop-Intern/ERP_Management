import * as profileService from './profile.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';
import { validateUploadedFile } from '../../config/upload.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await profileService.getProfile(req.user.userId);
    return ApiResponse.success(res, user);
  } catch (error) { next(error); }
};

export const updateProfile = async (req, res, next) => {
  try {
    await validateUploadedFile(req);
    const user = await profileService.updateProfile(req.user.userId, req.body, req.file);
    logAction({ userId: req.user.userId, username: req.user.username, action: 'UPDATE_PROFILE', module: 'super-admin', entityId: user._id, entityType: 'User', details: { username: user.username }, req });
    return ApiResponse.success(res, user, 'Profile updated successfully');
  } catch (error) { next(error); }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await profileService.changePassword(req.user.userId, currentPassword, newPassword);
    logAction({ userId: req.user.userId, username: req.user.username, action: 'CHANGE_PASSWORD', module: 'super-admin', entityType: 'User', req });
    return ApiResponse.success(res, null, result.message);
  } catch (error) { next(error); }
};
