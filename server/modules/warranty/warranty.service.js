import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';

export function formatWarrantyClaim(row, imeiRow = null, customerRow = null, invoiceRow = null, userRow = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    imei: imeiRow ? {
      _id: String(imeiRow.id),
      id: imeiRow.id,
      imeiOrSerial: imeiRow.imei_or_serial,
      warrantyMonths: Number(imeiRow.warranty_months || 12),
      warrantyExpiry: imeiRow.warranty_expiry || null,
    } : String(row.imei_id),
    customer: customerRow ? {
      _id: String(customerRow.id),
      id: customerRow.id,
      name: customerRow.name,
      phone: customerRow.phone,
      email: customerRow.email || '',
      address: customerRow.address || '',
    } : String(row.customer_id),
    invoiceRef: invoiceRow ? {
      _id: String(invoiceRow.id),
      id: invoiceRow.id,
      invoiceNumber: invoiceRow.invoice_number,
      netTotal: Number(invoiceRow.net_total || 0),
    } : (row.invoice_id ? String(row.invoice_id) : null),
    claimType: row.claim_type,
    description: row.description,
    status: row.status || 'pending',
    resolution: row.resolution || '',
    resolvedBy: userRow ? {
      _id: String(userRow.id),
      id: userRow.id,
      username: userRow.username,
    } : (row.resolved_by ? String(row.resolved_by) : null),
    resolvedAt: row.resolved_at || null,
    notes: row.notes || '',
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId, tablePrefix = 'warranty_claims') {
  if (tenantId) {
    query.where(`${tablePrefix}.tenant_id`, tenantId);
  }
}

export const getAllClaims = async (page = 1, limit = 20, status = '', search = '', tenantId = null) => {
  const countQuery = db('warranty_claims').where({ 'warranty_claims.is_deleted': false });
  applyTenantScope(countQuery, tenantId, 'warranty_claims');
  if (status) countQuery.where('warranty_claims.status', status);

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('warranty_claims')
    .leftJoin('inventory_units', 'warranty_claims.imei_id', 'inventory_units.id')
    .leftJoin('customers', 'warranty_claims.customer_id', 'customers.id')
    .leftJoin('transactions', 'warranty_claims.invoice_id', 'transactions.id')
    .leftJoin('users', 'warranty_claims.resolved_by', 'users.id')
    .where({ 'warranty_claims.is_deleted': false })
    .select(
      'warranty_claims.*',
      'inventory_units.id as i_id', 'inventory_units.imei_or_serial as i_imei', 'inventory_units.warranty_months as i_wm', 'inventory_units.warranty_expiry as i_we',
      'customers.id as c_id', 'customers.name as c_name', 'customers.phone as c_phone', 'customers.email as c_email', 'customers.address as c_address',
      'transactions.id as tx_id', 'transactions.invoice_number as tx_num', 'transactions.net_total as tx_total',
      'users.id as u_id', 'users.username as u_username'
    );
  applyTenantScope(dataQuery, tenantId, 'warranty_claims');
  if (status) dataQuery.where('warranty_claims.status', status);

  const rows = await dataQuery.orderBy('warranty_claims.created_at', 'desc').limit(limit).offset(offset);

  const claims = rows.map((row) => {
    const iRow = row.i_id ? { id: row.i_id, imei_or_serial: row.i_imei, warranty_months: row.i_wm, warranty_expiry: row.i_we } : null;
    const cRow = row.c_id ? { id: row.c_id, name: row.c_name, phone: row.c_phone, email: row.c_email, address: row.c_address } : null;
    const txRow = row.tx_id ? { id: row.tx_id, invoice_number: row.tx_num, net_total: row.tx_total } : null;
    const uRow = row.u_id ? { id: row.u_id, username: row.u_username } : null;
    return formatWarrantyClaim(row, iRow, cRow, txRow, uRow);
  });

  return { claims, pagination: getPagination(total, page, limit) };
};

