import { db } from '../../config/db.knex.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { getPagination } from '../../utils/http/pagination.js';
import { createAutomatedExpenseJournal, createAutomatedPurchaseJournal } from '../accounting/accounting.service.js';

const generatePoNumber = () => 'PO-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

function parseJSON(str) {
  if (typeof str === 'string') {
    try { return JSON.parse(str); } catch { return []; }
  }
  return str || [];
}

export function formatPurchaseOrder(row, supplierRow = null) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    tenantId: row.tenant_id || null,
    branchId: row.branch_id ? String(row.branch_id) : null,
    poNumber: row.po_number,
    supplierId: supplierRow ? {
      _id: String(supplierRow.id),
      id: supplierRow.id,
      name: supplierRow.name,
      phone: supplierRow.phone,
      company: supplierRow.company || '',
      address: supplierRow.address || '',
      dueBalance: Number(supplierRow.due_balance || 0),
      creditBalance: Number(supplierRow.credit_balance || 0),
    } : String(row.supplier_id),
    status: row.status || 'DRAFT',
    lineItems: parseJSON(row.line_items),
    grnEntries: parseJSON(row.grn_entries),
    returnLogs: parseJSON(row.return_logs),
    returnedCount: Number(row.returned_count || 0),
    returnedAmount: Number(row.returned_amount || 0),
    returnedDate: row.returned_date || null,
    subTotal: Number(row.sub_total || 0),
    discount: Number(row.discount || 0),
    tax: Number(row.tax || 0),
    netTotal: Number(row.net_total || 0),
    paidAmount: Number(row.paid_amount || 0),
    dueAmount: Number(row.due_amount || 0),
    paymentMethod: row.payment_method || 'CREDIT',
    expectedDeliveryDate: row.expected_delivery_date || null,
    receivedDate: row.received_date || null,
    notes: row.notes || '',
    createdBy: row.created_by || '',
    approvedBy: row.approved_by || '',
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applyTenantScope(query, tenantId) {
  if (tenantId) {
    query.where('purchase_orders.tenant_id', tenantId);
  }
}

export const getAllPurchaseOrders = async (page = 1, limit = 20, search = '', status = '', tenantId = null, branchId = null) => {
  const countQuery = db('purchase_orders').where('purchase_orders.is_deleted', false);
  applyTenantScope(countQuery, tenantId);
  if (branchId) countQuery.where('purchase_orders.branch_id', branchId);
  if (status && status !== 'ALL') countQuery.where('purchase_orders.status', status);
  if (search) {
    const term = `%${search}%`;
    countQuery.where((b) => {
      b.where('po_number', 'like', term).orWhere('notes', 'like', term);
    });
  }

  const countRes = await countQuery.count({ total: '*' }).first();
  const total = Number(countRes?.total || 0);

  const offset = (page - 1) * limit;
  const dataQuery = db('purchase_orders')
    .leftJoin('suppliers', 'purchase_orders.supplier_id', 'suppliers.id')
    .where('purchase_orders.is_deleted', false)
    .select(
      'purchase_orders.*',
      'suppliers.id as s_id',
      'suppliers.name as s_name',
      'suppliers.phone as s_phone',
      'suppliers.company as s_company'
    );
  applyTenantScope(dataQuery, tenantId);
  if (branchId) dataQuery.where('purchase_orders.branch_id', branchId);
  if (status && status !== 'ALL') dataQuery.where('purchase_orders.status', status);
  if (search) {
    const term = `%${search}%`;
    dataQuery.where((b) => {
      b.where('purchase_orders.po_number', 'like', term).orWhere('purchase_orders.notes', 'like', term);
    });
  }

  const rows = await dataQuery.orderBy('purchase_orders.created_at', 'desc').limit(limit).offset(offset);

  const orders = rows.map((row) => {
    const sRow = row.s_id ? { id: row.s_id, name: row.s_name, phone: row.s_phone, company: row.s_company } : null;
    return formatPurchaseOrder(row, sRow);
  });

  return { orders, pagination: getPagination(total, page, limit) };
};

