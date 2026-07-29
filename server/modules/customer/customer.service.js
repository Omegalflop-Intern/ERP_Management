import { Customer } from './customer.model.js';
import { Transaction } from '../sale/sale.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';
import { hashText } from '../../utils/crypto.utils.js';

export const getAllCustomers = async (page = 1, limit = 20, search = '') => {
  const query = { isDeleted: false };
  if (search) {
    const pHash = hashText(search);
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phoneHash: pHash },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Customer.countDocuments(query);
  const customers = await paginate(Customer.find(query), page, limit).sort({ createdAt: -1 });

  return { customers, pagination: getPagination(total, page, limit) };
};

export const getCustomerById = async (id) => {
  const customer = await Customer.findOne({ _id: id, isDeleted: false });
  if (!customer) throw ApiError.notFound('Customer not found');
  return customer;
};

export const createCustomer = async (data) => {
  const pHash = hashText(data.phone);
  const existing = await Customer.findOne({ phoneHash: pHash, isDeleted: false });
  if (existing) throw ApiError.conflict('Customer with this phone already exists');
  data.phoneHash = pHash;
  return Customer.create(data);
};

export const updateCustomer = async (id, data) => {
  const customer = await Customer.findOne({ _id: id, isDeleted: false });
  if (!customer) throw ApiError.notFound('Customer not found');

  if (data.phone && data.phone !== customer.phone) {
    const pHash = hashText(data.phone);
    const existing = await Customer.findOne({ phoneHash: pHash, isDeleted: false, _id: { $ne: id } });
    if (existing) throw ApiError.conflict('Customer with this phone already exists');
    data.phoneHash = pHash;
  }

  Object.assign(customer, data);
  await customer.save();
  return customer;
};

export const deleteCustomer = async (id) => {
  const customer = await Customer.findOne({ _id: id, isDeleted: false });
  if (!customer) throw ApiError.notFound('Customer not found');
  customer.isDeleted = true;
  await customer.save();
  return customer;
};

export const getCustomerHistory = async (id) => {
  const customer = await Customer.findOne({ _id: id, isDeleted: false });
  if (!customer) throw ApiError.notFound('Customer not found');

  const sales = await Transaction.find({
    customerPhone: customer.phone,
    txType: 'SALE',
    isDeleted: false,
  }).sort({ createdAt: -1 });

  const returns = await Transaction.find({
    customerPhone: customer.phone,
    txType: 'RETURN',
    isDeleted: false,
  }).sort({ createdAt: -1 });

  const totalPurchased = sales.reduce((sum, s) => sum + (s.netTotal || 0), 0);
  const totalReturns = returns.reduce((sum, r) => sum + Math.abs(r.netTotal || 0), 0);
  const totalDue = customer.dueBalance;

  return {
    customer,
    sales,
    returns,
    summary: {
      totalPurchased,
      totalReturns,
      totalDue,
      totalTransactions: sales.length,
    },
  };
};

export const collectDue = async (id, amount, paymentMethod, userId) => {
  const customer = await Customer.findOne({ _id: id, isDeleted: false });
  if (!customer) throw ApiError.notFound('Customer not found');
  if (customer.dueBalance <= 0) throw ApiError.badRequest('No pending due for this customer');
  if (amount > customer.dueBalance) throw ApiError.badRequest(`Due amount exceeds balance of ৳${customer.dueBalance}`);

  const dueSales = await Transaction.find({
    customerPhone: customer.phone,
    txType: 'SALE',
    isDeleted: false,
    'paymentBreakdown.dueAmount': { $gt: 0 },
  }).sort({ createdAt: 1 });

  let remaining = amount;
  for (const sale of dueSales) {
    if (remaining <= 0) break;
    const saleDue = sale.paymentBreakdown.dueAmount || 0;
    const collectFromSale = Math.min(remaining, saleDue);

    sale.paymentBreakdown[paymentMethod] = (sale.paymentBreakdown[paymentMethod] || 0) + collectFromSale;
    sale.paymentBreakdown.dueAmount = saleDue - collectFromSale;
    await sale.save();
    remaining -= collectFromSale;
  }

  customer.dueBalance = Math.max(0, customer.dueBalance - amount);
  await customer.save();

  return { customer, collected: amount - remaining };
};

export const getCustomerStats = async () => {
  const total = await Customer.countDocuments({ isDeleted: false });
  const withDue = await Customer.countDocuments({ isDeleted: false, dueBalance: { $gt: 0 } });

  const dueAgg = await Customer.aggregate([
    { $match: { isDeleted: false, dueBalance: { $gt: 0 } } },
    { $group: { _id: null, totalDue: { $sum: '$dueBalance' }, count: { $sum: 1 } } },
  ]);

  const purchaseAgg = await Customer.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: null, totalPurchases: { $sum: '$totalPurchases' } } },
  ]);

  return {
    total,
    withDue,
    totalDue: dueAgg[0]?.totalDue || 0,
    totalPurchases: purchaseAgg[0]?.totalPurchases || 0,
  };
};