export const getClaimById = async (id, tenantId = null) => {
  const dataQuery = db('warranty_claims')
    .leftJoin('inventory_units', 'warranty_claims.imei_id', 'inventory_units.id')
    .leftJoin('customers', 'warranty_claims.customer_id', 'customers.id')
    .leftJoin('transactions', 'warranty_claims.invoice_id', 'transactions.id')
    .leftJoin('users', 'warranty_claims.resolved_by', 'users.id')
    .where({ 'warranty_claims.id': id, 'warranty_claims.is_deleted': false })
    .select(
      'warranty_claims.*',
      'inventory_units.id as i_id', 'inventory_units.imei_or_serial as i_imei', 'inventory_units.warranty_months as i_wm', 'inventory_units.warranty_expiry as i_we',
      'customers.id as c_id', 'customers.name as c_name', 'customers.phone as c_phone', 'customers.email as c_email', 'customers.address as c_address',
      'transactions.id as tx_id', 'transactions.invoice_number as tx_num', 'transactions.net_total as tx_total',
      'users.id as u_id', 'users.username as u_username'
    );
  applyTenantScope(dataQuery, tenantId, 'warranty_claims');

  const row = await dataQuery.first();
  if (!row) throw ApiError.notFound('Warranty claim not found');

  const iRow = row.i_id ? { id: row.i_id, imei_or_serial: row.i_imei, warranty_months: row.i_wm, warranty_expiry: row.i_we } : null;
  const cRow = row.c_id ? { id: row.c_id, name: row.c_name, phone: row.c_phone, email: row.c_email, address: row.c_address } : null;
  const txRow = row.tx_id ? { id: row.tx_id, invoice_number: row.tx_num, net_total: row.tx_total } : null;
  const uRow = row.u_id ? { id: row.u_id, username: row.u_username } : null;

  return formatWarrantyClaim(row, iRow, cRow, txRow, uRow);
};

export const createClaim = async (data, tenantId = null) => {
  const [insertedId] = await db('warranty_claims').insert({
    tenant_id: tenantId || data.tenantId || null,
    imei_id: data.imei || data.imeiId || null,
    customer_id: data.customer || data.customerId,
    invoice_id: data.invoiceRef || data.invoiceId || null,
    claim_type: data.claimType,
    description: data.description,
    status: data.status || 'pending',
    resolution: data.resolution || null,
    notes: data.notes || (data.productName ? `Product: ${data.productName}` : null),
    is_deleted: false,
  });

  return getClaimById(insertedId, tenantId);
};

export const updateClaim = async (id, data, userId, tenantId = null) => {
  const claim = await getClaimById(id, tenantId);
  if (!claim) throw ApiError.notFound('Warranty claim not found');

  const updateFields = {};
  if (data.status) {
    updateFields.status = data.status;
    if (data.status !== 'pending') {
      updateFields.resolved_by = userId || null;
      updateFields.resolved_at = new Date();
    }
  }
  if (data.resolution !== undefined) updateFields.resolution = data.resolution;
  if (data.notes !== undefined) updateFields.notes = data.notes;

  if (Object.keys(updateFields).length > 0) {
    const q = db('warranty_claims').where({ id });
    if (tenantId) q.andWhere('tenant_id', tenantId);
    await q.update(updateFields);
  }

  return getClaimById(id, tenantId);
};

export const getClaimsByIMEI = async (imeiId, tenantId = null) => {
  const dataQuery = db('warranty_claims').where({ imei_id: imeiId, is_deleted: false });
  applyTenantScope(dataQuery, tenantId, 'warranty_claims');
  const rows = await dataQuery.orderBy('created_at', 'desc');
  return rows.map(r => formatWarrantyClaim(r));
};