export const getPurchaseOrderById = async (id, tenantId = null, branchId = null) => {
  const dataQuery = db('purchase_orders')
    .leftJoin('suppliers', 'purchase_orders.supplier_id', 'suppliers.id')
    .where({ 'purchase_orders.id': id, 'purchase_orders.is_deleted': false })
    .select(
      'purchase_orders.*',
      'suppliers.id as s_id',
      'suppliers.name as s_name',
      'suppliers.phone as s_phone',
      'suppliers.company as s_company',
      'suppliers.address as s_address',
      'suppliers.due_balance as s_due_balance',
      'suppliers.credit_balance as s_credit_balance'
    );
  applyTenantScope(dataQuery, tenantId);
  if (branchId) dataQuery.where('purchase_orders.branch_id', branchId);

  const row = await dataQuery.first();
  if (!row) throw ApiError.notFound('Purchase order not found');

  const sRow = row.s_id ? {
    id: row.s_id, name: row.s_name, phone: row.s_phone, company: row.s_company,
    address: row.s_address, due_balance: row.s_due_balance, credit_balance: row.s_credit_balance
  } : null;

  return formatPurchaseOrder(row, sRow);
};

export const createPurchaseOrder = async (data, createdBy = 'system') => {
  const tenantId = data.tenantId || null;
  const branchId = data.branchId || null;

  let supplier = null;
  if (data.supplierId && !isNaN(Number(data.supplierId))) {
    const supQuery = db('suppliers').where({ id: Number(data.supplierId), is_deleted: false });
    if (tenantId) supQuery.where('tenant_id', tenantId);
    supplier = await supQuery.first();
  }

  if (!supplier && (data.supplierName || (data.supplierId && isNaN(Number(data.supplierId))))) {
    const sName = data.supplierName || String(data.supplierId);
    const supNameQ = db('suppliers').where({ name: sName, is_deleted: false });
    if (tenantId) supNameQ.where('tenant_id', tenantId);
    supplier = await supNameQ.first();

    if (!supplier) {
      const [newSupId] = await db('suppliers').insert({
        tenant_id: tenantId,
        branch_id: branchId,
        name: sName,
        phone: data.supplierPhone || 'N/A',
        company: data.supplierCompany || '',
        due_balance: 0,
        total_purchases: 0,
        is_deleted: false,
      });
      const getSup = db('suppliers').where({ id: newSupId });
      supplier = await getSup.first();
    }
  }

  if (!supplier) throw ApiError.notFound('Supplier not found or could not be created');

  const processedLineItems = [];

  for (const rawItem of (data.lineItems || [])) {
    let pId = rawItem.productId;
    const pName = rawItem.productName || rawItem.name || rawItem.description || 'Gadget Item';
    const uCost = Number(rawItem.unitCost || 0);
    const sPrice = Number(rawItem.sellingPrice || rawItem.unitPrice || (uCost > 0 ? Math.round(uCost * 1.25) : 0));
    const qty = Number(rawItem.qty || 1);

    // If no productId or if productId is new, find or create product in store
    if (!pId || String(pId).toLowerCase() === 'new' || isNaN(Number(pId))) {
      let existingProd = null;
      if (pName) {
        const pq = db('products').where({ name: pName, is_deleted: false });
        if (tenantId) pq.andWhere('tenant_id', tenantId);
        existingProd = await pq.first();
      }

      if (existingProd) {
        pId = existingProd.id;
      } else {
        const sku = 'SKU-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 900 + 100);
        const [newId] = await db('products').insert({
          tenant_id: tenantId,
          branch_id: branchId,
          name: pName,
          brand: rawItem.brand || 'Generic',
          sku,
          category: rawItem.category || 'General',
          cost_price: uCost,
          selling_price: sPrice,
          stock_quantity: 0,
          min_stock_alert: 5,
          is_deleted: false,
        });
        pId = newId;
      }
    } else {
      pId = Number(pId);
    }

    // Auto increment stock in products table
    const prodQ = db('products').where({ id: pId, is_deleted: false });
    if (tenantId) prodQ.andWhere('tenant_id', tenantId);
    const prod = await prodQ.first();
    if (prod) {
      const pUpdate = db('products').where({ id: pId });
      if (tenantId) pUpdate.andWhere('tenant_id', tenantId);
      await pUpdate.update({
        stock_quantity: Number(prod.stock_quantity || 0) + qty,
        cost_price: uCost > 0 ? uCost : prod.cost_price,
        selling_price: sPrice > 0 ? sPrice : prod.selling_price,
      });
    }

    // If IMEIs are provided at purchase time, insert them into inventory_units
    const imeis = rawItem.imeis || rawItem.imeiList || rawItem.imeiOrSerials || [];
    if (Array.isArray(imeis) && imeis.length > 0) {
      for (const imei of imeis) {
        const trimmed = String(imei).trim();
        if (!trimmed) continue;
        const imeiChk = db('inventory_units').where({ imei_or_serial: trimmed, is_deleted: false });
        if (tenantId) imeiChk.where('tenant_id', tenantId);
        const hasImei = await imeiChk.first();
        if (!hasImei) {
          await db('inventory_units').insert({
            tenant_id: tenantId,
            branch_id: branchId,
            imei_or_serial: trimmed,
            product_id: pId,
            supplier_id: supplier.id,
            purchase_price: uCost,
            current_selling_price: sPrice,
            warranty_months: Number(rawItem.warrantyMonths || 12),
            passport_history: JSON.stringify([{
              event: 'PURCHASED',
              details: `Received via Purchase Restock`,
              performedBy: createdBy,
              amount: uCost,
              timestamp: new Date().toISOString(),
            }]),
            status: 'Available',
            is_deleted: false,
          });
        }
      }
    }

    processedLineItems.push({
      productId: pId,
      description: pName,
      name: pName,
      qty,
      receivedQty: qty,
      unitCost: uCost,
      sellingPrice: sPrice,
      totalCost: qty * uCost,
      imeis: Array.isArray(imeis) ? imeis : [],
    });
  }

  const subTotal = processedLineItems.reduce((sum, item) => sum + item.totalCost, 0);
  const discount = Number(data.discount || 0);
  const tax = Number(data.tax || 0);
  const netTotal = Math.max(0, subTotal - discount + tax);
  const paidAmount = Number(data.paidAmount || 0);
  const dueAmount = Math.max(0, netTotal - paidAmount);

  const [insertedId] = await db('purchase_orders').insert({
    tenant_id: tenantId,
    branch_id: branchId,
    po_number: generatePoNumber(),
    supplier_id: supplier.id,
    status: 'RECEIVED',
    approved_by: createdBy,
    line_items: JSON.stringify(processedLineItems),
    grn_entries: JSON.stringify([]),
    return_logs: JSON.stringify([]),
    sub_total: subTotal,
    discount,
    tax,
    net_total: netTotal,
    paid_amount: paidAmount,
    due_amount: dueAmount,
    payment_method: data.paymentMethod || 'CREDIT',
    expected_delivery_date: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : new Date(),
    received_date: new Date(),
    notes: data.notes || null,
    created_by: createdBy,
    is_deleted: false,
  });

  // Update supplier balances
  const supUpdate = db('suppliers').where({ id: supplier.id });
  if (tenantId) supUpdate.andWhere('tenant_id', tenantId);
  await supUpdate.update({
    total_purchases: Number(supplier.total_purchases || 0) + netTotal,
    due_balance: Number(supplier.due_balance || 0) + dueAmount,
  });

  const createdOrder = await getPurchaseOrderById(insertedId, tenantId, branchId);

  // Trigger automated expense entry & accounting journal for purchase restock
  try {
    await createAutomatedPurchaseJournal(createdOrder, createdBy);
  } catch (err) {
    console.error('Failed to log automated purchase accounting journal:', err.message);
  }

  return createdOrder;
};

