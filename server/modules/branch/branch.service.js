import { Branch } from './branch.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';
import { withTenant } from '../../utils/tenant.js';

export const getAllBranches = async (page = 1, limit = 50, tenantId = null) => {
  const query = withTenant({ isDeleted: false }, tenantId);
  const total = await Branch.countDocuments(query);
  const branches = await paginate(Branch.find(query).populate('manager', 'fullName username'), page, limit).sort({ createdAt: -1 });
  return { branches, pagination: getPagination(total, page, limit) };
};

export const getAllBranchesFlat = async (tenantId = null) => {
  return Branch.find(withTenant({ isDeleted: false, isActive: true }, tenantId)).sort({ name: 1 }).select('name address');
};

export const getBranchById = async (id, tenantId = null) => {
  const branch = await Branch.findOne(withTenant({ _id: id, isDeleted: false }, tenantId)).populate('manager', 'fullName username');
  if (!branch) throw ApiError.notFound('Branch not found');
  return branch;
};

export const createBranch = async (data, tenantId = null) => {
  // Enforce tenant plan branch limit
  if (tenantId) {
    const { Tenant } = await import('../tenant/tenant.model.js');
    const tenant = await Tenant.findById(tenantId).select('maxBranches plan').lean();
    if (tenant) {
      const currentCount = await Branch.countDocuments({ tenantId, isDeleted: false });
      const limit = tenant.maxBranches || 2;
      if (currentCount >= limit) {
        throw ApiError.forbidden(
          `Your plan (${tenant.plan || 'STARTER'}) allows a maximum of ${limit} branch${limit === 1 ? '' : 'es'}. ` +
            'Please upgrade your subscription to add more branches.'
        );
      }
    }
  }
  const existing = await Branch.findOne(withTenant({ name: { $regex: `^${data.name}$`, $options: 'i' }, isDeleted: false }, tenantId));
  if (existing) throw ApiError.conflict(`Branch "${data.name}" already exists`);
  return Branch.create({ ...data, tenantId: tenantId || null });
};

export const updateBranch = async (id, data, tenantId = null) => {
  const branch = await Branch.findOne(withTenant({ _id: id, isDeleted: false }, tenantId));
  if (!branch) throw ApiError.notFound('Branch not found');
  Object.assign(branch, data);
  await branch.save();
  return branch;
};

export const deleteBranch = async (id, tenantId = null) => {
  const branch = await Branch.findOne(withTenant({ _id: id, isDeleted: false }, tenantId));
  if (!branch) throw ApiError.notFound('Branch not found');
  branch.isDeleted = true;
  await branch.save();
  return branch;
};
