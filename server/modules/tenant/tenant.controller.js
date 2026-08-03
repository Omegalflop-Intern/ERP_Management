import * as tenantService from './tenant.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';

export const getTenants = async (req, res, next) => {
  try {
    const tenants = await tenantService.getAllTenants(req.query.search);
    return ApiResponse.success(res, tenants, 'Tenants retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    return ApiResponse.success(res, tenant, 'Tenant details retrieved');
  } catch (error) {
    next(error);
  }
};

export const createTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.createTenant(req.body);
    return ApiResponse.created(res, tenant, 'Shop tenant created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const tenant = await tenantService.updateTenantStatus(req.params.id, status, rejectionReason);
    return ApiResponse.success(res, tenant, `Tenant status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

export const handleVerifyKyc = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const tenant = await tenantService.verifyKyc(req.params.id, status, rejectionReason);
    return ApiResponse.success(res, tenant, `KYC status set to ${status}`);
  } catch (error) {
    next(error);
  }
};

export const uploadKyc = async (req, res, next) => {
  try {
    const tenant = await tenantService.uploadKycDocuments(req.params.id, req.files);
    return ApiResponse.success(res, tenant, 'KYC documents uploaded successfully');
  } catch (error) {
    next(error);
  }
};

export const uploadLogo = async (req, res, next) => {
  try {
    const tenant = await tenantService.uploadTenantLogo(req.params.id, req.file);
    return ApiResponse.success(res, tenant, 'Shop logo uploaded successfully');
  } catch (error) {
    next(error);
  }
};