export const updatePurchaseOrder = async (id, data, tenantId = null, branchId = null) => {
  const order = await getPurchaseOrderById(id, tenantId, branchId);
  if (!order) throw ApiError.notFound('Purchase order not found');

  if (order.status === 'CANCELLED') {
    throw ApiError.badRequest('Cannot update a cancelled order');
  }

  const updateFields = {};
  if (data.status) updateFields.status = data.status;
  if (data.notes !== undefined) updateFields.notes = data.notes;
  if (data.expectedDeliveryDate !== undefined) updateFields.expected_delivery_date = data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null;

  if (Object.keys(updateFields).length > 0) {
    const poUpdate = db('purchase_orders').where({ id });
    if (tenantId) poUpdate.andWhere('tenant_id', tenantId);
    if (branchId) poUpdate.andWhere('branch_id', branchId);
    await poUpdate.update(updateFields);
  }

  return getPurchaseOrderById(id, tenantId, branchId);
};

export const receiveGoods = async (id, grnEntries, receivedBy = 'system', tenantId = null, branchId = null) => {
  const order = await getPurchaseOrderById(id, tenantId, branchId);
  if (!order) throw ApiError.notFound('Purchase order not found');

  for (const entry of grnEntries) {
    const imeiQuery = db('inventory_units').where({ imei_or_serial: entry.imeiOrSerial, is_deleted: false });
    if (tenantId) imeiQuery.where('tenant_id', tenantId);
    const existing = await imeiQuery.first();
    if (existing) throw ApiError.conflict(`IMEI ${entry.imeiOrSerial} already exists in inventory`);
  }

  const receivedByLineItem = {};
  for (const entry of grnEntries) {
    const key = String(entry.productId);
    receivedByLineItem[key] = (receivedByLineItem[key] || 0) + 1;

    const history = [{
      event: 'PURCHASED',
      details: `Received via GRN — ${order.poNumber}`,
      performedBy: receivedBy,
      amount: entry.purchasePrice,
      timestamp: new Date().toISOString(),
    }];

    await db('inventory_units').insert({
      tenant_id: tenantId || order.tenantId || null,
      branch_id: order.branch_id || order.branchId || null,
      imei_or_serial: entry.imeiOrSerial,
      product_id: entry.productId,
      supplier_id: order.supplierId?.id || order.supplierId,
      purchase_price: entry.purchasePrice,
      current_selling_price: entry.sellingPrice,
      warranty_months: entry.warrantyMonths || 12,
      passport_history: JSON.stringify(history),
      status: 'Available',
      is_deleted: false,
    });
  }

  const currentLineItems = order.lineItems || [];
  for (const item of currentLineItems) {
    const key = String(item.productId?._id || item.productId?.id || item.productId);
    if (receivedByLineItem[key]) {
      item.receivedQty = (item.receivedQty || 0) + receivedByLineItem[key];
    }
  }

  const currentGrnEntries = order.grnEntries || [];
  const newGrnEntries = grnEntries.map((e) => ({ ...e, receivedAt: new Date().toISOString(), receivedBy }));
  currentGrnEntries.push(...newGrnEntries);

  const allReceived = currentLineItems.every((item) => (item.receivedQty || 0) >= item.qty);
  const status = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

  const poReceiveUpdate = db('purchase_orders').where({ id });
  if (tenantId) poReceiveUpdate.andWhere('tenant_id', tenantId);
  if (branchId) poReceiveUpdate.andWhere('branch_id', branchId);
  await poReceiveUpdate.update({
    status,
    line_items: JSON.stringify(currentLineItems),
    grn_entries: JSON.stringify(currentGrnEntries),
    received_date: new Date(),
  });

  return getPurchaseOrderById(id, tenantId, branchId);
};