export const getWarrantyReport = async ({ type = 'all', search = '', status = 'Sold' }, tenantId = null) => {
  const now = new Date();
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // 1. Fetch Products for name, brand, model & warranty lookup
  let prodQuery = db('products').where({ is_deleted: false });
  if (tenantId) prodQuery.where('tenant_id', tenantId);
  const allProducts = await prodQuery.select('id', 'name', 'brand', 'model', 'warranty_months');
  const productMap = new Map(allProducts.map((p) => [Number(p.id), p]));

  // 2. Fetch Inventory Units (with product info)
  let unitQuery = db('inventory_units')
    .leftJoin('products', 'inventory_units.product_id', 'products.id')
    .where({ 'inventory_units.is_deleted': false });

  if (tenantId) unitQuery.where('inventory_units.tenant_id', tenantId);
  if (status && status !== 'ALL') unitQuery.where('inventory_units.status', status);

  const unitRows = await unitQuery.select(
    'inventory_units.*',
    'products.name as product_name',
    'products.brand as product_brand'
  );

  // 3. Fetch Transactions to capture customer info, non-IMEI accessories & wholesale sales
  let txQuery = db('transactions')
    .leftJoin('customers', 'transactions.customer_id', 'customers.id')
    .where({ 'transactions.is_deleted': false })
    .whereIn('transactions.status', ['COMPLETED', 'RETURNED', 'PARTIAL_RETURN'])
    .orderBy('transactions.created_at', 'desc');

  if (tenantId) txQuery.where('transactions.tenant_id', tenantId);

  const transactions = await txQuery.select(
    'transactions.*',
    'customers.name as c_name',
    'customers.phone as c_phone'
  );

  // Map transactions by IMEI to attach customer & invoice to serialized units
  const imeiToTxMap = new Map();
  const nonImeiItems = [];

  for (const tx of transactions) {
    let lineItems = [];
    try {
      lineItems = typeof tx.line_items === 'string' ? JSON.parse(tx.line_items) : (tx.line_items || []);
    } catch {
      lineItems = [];
    }

    const txDate = new Date(tx.created_at);

    for (const item of lineItems) {
      const prod = item.productId ? productMap.get(Number(item.productId)) : null;
      const pName = prod?.name || item.description || item.productName || item.name || 'Gadget Item';
      const pBrand = prod?.brand || item.brand || 'Accessories';
      const wMonths = Number(item.warrantyMonths || item.warranty || prod?.warranty_months || 12);
      const expiryDate = new Date(txDate);
      expiryDate.setMonth(expiryDate.getMonth() + wMonths);

      const singleImei = item.imeiOrSerial || item.imei;
      const imeis = Array.isArray(item.imeiList) ? item.imeiList : (singleImei ? [singleImei] : []);

      if (imeis.length > 0) {
        for (const imeiStr of imeis) {
          imeiToTxMap.set(String(imeiStr), {
            customerName: tx.customer_name || tx.c_name || 'Walk-in Customer',
            customerPhone: tx.customer_phone || tx.c_phone || 'N/A',
            invoiceNumber: tx.invoice_number,
            saleDate: tx.created_at,
            productName: pName,
            brandName: pBrand,
            warrantyMonths: wMonths,
            warrantyExpiry: expiryDate.toISOString(),
          });
        }
      } else {
        // Non-IMEI item
        nonImeiItems.push({
          _id: `tx-item-${tx.id}-${item.productId || pName}`,
          id: `tx-${tx.id}-${item.productId || pName}`,
          imeiOrSerial: 'Non-IMEI Item',
          productName: pName,
          brandName: pBrand,
          customerName: tx.customer_name || tx.c_name || 'Walk-in Customer',
          customerPhone: tx.customer_phone || tx.c_phone || 'N/A',
          invoiceNumber: tx.invoice_number,
          saleDate: tx.created_at,
          status: 'Sold',
          warrantyMonths: wMonths,
          warrantyExpiry: expiryDate.toISOString(),
          createdAt: tx.created_at,
        });
      }
    }
  }

  // Build combined items list
  const combinedItems = [];

  // Add serialized units
  for (const u of unitRows) {
    const txInfo = imeiToTxMap.get(String(u.imei_or_serial)) || {};
    const prod = u.product_id ? productMap.get(Number(u.product_id)) : null;
    const pName = txInfo.productName || u.product_name || prod?.name || 'Device / Phone';
    const pBrand = txInfo.brandName || u.product_brand || prod?.brand || 'Generic';

    combinedItems.push({
      _id: String(u.id),
      id: u.id,
      imeiOrSerial: u.imei_or_serial,
      productName: pName,
      brandName: pBrand,
      customerName: txInfo.customerName || (u.status === 'Sold' ? 'Customer' : 'In Store Inventory'),
      customerPhone: txInfo.customerPhone || '—',
      invoiceNumber: txInfo.invoiceNumber || '—',
      saleDate: txInfo.saleDate || u.created_at,
      status: u.status,
      warrantyMonths: Number(txInfo.warrantyMonths || u.warranty_months || prod?.warranty_months || 12),
      warrantyExpiry: txInfo.warrantyExpiry || u.warranty_expiry || null,
      createdAt: u.created_at,
    });
  }

  // If status is 'Sold' or 'ALL', include non-IMEI sold items as well
  if (status === 'Sold' || status === 'ALL') {
    combinedItems.push(...nonImeiItems);
  }

  // Calculate summary counts
  const totalSoldUnits = combinedItems.filter(i => i.status === 'Sold').length;
  const totalActiveSold = combinedItems.filter(i => {
    if (i.status !== 'Sold') return false;
    return i.warrantyExpiry && new Date(i.warrantyExpiry) >= now;
  }).length;
  const totalExpiringSoon = combinedItems.filter(i => {
    if (i.status !== 'Sold' || !i.warrantyExpiry) return false;
    const exp = new Date(i.warrantyExpiry);
    return exp >= now && exp <= thirtyDays;
  }).length;
  const totalExpiredSold = combinedItems.filter(i => {
    if (i.status !== 'Sold' || !i.warrantyExpiry) return false;
    return new Date(i.warrantyExpiry) < now;
  }).length;

  // Filter combined items by search term and type
  let filtered = combinedItems;

  if (search) {
    const term = search.toLowerCase().trim();
    filtered = filtered.filter(i =>
      (i.productName || '').toLowerCase().includes(term) ||
      (i.imeiOrSerial || '').toLowerCase().includes(term) ||
      (i.customerName || '').toLowerCase().includes(term) ||
      (i.customerPhone || '').includes(term) ||
      (i.invoiceNumber || '').toLowerCase().includes(term)
    );
  }

  if (type === 'active') {
    filtered = filtered.filter(i => i.warrantyExpiry && new Date(i.warrantyExpiry) >= now);
  } else if (type === 'expiring') {
    filtered = filtered.filter(i => {
      if (!i.warrantyExpiry) return false;
      const exp = new Date(i.warrantyExpiry);
      return exp >= now && exp <= thirtyDays;
    });
  } else if (type === 'expired') {
    filtered = filtered.filter(i => i.warrantyExpiry && new Date(i.warrantyExpiry) < now);
  }

  // Sort by expiry date ascending
  filtered.sort((a, b) => {
    if (!a.warrantyExpiry) return 1;
    if (!b.warrantyExpiry) return -1;
    return new Date(a.warrantyExpiry) - new Date(b.warrantyExpiry);
  });

  return {
    units: filtered,
    summary: {
      totalSoldUnits,
      totalActiveSold,
      totalExpiringSoon,
      totalExpiredSold,
    },
  };
};

