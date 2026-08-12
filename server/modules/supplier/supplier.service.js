import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

export function formatSupplier(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    name: row.name,
    phone: row.phone,
    email: row.email || '',
    company: row.company || '',
    address: row.address || '',
    dueBalance: Number(row.due_balance || 0),
    creditBalance: Number(row.credit_balance || 0),
    totalPurchases: Number(row.total_purchases || 0),
    paymentTerms: row.payment_terms || 'CASH',
    notes: row.notes || '',
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('tenant_id', tenantId);
  }
}

export const getAllSuppliers = async (page = 1, limit = 20, search = '', tenantId = null, branchId = null) => {
  const countQuery = db('suppliers').where('is_deleted', false);
  applyTenantScope(countQuery, tenantId);
  if (branchId && branchId !== 'all') {
    countQuery.where((b) => b.where('branch_id', branchId).orWhereNull('branch_id'));
  }

  if (search) {
    const term = `%${search}%`;
    countQuery.where((b) => {
      b.where('name', 'like', term)
        .orWhere('phone', 'like', term)
        .orWhere('company', 'like', term);
    });
  }

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('suppliers').where('is_deleted', false);
  applyTenantScope(dataQuery, tenantId);
  if (branchId && branchId !== 'all') {
    dataQuery.where((b) => b.where('branch_id', branchId).orWhereNull('branch_id'));
  }

  if (search) {
    const term = `%${search}%`;
    dataQuery.where((b) => {
      b.where('name', 'like', term)
        .orWhere('phone', 'like', term)
        .orWhere('company', 'like', term);
    });
  }

  const rows = await dataQuery.orderBy('created_at', 'desc').limit(limit).offset(offset);
  const suppliers = rows.map(formatSupplier);

  return { suppliers, pagination: getPagination(total, page, limit) };
};

export const getSupplierById = async (id, tenantId = null) => {
  const query = db('suppliers').where({ id, is_deleted: false });
  applyTenantScope(query, tenantId);
  const row = await query.first();
  if (!row) throw ApiError.notFound('Supplier not found');
  return formatSupplier(row);
};

export const createSupplier = async (data, tenantId = null, branchId = null) => {
  const existingQuery = db('suppliers').where({ phone: data.phone, is_deleted: false });
  applyTenantScope(existingQuery, tenantId);
  const existing = await existingQuery.first();
  if (existing) throw ApiError.conflict('Supplier with this phone already exists');

  const [insertedId] = await db('suppliers').insert({
    tenant_id: tenantId,
    branch_id: data.branchId || branchId || null,
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    company: data.company || null,
    address: data.address || null,
    due_balance: data.dueBalance || 0,
    credit_balance: data.creditBalance || 0,
    total_purchases: data.totalPurchases || 0,
    payment_terms: data.paymentTerms || 'CASH',
    notes: data.notes || null,
    is_deleted: false,
  });

  return getSupplierById(insertedId, tenantId);
};

export const updateSupplier = async (id, data, tenantId = null) => {
  const supplier = await getSupplierById(id, tenantId);
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const updateFields = {};

  if (data.phone && data.phone !== supplier.phone) {
    const existingQuery = db('suppliers').where({ phone: data.phone, is_deleted: false }).whereNot({ id });
    applyTenantScope(existingQuery, tenantId);
    const existing = await existingQuery.first();
    if (existing) throw ApiError.conflict('Supplier with this phone already exists');
    updateFields.phone = data.phone;
  }

  if (data.name !== undefined) updateFields.name = data.name;
  if (data.email !== undefined) updateFields.email = data.email;
  if (data.company !== undefined) updateFields.company = data.company;
  if (data.address !== undefined) updateFields.address = data.address;
  if (data.dueBalance !== undefined) updateFields.due_balance = data.dueBalance;
  if (data.creditBalance !== undefined) updateFields.credit_balance = data.creditBalance;
  if (data.totalPurchases !== undefined) updateFields.total_purchases = data.totalPurchases;
  if (data.paymentTerms !== undefined) updateFields.payment_terms = data.paymentTerms;
  if (data.notes !== undefined) updateFields.notes = data.notes;

  if (Object.keys(updateFields).length > 0) {
    const q = db('suppliers').where({ id });
    if (tenantId) q.andWhere('tenant_id', tenantId);
    await q.update(updateFields);
  }

  return getSupplierById(id, tenantId);
};

export const deleteSupplier = async (id, tenantId = null) => {
  const supplier = await getSupplierById(id, tenantId);
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const q1 = db('suppliers').where({ id });
  if (tenantId) q1.andWhere('tenant_id', tenantId);
  await q1.update({ is_deleted: true });
  return { ...supplier, isDeleted: true };
};

export const getSupplierStats = async (id, tenantId = null) => {
  const supplier = await getSupplierById(id, tenantId);
  if (!supplier) throw ApiError.notFound('Supplier not found');
  return {
    supplier,
    dueBalance: supplier.dueBalance,
    totalPurchases: supplier.totalPurchases,
    paymentTerms: supplier.paymentTerms,
  };
};
