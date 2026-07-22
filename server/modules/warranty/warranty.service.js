import { WarrantyClaim } from './warranty.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';

export const getAllClaims = async (page = 1, limit = 20, status = '', search = '') => {
  const query = {};
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { description: { $regex: search, $options: 'i' } },
      { resolution: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await WarrantyClaim.countDocuments(query);
  const claims = await paginate(WarrantyClaim.find(query), page, limit)
    .populate('imei', 'imeiOrSerial productId')
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 });

  return { claims, pagination: getPagination(total, page, limit) };
};

export const getClaimById = async (id) => {
  const claim = await WarrantyClaim.findById(id)
    .populate('imei', 'imeiOrSerial productId warrantyMonths warrantyExpiry')
    .populate('customer', 'name phone email address')
    .populate('invoiceRef', 'invoiceNumber netTotal')
    .populate('resolvedBy', 'username');
  if (!claim) throw ApiError.notFound('Warranty claim not found');
  return claim;
};

export const createClaim = async (data) => {
  return WarrantyClaim.create(data);
};

export const updateClaim = async (id, data, userId) => {
  const claim = await WarrantyClaim.findById(id);
  if (!claim) throw ApiError.notFound('Warranty claim not found');

  if (data.status) {
    claim.status = data.status;
    if (data.status !== 'pending') {
      claim.resolvedBy = userId;
      claim.resolvedAt = new Date();
    }
  }
  if (data.resolution) claim.resolution = data.resolution;
  if (data.notes) claim.notes = data.notes;

  await claim.save();
  return claim;
};

export const getClaimsByIMEI = async (imeiId) => {
  const claims = await WarrantyClaim.find({ imei: imeiId })
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 });
  return claims;
};

export const getWarrantyReport = async (params = {}) => {
  const type = typeof params === 'string' ? params : (params.type || 'all');
  const search = typeof params === 'object' && params.search ? params.search : '';
  const status = typeof params === 'object' && params.status !== undefined ? params.status : 'Sold';

  const now = new Date();
  const thirtyDays = new Date(now);
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const matchQuery = { isDeleted: false };
  if (status && status !== 'ALL') {
    matchQuery.status = status;
  }

  const InventoryUnit = (await import('../imei/imei.model.js')).InventoryUnit;
  const Transaction = (await import('../sale/sale.model.js')).Transaction;

  const units = await InventoryUnit.find(matchQuery)
    .populate('productId', 'name brand model category')
    .populate('soldToCustomerId', 'name phone email')
    .populate('branchId', 'name')
    .sort({ createdAt: -1 });

  // Fallback for missing soldToCustomerId: match via soldInvoiceNumber
  const invoiceNumbers = units
    .filter((u) => !u.soldToCustomerId && u.soldInvoiceNumber)
    .map((u) => u.soldInvoiceNumber);

  const txMap = {};
  if (invoiceNumbers.length > 0) {
    const txs = await Transaction.find({ invoiceNumber: { $in: invoiceNumbers }, isDeleted: false })
      .select('invoiceNumber customerName customerPhone customerEmail');
    txs.forEach((t) => {
      txMap[t.invoiceNumber] = t;
    });
  }

  const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + (months || 12));
    return d;
  };

  const enrichedUnits = units.map((u) => {
    const unitObj = u.toObject ? u.toObject() : u;
    let customerName = unitObj.soldToCustomerId?.name || '';
    let customerPhone = unitObj.soldToCustomerId?.phone || '';
    let customerEmail = unitObj.soldToCustomerId?.email || '';

    if (!customerName && unitObj.soldInvoiceNumber && txMap[unitObj.soldInvoiceNumber]) {
      const tx = txMap[unitObj.soldInvoiceNumber];
      customerName = tx.customerName || '';
      customerPhone = tx.customerPhone || '';
      customerEmail = tx.customerEmail || '';
    }

    let expiry = unitObj.warrantyExpiry ? new Date(unitObj.warrantyExpiry) : null;
    if (!expiry) {
      if (unitObj.soldAt) {
        expiry = addMonths(unitObj.soldAt, unitObj.warrantyMonths || 12);
      } else if (unitObj.createdAt) {
        expiry = addMonths(unitObj.createdAt, unitObj.warrantyMonths || 12);
      }
    }

    const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;

    return {
      ...unitObj,
      warrantyExpiry: expiry,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || 'N/A',
      customerEmail: customerEmail || '',
      daysLeft,
    };
  });

  const totalActiveSold = enrichedUnits.filter((u) => u.warrantyExpiry && u.warrantyExpiry >= now).length;
  const totalExpiredSold = enrichedUnits.filter((u) => u.warrantyExpiry && u.warrantyExpiry < now).length;
  const totalExpiringSoon = enrichedUnits.filter(
    (u) => u.warrantyExpiry && u.warrantyExpiry >= now && u.warrantyExpiry <= thirtyDays
  ).length;

  let filteredUnits = enrichedUnits;
  if (type === 'expiring') {
    filteredUnits = enrichedUnits.filter((u) => u.warrantyExpiry && u.warrantyExpiry >= now && u.warrantyExpiry <= thirtyDays);
  } else if (type === 'expired') {
    filteredUnits = enrichedUnits.filter((u) => u.warrantyExpiry && u.warrantyExpiry < now);
  } else if (type === 'active') {
    filteredUnits = enrichedUnits.filter((u) => !u.warrantyExpiry || u.warrantyExpiry >= now);
  }

  if (search && search.trim()) {
    const safeSearch = search.trim().toLowerCase();
    filteredUnits = filteredUnits.filter((u) => {
      const pName = (u.productId?.name || '').toLowerCase();
      const pBrand = (u.productId?.brand || '').toLowerCase();
      const imei = (u.imeiOrSerial || '').toLowerCase();
      const inv = (u.soldInvoiceNumber || '').toLowerCase();
      const cName = (u.customerName || '').toLowerCase();
      const cPhone = (u.customerPhone || '').toLowerCase();

      return (
        pName.includes(safeSearch) ||
        pBrand.includes(safeSearch) ||
        imei.includes(safeSearch) ||
        inv.includes(safeSearch) ||
        cName.includes(safeSearch) ||
        cPhone.includes(safeSearch)
      );
    });
  }

  const claims = await WarrantyClaim.find({}).sort({ createdAt: -1 });
  const pendingClaims = claims.filter((c) => c.status === 'pending').length;
  const completedClaims = claims.filter((c) => c.status === 'completed').length;

  return {
    units: filteredUnits,
    summary: {
      total: enrichedUnits.length,
      totalSoldUnits: enrichedUnits.length,
      totalActiveSold,
      totalExpiringSoon,
      totalExpiredSold,
      pendingClaims,
      completedClaims,
      totalClaims: claims.length,
    },
  };
};