export const returnToSupplier = async (id, returnPayload, reason = '', returnedBy = 'system', tenantId = null, branchId = null) => {
  const order = await getPurchaseOrderById(id, tenantId, branchId);
  if (!order) throw ApiError.notFound('Purchase order not found');

  let itemsToReturn = [];
  if (Array.isArray(returnPayload)) {
    if (typeof returnPayload[0] === 'string') {
      itemsToReturn = returnPayload.map((imei) => ({ imeiOrSerial: imei, qty: 1, reason }));
    } else {
      itemsToReturn = returnPayload;
    }
  } else if (returnPayload && Array.isArray(returnPayload.items)) {
    itemsToReturn = returnPayload.items;
  } else if (returnPayload && Array.isArray(returnPayload.imeiOrSerials)) {
    itemsToReturn = returnPayload.imeiOrSerials.map((imei) => ({ imeiOrSerial: imei, qty: 1, reason: returnPayload.reason || reason }));
  }

  if (itemsToReturn.length === 0) {
    throw ApiError.badRequest('No return items specified');
  }

  let totalRefund = 0;
  let totalReturnedQty = 0;
  const processedReturnEntries = [];

  for (const item of itemsToReturn) {
    const pId = item.productId || item.productId?._id || item.productId?.id;
    const qty = Number(item.qty || 1);
    const uCost = Number(item.unitCost || 0);
    const refund = Number(item.refundAmount !== undefined ? item.refundAmount : (uCost * qty) || 0);

    totalRefund += refund;
    totalReturnedQty += qty;

    // Deduct stock from products table
    if (pId) {
      const prodQ = db('products').where({ id: pId, is_deleted: false });
      if (tenantId) prodQ.andWhere('tenant_id', tenantId);
      const prod = await prodQ.first();
      if (prod) {
        const newStock = Math.max(0, Number(prod.stock_quantity || 0) - qty);
        const pUp = db('products').where({ id: pId });
        if (tenantId) pUp.andWhere('tenant_id', tenantId);
        await pUp.update({ stock_quantity: newStock });
      }
    }

    // If IMEI specified, mark as returned in inventory_units
    if (item.imeiOrSerial) {
      const imeiQ = db('inventory_units').where({ imei_or_serial: item.imeiOrSerial, is_deleted: false });
      if (tenantId) imeiQ.where('tenant_id', tenantId);
      const imeiUnit = await imeiQ.first();
      if (imeiUnit) {
        const uUp = db('inventory_units').where({ id: imeiUnit.id });
        if (tenantId) uUp.andWhere('tenant_id', tenantId);
        await uUp.update({
          status: 'Returned to Supplier',
          is_deleted: true,
        });
      }
    }

    processedReturnEntries.push({
      productId: pId,
      description: item.description || item.name || 'Returned Product',
      imeiOrSerial: item.imeiOrSerial || null,
      qty,
      refundAmount: refund,
      reason: item.reason || reason || 'Defective / Return to Supplier',
      notes: item.notes || '',
      returnedAt: new Date().toISOString(),
      returnedBy,
    });
  }

  // Update purchase order return_logs
  const currentReturnLogs = order.returnLogs || [];
  currentReturnLogs.push(...processedReturnEntries);

  const newReturnedCount = Number(order.returnedCount || 0) + totalReturnedQty;
  const newReturnedAmount = Number(order.returnedAmount || 0) + totalRefund;

  const poUpdate = db('purchase_orders').where({ id });
  if (tenantId) poUpdate.andWhere('tenant_id', tenantId);
  if (branchId) poUpdate.andWhere('branch_id', branchId);
  await poUpdate.update({
    return_logs: JSON.stringify(currentReturnLogs),
    returned_count: newReturnedCount,
    returned_amount: newReturnedAmount,
    returned_date: new Date(),
  });

  // Adjust supplier due balance
  const supplierId = order.supplierId?.id || order.supplierId;
  if (supplierId) {
    const supQ = db('suppliers').where({ id: supplierId, is_deleted: false });
    if (tenantId) supQ.where('tenant_id', tenantId);
    const supplier = await supQ.first();
    if (supplier) {
      const curDue = Number(supplier.due_balance || 0);
      const newDue = Math.max(0, curDue - totalRefund);
      const supUp = db('suppliers').where({ id: supplierId });
      if (tenantId) supUp.andWhere('tenant_id', tenantId);
      await supUp.update({ due_balance: newDue });
    }
  }

  return {
    success: true,
    message: `${totalReturnedQty} item(s) returned to supplier successfully`,
    returnedCount: totalReturnedQty,
    totalRefund,
    order: await getPurchaseOrderById(id, tenantId, branchId),
  };
};

