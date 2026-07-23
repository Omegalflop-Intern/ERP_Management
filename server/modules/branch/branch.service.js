import { Branch } from './branch.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

export const getAllBranches = async (page = 1, limit = 50) => {
  const query = { isDeleted: false };
  const total = await Branch.countDocuments(query);
  const branches = await paginate(Branch.find(query).populate('manager', 'fullName username'), page, limit).sort({ createdAt: -1 });
  return { branches, pagination: getPagination(total, page, limit) };
};

export const getAllBranchesFlat = async () => {
  return Branch.find({ isDeleted: false, isActive: true }).sort({ name: 1 }).select('name address');
};

export const getBranchById = async (id) => {
  const branch = await Branch.findOne({ _id: id, isDeleted: false }).populate('manager', 'fullName username');
  if (!branch) throw ApiError.notFound('Branch not found');
  return branch;
};

export const createBranch = async (data) => {
  const existing = await Branch.findOne({ name: { $regex: `^${data.name}$`, $options: 'i' }, isDeleted: false });
  if (existing) throw ApiError.conflict(`Branch "${data.name}" already exists`);
  return Branch.create(data);
};

export const updateBranch = async (id, data) => {
  const branch = await Branch.findOne({ _id: id, isDeleted: false });
  if (!branch) throw ApiError.notFound('Branch not found');
  Object.assign(branch, data);
  await branch.save();
  return branch;
};

export const deleteBranch = async (id) => {
  const branch = await Branch.findOne({ _id: id, isDeleted: false });
  if (!branch) throw ApiError.notFound('Branch not found');
  branch.isDeleted = true;
  await branch.save();
  return branch;
};
