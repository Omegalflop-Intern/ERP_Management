import * as tenantService from './tenant.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import emitter, { EVENTS } from '../../events/index.js';

export const getTenants = async (req, res, next) => {
  try {
    const tenants = await tenantService.getAllTenants(req.query.search);
    return ApiResponse.success(res, tenants, 'Tenants retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getTenantStats = async (req, res, next) => {
  try {
    const stats = await tenantService.getTenantStats();
    return ApiResponse.success(res, stats, 'Stats retrieved');
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

export const getMyTenant = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return ApiResponse.success(res, null, 'No tenant associated with this account');
    }
    const tenant = await tenantService.getTenantById(tenantId);
    return ApiResponse.success(res, tenant, 'Tenant info retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    emitter.emit(EVENTS.TENANT_UPDATED, tenant);
    return ApiResponse.success(res, tenant, 'Tenant updated successfully');
  } catch (error) {
    next(error);
  }
};

export const createTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.createTenant(req.body);
    emitter.emit(EVENTS.TENANT_UPDATED, tenant);
    return ApiResponse.created(res, tenant, 'Shop tenant created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const tenant = await tenantService.updateTenantStatus(req.params.id, status, rejectionReason);
    emitter.emit(EVENTS.TENANT_UPDATED, tenant);
    return ApiResponse.success(res, tenant, `Tenant status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

export const handleVerifyKyc = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const tenant = await tenantService.verifyKyc(req.params.id, status, rejectionReason);
    emitter.emit(EVENTS.TENANT_UPDATED, tenant);
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

export const checkSubdomain = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await tenantService.checkSubdomainAvailability(slug);
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

export const getSubdomainInfo = async (req, res, next) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    return ApiResponse.success(res, {
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicTenantInfo = async (req, res, next) => {
  try {
    const { subdomain } = req.params;
    const info = await tenantService.getPublicTenantBySubdomain(subdomain);
    if (!info) throw ApiError.notFound('Shop not found');
    return ApiResponse.success(res, info, 'Public shop details fetched');
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteTenants = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const result = await tenantService.bulkDeleteTenants(ids);
    return ApiResponse.success(res, result, `${result.deletedCount} shop(s) deleted successfully`);
  } catch (error) {
    next(error);
  }
};

