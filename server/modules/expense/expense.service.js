import { Expense } from './expense.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { createAutomatedExpenseJournal } from '../accounting/accounting.service.js';

export const getAllExpenses = async (params = {}) => {
  const { category, from, to, search } = params;
  const query = { isDeleted: false };

  if (category && category !== 'ALL') {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { voucherNumber: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
    ];
  }

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to + 'T23:59:59.999Z');
  }

  const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 }).lean();

  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const categoryBreakdown = {};
  expenses.forEach(e => {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
  });

  return {
    expenses,
    summary: {
      totalExpense,
      count: expenses.length,
      categoryBreakdown,
    },
  };
};

export const createExpense = async (data, username) => {
  if (!data.amount || Number(data.amount) <= 0) {
    throw ApiError.badRequest('Expense amount must be greater than 0');
  }

  const expense = await Expense.create({
    ...data,
    amount: Number(data.amount),
    recordedBy: username,
  });

  await createAutomatedExpenseJournal(expense).catch(err => console.error('Expense journal failed:', err));

  return expense;
};

export const updateExpense = async (id, data) => {
  const expense = await Expense.findOne({ _id: id, isDeleted: false });
  if (!expense) throw ApiError.notFound('Expense entry not found');

  if (data.amount !== undefined) {
    if (Number(data.amount) <= 0) throw ApiError.badRequest('Expense amount must be greater than 0');
    expense.amount = Number(data.amount);
  }

  const allowedFields = ['title', 'category', 'notes', 'paymentMethod', 'vendor', 'date', 'voucherNumber'];
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) expense[field] = data[field];
  });

  await expense.save();
  return expense;
};

export const deleteExpense = async (id) => {
  const expense = await Expense.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (!expense) throw ApiError.notFound('Expense entry not found');
  return expense;
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Shop Rent',
  'Electricity & Utility',
  'Food & Entertainment',
  'Shop Maintenance & Repairs',
  'Marketing & Ads',
  'Salary & Bonus',
  'Office Supplies',
  'Internet & Phone',
  'Transport & Courier',
  'Miscellaneous',
];

export const getExpenseCategories = async () => {
  const dbCategories = await Expense.distinct('category', { isDeleted: false });
  const allCategories = Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...dbCategories])).filter(Boolean);
  return allCategories;
};