export const getCustomerPurchasedItems = async (customerId, tenantId = null) => {
  const txQuery = db('transactions')
    .where({ customer_id: customerId, is_deleted: false })
    .whereIn('status', ['COMPLETED', 'RETURNED', 'PARTIAL_RETURN'])
    .orderBy('created_at', 'desc');

  if (tenantId) txQuery.where('tenant_id', tenantId);

  const transactions = await txQuery;

  const claimsQuery = db('warranty_claims').where({ customer_id: customerId, is_deleted: false });
  if (tenantId) claimsQuery.where('tenant_id', tenantId);
  const existingClaims = await claimsQuery;

  const purchasedItems = [];
  const now = new Date();

  for (const tx of transactions) {
    let lineItems = [];
    try {
      lineItems = typeof tx.line_items === 'string' ? JSON.parse(tx.line_items) : (tx.line_items || []);
    } catch {
      lineItems = [];
    }

    const txDate = new Date(tx.created_at);

    for (const item of lineItems) {
      const pName = item.productName || item.name || 'Gadget / Accessory';
      const wMonths = Number(item.warrantyMonths || item.warranty || 12);
      
      const expiryDate = new Date(txDate);
      expiryDate.setMonth(expiryDate.getMonth() + wMonths);
      
      const isWarrantyValid = expiryDate >= now;
      const daysDiff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const imeis = Array.isArray(item.imeiList) ? item.imeiList : (item.imei ? [item.imei] : []);
      
      if (imeis.length > 0) {
        for (const imeiNum of imeis) {
          const unit = await db('inventory_units').where({ imei_or_serial: imeiNum }).first();
          const imeiId = unit ? unit.id : null;
          
          const claim = existingClaims.find(c => c.imei_id === imeiId || (c.notes && c.notes.includes(imeiNum)));
          const isRefunded = claim && claim.claim_type === 'refund' && claim.status === 'completed';

          purchasedItems.push({
            id: `item-${tx.id}-${imeiNum}`,
            invoiceId: tx.id,
            invoiceNumber: tx.invoice_number,
            saleType: tx.sale_type || 'RETAIL',
            purchaseDate: tx.created_at,
            productId: item.productId || item.id,
            productName: pName,
            imeiId: imeiId,
            imeiOrSerial: imeiNum,
            hasImei: true,
            warrantyMonths: wMonths,
            warrantyExpiryDate: expiryDate.toISOString(),
            isWarrantyValid: isWarrantyValid && !isRefunded,
            daysRemaining: daysDiff,
            statusLabel: isRefunded ? 'Refunded' : (isWarrantyValid ? `${daysDiff} days left` : 'Expired'),
            isRefunded: Boolean(isRefunded),
            hasClaim: Boolean(claim),
            latestClaimStatus: claim?.status || null,
          });
        }
      } else {
        const qty = Number(item.quantity || 1);
        purchasedItems.push({
          id: `item-${tx.id}-${item.productId || pName}`,
          invoiceId: tx.id,
          invoiceNumber: tx.invoice_number,
          saleType: tx.sale_type || 'RETAIL',
          purchaseDate: tx.created_at,
          productId: item.productId || item.id,
          productName: pName,
          quantity: qty,
          imeiId: null,
          imeiOrSerial: null,
          hasImei: false,
          warrantyMonths: wMonths,
          warrantyExpiryDate: expiryDate.toISOString(),
          isWarrantyValid: isWarrantyValid,
          daysRemaining: daysDiff,
          statusLabel: isWarrantyValid ? `${daysDiff} days left` : 'Expired',
          isRefunded: false,
          hasClaim: false,
          latestClaimStatus: null,
        });
      }
    }
  }

  return purchasedItems;
};
