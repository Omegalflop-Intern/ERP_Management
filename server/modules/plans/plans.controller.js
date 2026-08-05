import * as plansService from './plans.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { logAction } from '../../utils/auth/auditLog.js';

export const listPlans = async (req, res, next) => {
  try {
    const plans = await plansService.getActivePlans();
    return ApiResponse.success(res, plans, 'Subscription plans retrieved');
  } catch (error) { next(error); }
};

export const getAllPlans = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await plansService.getAllPlans(Number(page), Number(limit));
    return ApiResponse.paginated(res, result.plans, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (error) { next(error); }
};

export const getPlanById = async (req, res, next) => {
  try {
    const plan = await plansService.getPlanById(req.params.id);
    return ApiResponse.success(res, plan);
  } catch (error) { next(error); }
};

export const createPlan = async (req, res, next) => {
  try {
    const plan = await plansService.createPlan(req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'CREATE', module: 'plans', entityId: plan._id, entityType: 'SubscriptionPlan', details: { name: plan.name }, req });
    return ApiResponse.created(res, plan, 'Plan created');
  } catch (error) { next(error); }
};

export const updatePlan = async (req, res, next) => {
  try {
    const plan = await plansService.updatePlan(req.params.id, req.body);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'plans', entityId: plan._id, entityType: 'SubscriptionPlan', details: { name: plan.name }, req });
    return ApiResponse.success(res, plan, 'Plan updated');
  } catch (error) { next(error); }
};

export const deletePlan = async (req, res, next) => {
  try {
    await plansService.deletePlan(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'DELETE', module: 'plans', entityId: req.params.id, entityType: 'SubscriptionPlan', req });
    return ApiResponse.success(res, null, 'Plan deleted');
  } catch (error) { next(error); }
};

export const togglePlanActive = async (req, res, next) => {
  try {
    const plan = await plansService.togglePlanActive(req.params.id);
    logAction({ userId: req.user?.userId, username: req.user?.username, action: 'UPDATE', module: 'plans', entityId: plan._id, entityType: 'SubscriptionPlan', details: { name: plan.name, isActive: plan.isActive }, req });
    return ApiResponse.success(res, plan, `Plan ${plan.isActive ? 'activated' : 'deactivated'}`);
  } catch (error) { next(error); }
};
