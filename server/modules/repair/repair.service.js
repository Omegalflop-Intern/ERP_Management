import { RepairTicket } from './repair.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

const generateTicketNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `RPR-${dateStr}-`;

  const lastTicket = await RepairTicket.findOne({
    ticketNumber: { $regex: `^${prefix}` },
  }).sort({ createdAt: -1 });

  let seq = 1;
  if (lastTicket) {
    const lastSeq = parseInt(lastTicket.ticketNumber.split('-')[2], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(3, '0')}`;
};

export const getAllRepairs = async (page = 1, limit = 50, status = '', search = '') => {
  const query = { isDeleted: false };
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { customerPhone: { $regex: search, $options: 'i' } },
      { deviceModel: { $regex: search, $options: 'i' } },
      { ticketNumber: { $regex: search, $options: 'i' } },
      { technicianName: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await RepairTicket.countDocuments(query);
  const repairs = await paginate(RepairTicket.find(query), page, limit).sort({ createdAt: -1 });

  return { repairs, pagination: getPagination(total, page, limit) };
};

export const getRepairById = async (id) => {
  const ticket = await RepairTicket.findOne({ _id: id, isDeleted: false });
  if (!ticket) throw ApiError.notFound('Repair ticket not found');
  return ticket;
};

export const createRepair = async (data) => {
  const ticketNumber = await generateTicketNumber();
  return RepairTicket.create({ ...data, ticketNumber });
};

export const updateRepairStatus = async (id, status) => {
  const ticket = await RepairTicket.findOne({ _id: id, isDeleted: false });
  if (!ticket) throw ApiError.notFound('Repair ticket not found');

  const allowedTransitions = {
    RECEIVED: ['INSPECTING', 'CANCELLED'],
    INSPECTING: ['AWAITING_PARTS', 'REPAIRED', 'CANCELLED'],
    AWAITING_PARTS: ['INSPECTING', 'REPAIRED', 'CANCELLED'],
    REPAIRED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  if (!allowedTransitions[ticket.status]?.includes(status)) {
    throw ApiError.badRequest(`Cannot transition from ${ticket.status} to ${status}`);
  }

  ticket.status = status;
  await ticket.save();
  return ticket;
};

export const updateRepair = async (id, data) => {
  const ticket = await RepairTicket.findOne({ _id: id, isDeleted: false });
  if (!ticket) throw ApiError.notFound('Repair ticket not found');
  Object.assign(ticket, data);
  await ticket.save();
  return ticket;
};

export const deleteRepair = async (id) => {
  const ticket = await RepairTicket.findOne({ _id: id, isDeleted: false });
  if (!ticket) throw ApiError.notFound('Repair ticket not found');
  ticket.isDeleted = true;
  await ticket.save();
  return ticket;
};

export const getRepairStats = async () => {
  const total = await RepairTicket.countDocuments({ isDeleted: false });
  const active = await RepairTicket.countDocuments({
    isDeleted: false,
    status: { $nin: ['DELIVERED', 'CANCELLED'] },
  });
  const delivered = await RepairTicket.countDocuments({ isDeleted: false, status: 'DELIVERED' });
  const pending = await RepairTicket.countDocuments({ isDeleted: false, status: 'RECEIVED' });

  const totalRevenue = await RepairTicket.aggregate([
    { $match: { isDeleted: false, status: 'DELIVERED' } },
    { $group: { _id: null, total: { $sum: '$estimatedCost' }, collected: { $sum: '$advancePaid' } } },
  ]);

  return {
    total,
    active,
    delivered,
    pending,
    totalRevenue: totalRevenue[0]?.total || 0,
    totalCollected: totalRevenue[0]?.collected || 0,
  };
};
