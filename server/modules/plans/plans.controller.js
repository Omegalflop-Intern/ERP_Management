import { getActivePlans } from './plans.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';

/**
 * GET /api/v1/plans
 * Public endpoint — no auth required.
 * Returns all active subscription plans for the public pricing page.
 */
export const listPlans = async (req, res, next) => {
  try {
    const plans = await getActivePlans();
    return ApiResponse.success(res, plans, 'Subscription plans retrieved');
  } catch (error) {
    next(error);
  }
};
