import * as settingsService from './settings.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getPublicSettings();
    return ApiResponse.success(res, settings, 'Public platform settings retrieved');
  } catch (error) { next(error); }
};

export const getPlatformSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getPublicSettings();
    return ApiResponse.success(res, settings, 'Platform settings retrieved');
  } catch (error) { next(error); }
};

export const updatePlatformSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.updatePlatformSettings(req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE_PLATFORM_SETTINGS', module: 'settings', entityType: 'PlatformSettings', details: { keys: Object.keys(req.body) }, req });
    return ApiResponse.success(res, settings, 'Platform settings updated successfully');
  } catch (error) { next(error); }
};

export const getAllSettings = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const settings = await settingsService.getAllSettings(req.query.category, tenantId);
    return ApiResponse.success(res, settings);
  } catch (error) { next(error); }
};

export const getSettingsArray = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const settings = await settingsService.getSettingsArray(req.query.category, tenantId);
    return ApiResponse.success(res, settings);
  } catch (error) { next(error); }
};

export const updateSettings = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const result = await settingsService.updateSettings(req.body, req.user.userId, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE_SETTINGS', module: 'settings', entityType: 'Settings', details: { keys: Object.keys(req.body) }, req });
    return ApiResponse.success(res, result, 'Settings updated');
  } catch (error) { next(error); }
};

export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.badRequest(res, 'No logo file uploaded');
    }
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    const tenantId = req.user?.tenantId || null;
    await settingsService.updateSettings({ companyLogo: logoUrl }, req.user?.userId, tenantId);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPLOAD_LOGO', module: 'settings', entityType: 'Settings', details: { logoUrl }, req });
    return ApiResponse.success(res, { companyLogo: logoUrl }, 'Company logo uploaded successfully');
  } catch (error) { next(error); }
};

export const exportBackup = async (req, res, next) => {
  try {
    const backupData = await settingsService.exportDatabaseBackup();
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'EXPORT_BACKUP', module: 'settings', entityType: 'DatabaseBackup', req });
    const filename = `mobile_shop_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (error) { next(error); }
};

export const restoreBackup = async (req, res, next) => {
  try {
    const result = await settingsService.restoreDatabaseBackup(req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'RESTORE_BACKUP', module: 'settings', entityType: 'DatabaseBackup', details: result, req });
    return ApiResponse.success(res, result, `Database restored successfully (${result.restoredCount} documents in ${result.collectionsCount} collections)`);
  } catch (error) { next(error); }
};

// Triggered by the "Backup Now" button — saves to server/backups/ folder
export const triggerManualBackup = async (req, res, next) => {
  try {
    const filename = await settingsService.runManualBackup();
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'MANUAL_BACKUP', module: 'settings', entityType: 'DatabaseBackup', details: { filename }, req });
    return ApiResponse.success(res, { filename }, `Backup saved to server: ${filename}`);
  } catch (error) { next(error); }
};

export const listBackups = async (req, res, next) => {
  try {
    const backups = await settingsService.listServerBackups();
    return ApiResponse.success(res, backups, 'Server backups listed successfully');
  } catch (error) { next(error); }
};

