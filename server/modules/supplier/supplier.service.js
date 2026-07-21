import { Supplier } from './supplier.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

export const getAllSuppliers = async (page = 1, limit = 20, search = '') => {
  const query = { isDeleted: false };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Supplier.countDocuments(query);
  const suppliers = await paginate(Supplier.find(query), page, limit).sort({ createdAt: -1 });

  return { suppliers, pagination: getPagination(total, page, limit) };
};

export const getSupplierById = async (id) => {
  const supplier = await Supplier.findOne({ _id: id, isDeleted: false });
  if (!supplier) throw ApiError.notFound('Supplier not found');
  return supplier;
};

export const createSupplier = async (data) => {
  const existing = await Supplier.findOne({ phone: data.phone, isDeleted: false });
  if (existing) throw ApiError.conflict('Supplier with this phone already exists');
  return Supplier.create(data);
};

export const updateSupplier = async (id, data) => {
  const supplier = await Supplier.findOne({ _id: id, isDeleted: false });
  if (!supplier) throw ApiError.notFound('Supplier not found');

  if (data.phone && data.phone !== supplier.phone) {
    const existing = await Supplier.findOne({ phone: data.phone, isDeleted: false, _id: { $ne: id } });
    if (existing) throw ApiError.conflict('Supplier with this phone already exists');
  }

  Object.assign(supplier, data);
  await supplier.save();
  return supplier;
};

export const deleteSupplier = async (id) => {
  const supplier = await Supplier.findOne({ _id: id, isDeleted: false });
  if (!supplier) throw ApiError.notFound('Supplier not found');
  supplier.isDeleted = true;
  await supplier.save();
  return supplier;
};

export const getSupplierStats = async (id) => {
  const supplier = await Supplier.findOne({ _id: id, isDeleted: false });
  if (!supplier) throw ApiError.notFound('Supplier not found');
  return {
    supplier,
    dueBalance: supplier.dueBalance,
    totalPurchases: supplier.totalPurchases,
    paymentTerms: supplier.paymentTerms,
  };
};