export const deletePurchaseOrder = async (id, tenantId = null, branchId = null) => {
  const order = await getPurchaseOrderById(id, tenantId, branchId);
  if (!order) throw ApiError.notFound('Purchase order not found');

  const poDel = db('purchase_orders').where({ id });
  if (tenantId) poDel.andWhere('tenant_id', tenantId);
  if (branchId) poDel.andWhere('branch_id', branchId);
  await poDel.update({ is_deleted: true });
  return { ...order, isDeleted: true };
};

export const payPurchaseOrderDue = async (id, { amount, paymentMethod = 'CASH', notes = '' } = {}, tenantId = null, branchId = null, user = null) => {
  const order = await getPurchaseOrderById(id, tenantId, branchId);
  if (!order) throw ApiError.notFound('Purchase order not found');

  const payAmount = Number(amount || 0);
  if (payAmount <= 0) {
    throw ApiError.badRequest('Payment amount must be greater than 0');
  }

  const currentDue = Number(order.dueAmount || 0);
  if (payAmount > currentDue) {
    throw ApiError.badRequest(`Payment amount (৳${payAmount}) cannot exceed current due balance of ৳${currentDue}`);
  }

  const newPaid = Number(order.paidAmount || 0) + payAmount;
  const newDue = Math.max(0, currentDue - payAmount);

  const poUpdate = db('purchase_orders').where({ id });
  if (tenantId) poUpdate.andWhere('tenant_id', tenantId);
  if (branchId) poUpdate.andWhere('branch_id', branchId);
  await poUpdate.update({
    paid_amount: newPaid,
    due_amount: newDue,
    payment_method: paymentMethod || order.paymentMethod || 'CASH',
    updated_at: new Date(),
  });

  // Deduct supplier due balance
  const supplierId = order.supplierId?.id || order.supplierId;
  if (supplierId) {
    const supQ = db('suppliers').where({ id: supplierId, is_deleted: false });
    if (tenantId) supQ.andWhere('tenant_id', tenantId);
    const supplier = await supQ.first();
    if (supplier) {
      const curSupDue = Number(supplier.due_balance || 0);
      const newSupDue = Math.max(0, curSupDue - payAmount);
      const supUp = db('suppliers').where({ id: supplierId });
      if (tenantId) supUp.andWhere('tenant_id', tenantId);
      await supUp.update({ due_balance: newSupDue });
    }
  }

  // Create automated accounting expense entry
  try {
    await createAutomatedExpenseJournal({
      tenantId: tenantId || order.tenantId,
      branchId: branchId || order.branchId,
      expenseCategory: 'Supplier Payment',
      amount: payAmount,
      paymentMethod,
      notes: notes || `Due payment for PO #${order.poNumber}`,
      createdBy: user?.username || 'system',
    });
  } catch (err) {
    console.error('Failed to log automated journal for supplier due payment:', err.message);
  }

  return getPurchaseOrderById(id, tenantId, branchId);
};
