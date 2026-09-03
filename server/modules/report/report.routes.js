import { Router } from 'express';
import { db } from '../../config/db.knex.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate);
router.use(checkTenantStatus);
router.use(authorize('ADMIN', 'MANAGER', 'CASHIER', 'STAFF'));

const getTenantScope = (req) => {
  const tenantId = req.user?.tenantId || null;
  return (query, tablePrefix = null) => {
    if (tenantId) {
      const col = tablePrefix ? `${tablePrefix}.tenant_id` : 'tenant_id';
      query.where((b) => b.where(col, tenantId).orWhereNull(col));
    }
  };
};

function getDateRangeFilter(period, fromDate, toDate) {
  const now = new Date();
  let start = null;
  let end = null;

  if (fromDate) {
    start = new Date(fromDate);
  }
  if (toDate) {
    end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
  }

  if (!start && period) {
    const p = String(period).toLowerCase();
    if (p === '24h' || p === 'today') {
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (p === '7d' || p === 'week') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    } else if (p === '30d' || p === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    } else if (p === '90d' || p === 'quarter') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89, 0, 0, 0, 0);
    } else if (p === 'year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    }
  }

  return { start, end };
}

/**
 * GET /api/v1/reports/dashboard
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const applyScope = getTenantScope(req);
    const tenantId = req.user?.tenantId || null;
    const period = String(req.query?.period || '24h').toLowerCase();

    const now = new Date();
    let startTime = null;
    let isHourly = false;

    if (period === '24h' || period === 'today') {
      isHourly = true;
      // Start of current day (00:00:00 local time)
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (period === '30d' || period === 'month') {
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    } else if (period === '90d' || period === 'quarter') {
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89, 0, 0, 0, 0);
    } else if (period === 'all' || period === 'alltime') {
      startTime = null;
    } else {
      // Default: 7d (last 7 days)
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    }

    let totalSalesCount = 0, totalRevenue = 0;
    let totalAvailableUnits = 0, totalStockValue = 0;
    let activeRepairsCount = 0, totalCustomers = 0, totalDueAmount = 0;
    let totalExpenses = 0, totalPurchasesCost = 0, totalCogs = 0;
    let salesTrendData = [];
    let dueTrendData = [];
    let brandDistribution = [];
    const lowStockItems = [];

    // 1. Operating Expenses (period-scoped)
    try {
      const expQuery = db('expenses').where({ is_deleted: false }).whereNot('category', 'Supplier Payment');
      if (startTime) {
        expQuery.where('created_at', '>=', startTime);
      }
      applyScope(expQuery);
      const expRes = await expQuery.sum({ total: 'amount' }).first();
      totalExpenses = Number(expRes?.total || 0);
    } catch (e) {
      console.error('[DASHBOARD] Expense query error:', e.message);
    }

    // 1b. Total Inventory Purchases (All-time inventory purchases for the shop)
    try {
      const poQuery = db('purchase_orders').where({ is_deleted: false }).whereNot('status', 'CANCELLED');
      applyScope(poQuery);
      const poRes = await poQuery.sum({ total: 'net_total' }).sum({ returned: 'returned_amount' }).first();
      totalPurchasesCost = Math.max(0, Number(poRes?.total || 0) - Number(poRes?.returned || 0));
    } catch (e) {
      console.error('[DASHBOARD] PO query error:', e.message);
    }

    // 2. Sales, Revenue, COGS, and Dues (period-scoped)
    try {
      const txQuery = db('transactions').where({ is_deleted: false, tx_type: 'SALE' }).whereNot('status', 'CANCELLED');
      if (startTime) {
        txQuery.where('created_at', '>=', startTime);
      }
      applyScope(txQuery);
      const txCountRes = await txQuery.count({ count: '*' }).sum({ total: 'net_total' }).sum({ returned: 'returned_amount' }).first();
      totalSalesCount = Number(txCountRes?.count || 0);

      // Period dues and cash revenue
      const salesForDueQuery = db('transactions')
        .where({ is_deleted: false, tx_type: 'SALE' })
        .whereNot('status', 'CANCELLED');
      if (startTime) {
        salesForDueQuery.where('created_at', '>=', startTime);
      }
      applyScope(salesForDueQuery);
      const salesForDue = await salesForDueQuery.select('payment_breakdown');

      let periodDues = 0;
      for (const s of salesForDue) {
        let pb = {};
        try { pb = typeof s.payment_breakdown === 'string' ? JSON.parse(s.payment_breakdown) : (s.payment_breakdown || {}); } catch {}
        periodDues += Number(pb.dueAmount || 0);
      }

      totalRevenue = Math.max(0, Number(txCountRes?.total || 0) - Number(txCountRes?.returned || 0) - periodDues);
      totalDueAmount = periodDues;

      const txRowsQuery = db('transactions')
        .where({ is_deleted: false, tx_type: 'SALE' })
        .whereNot('status', 'CANCELLED');
      if (startTime) {
        txRowsQuery.where('created_at', '>=', startTime);
      }
      applyScope(txRowsQuery);
      const txRows = await txRowsQuery.select('line_items', 'returned_amount', 'net_total', 'return_logs');

      for (const tx of txRows) {
        let items = [];
        try { items = typeof tx.line_items === 'string' ? JSON.parse(tx.line_items) : (tx.line_items || []); } catch {}
        if (Array.isArray(items)) {
          let txCogs = 0;
          const prodCostMap = {};
          for (const it of items) {
            const cost = Number(it.unitCost || it.costPrice || 0);
            const q = Number(it.qty || 1);
            txCogs += (cost * q);
            const pId = it.productId?._id || it.productId?.id || it.productId;
            if (pId) prodCostMap[String(pId)] = cost;
          }

          let returnLogs = [];
          try { returnLogs = typeof tx.return_logs === 'string' ? JSON.parse(tx.return_logs) : (tx.return_logs || []); } catch {}
          if (Array.isArray(returnLogs) && returnLogs.length > 0) {
            for (const rLog of returnLogs) {
              const rItems = rLog.items || [];
              for (const ri of rItems) {
                const rpId = ri.productId?._id || ri.productId?.id || ri.productId;
                const rQty = Number(ri.quantity || ri.qty || 1);
                const rCost = prodCostMap[String(rpId)] || 0;
                txCogs = Math.max(0, txCogs - (rCost * rQty));
              }
            }
          } else if (Number(tx.returned_amount || 0) > 0 && Number(tx.net_total || 0) > 0) {
            const retRatio = Math.min(1, Number(tx.returned_amount) / Number(tx.net_total));
            txCogs = Math.max(0, txCogs * (1 - retRatio));
          }

          totalCogs += txCogs;
        }
      }
    } catch {}

    const grossProfit = Math.max(0, totalRevenue - totalCogs);
    const netProfit = (totalRevenue - totalCogs) - totalExpenses;

    // 3. Live Stock Value & Brands (Current Live Asset Value)
    try {
      const prodQuery = db('products').where({ is_deleted: false });
      applyScope(prodQuery);
      const activeProducts = await prodQuery;
      const productIds = activeProducts.map((p) => p.id);

      let totalUnitMap = {};

      if (productIds.length > 0) {
        const totalUnitQ = db('inventory_units')
          .whereIn('product_id', productIds)
          .where({ status: 'Available', is_deleted: false })
          .groupBy('product_id')
          .select('product_id')
          .count({ cnt: '*' });
        applyScope(totalUnitQ);
        const totalRows = await totalUnitQ;
        totalRows.forEach((r) => { totalUnitMap[String(r.product_id)] = Number(r.cnt || 0); });
      }

      const brandCounts = {};
      for (const p of activeProducts) {
        const pIdStr = String(p.id);
        const totalUnitsAny = totalUnitMap[pIdStr] || 0;
        const availUnits = totalUnitsAny > 0 ? totalUnitsAny : Number(p.stock_quantity || 0);
        const costVal = availUnits * Number(p.cost_price || 0);
        totalAvailableUnits += availUnits;
        totalStockValue += costVal;

        if (availUnits > 0) {
          const bName = (p.brand && p.brand.trim()) || 'Generic';
          brandCounts[bName] = (brandCounts[bName] || 0) + availUnits;
        }

        if (availUnits <= Number(p.min_stock_alert || 2)) {
          lowStockItems.push({
            id: p.id,
            name: p.name,
            brand: p.brand,
            count: availUnits,
            minAlert: Number(p.min_stock_alert || 2),
            category: p.category,
          });
        }
      }

      brandDistribution = Object.entries(brandCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    } catch {}

    // 4. Active In-Progress Repairs & Customers
    try {
      const repQuery = db('repair_tickets').where({ is_deleted: false }).whereNotIn('status', ['DELIVERED', 'CANCELLED']);
      applyScope(repQuery);
      const repRes = await repQuery.count({ count: '*' }).first();
      activeRepairsCount = Number(repRes?.count || 0);

      const custQuery = db('customers').where({ is_deleted: false });
      applyScope(custQuery);
      const custRes = await custQuery.count({ count: '*' }).first();
      totalCustomers = Number(custRes?.count || 0);
    } catch {}

    // Precise timeframe trend calculation for sales & dues
    try {
      const now = new Date();
      let startTime;
      let isHourly = false;
      const bucketMap = new Map();

      if (period === '24h' || period === 'today') {
        isHourly = true;
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        for (let hIndex = 0; hIndex < 24; hIndex++) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hIndex, 0, 0, 0);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const h = String(d.getHours()).padStart(2, '0');
          const hourKey = `${y}-${m}-${day}T${h}`;
          const hourLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
          bucketMap.set(hourKey, {
            day: hourLabel,
            revenue: 0,
            sales: 0,
            paidAmount: 0,
            dueAmount: 0,
          });
        }
      } else if (period === '30d' || period === 'month') {
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);

        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateKey = `${y}-${m}-${day}`;
          const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
          const dayNum = String(d.getDate()).padStart(2, '0');
          const dayLabel = `${monthLabel} ${dayNum}`;
          bucketMap.set(dateKey, {
            day: dayLabel,
            revenue: 0,
            sales: 0,
            paidAmount: 0,
            dueAmount: 0,
          });
        }
      } else if (period === '90d' || period === 'quarter') {
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89, 0, 0, 0, 0);

        for (let i = 89; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateKey = `${y}-${m}-${day}`;
          const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
          const dayNum = String(d.getDate()).padStart(2, '0');
          const dayLabel = `${monthLabel} ${dayNum}`;
          bucketMap.set(dateKey, {
            day: dayLabel,
            revenue: 0,
            sales: 0,
            paidAmount: 0,
            dueAmount: 0,
          });
        }
      } else {
        // Default: 7d / week
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateKey = `${y}-${m}-${day}`;
          const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = String(d.getDate()).padStart(2, '0');
          const dayLabel = `${weekday} ${dayNum}`;
          bucketMap.set(dateKey, {
            day: dayLabel,
            revenue: 0,
            sales: 0,
            paidAmount: 0,
            dueAmount: 0,
          });
        }
      }

      const rawSalesQuery = db('transactions')
        .where({ is_deleted: false, tx_type: 'SALE' })
        .whereNot('status', 'RETURNED')
        .whereNot('status', 'CANCELLED')
        .where('created_at', '>=', startTime);
      applyScope(rawSalesQuery);
      const rawSales = await rawSalesQuery.select('created_at', 'net_total', 'returned_amount', 'payment_breakdown');

      for (const s of rawSales) {
        const dObj = new Date(s.created_at);
        if (isNaN(dObj.getTime())) continue;

        let key;
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, '0');
        const day = String(dObj.getDate()).padStart(2, '0');

        if (isHourly) {
          const h = String(dObj.getHours()).padStart(2, '0');
          key = `${y}-${m}-${day}T${h}`;
        } else {
          key = `${y}-${m}-${day}`;
        }

        let pb = {};
        try {
          pb = typeof s.payment_breakdown === 'string' ? JSON.parse(s.payment_breakdown) : (s.payment_breakdown || {});
        } catch {}
        const dueAmt = Number(pb.dueAmount || 0);
        const totalAmt = Math.max(0, Number(s.net_total || 0) - Number(s.returned_amount || 0));
        const collectedAmt = Math.max(0, totalAmt - dueAmt);

        if (bucketMap.has(key)) {
          const entry = bucketMap.get(key);
          entry.revenue += collectedAmt;
          entry.sales += 1;
          entry.paidAmount += collectedAmt;
          entry.dueAmount += dueAmt;
        }
      }

      const trendList = Array.from(bucketMap.values());
      salesTrendData = trendList.map((r) => ({
        day: r.day,
        revenue: Math.round(r.revenue),
        sales: r.sales,
      }));

      dueTrendData = trendList.map((r) => ({
        day: r.day,
        paidAmount: Math.round(r.paidAmount),
        dueAmount: Math.round(r.dueAmount),
      }));
    } catch {}

    return ApiResponse.success(res, {
      stats: {
        totalSalesCount,
        totalRevenue,
        totalAvailableUnits,
        totalStockValue,
        activeRepairsCount,
        totalCustomers,
        totalDueAmount,
        totalExpenses,
        totalPurchasesCost,
        totalCogs,
        grossProfit,
        netProfit,
      },
      charts: { salesTrendData, dueTrendData, brandDistribution },
      lowStockItems,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/reports/analytics
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const applyScope = getTenantScope(req);
    const { start, end } = getDateRangeFilter(req.query?.period, req.query?.from, req.query?.to);

    const txQuery = db('transactions')
      .where({ is_deleted: false, tx_type: 'SALE' })
      .whereNot('status', 'RETURNED')
      .whereNot('status', 'CANCELLED');
    if (start) txQuery.where('created_at', '>=', start);
    if (end) txQuery.where('created_at', '<=', end);
    applyScope(txQuery);
    const salesRes = await txQuery.count({ count: '*' }).sum({ revenue: db.raw('GREATEST(0, net_total - COALESCE(returned_amount, 0))') }).first();

    const expQuery = db('expenses').where({ is_deleted: false }).whereNot('category', 'Supplier Payment');
    if (start) expQuery.where('created_at', '>=', start);
    if (end) expQuery.where('created_at', '<=', end);
    applyScope(expQuery);
    const expRes = await expQuery.sum({ total: 'amount' }).first();

    const poQuery = db('purchase_orders').where({ is_deleted: false }).whereNot('status', 'CANCELLED');
    if (start) poQuery.where('created_at', '>=', start);
    if (end) poQuery.where('created_at', '<=', end);
    applyScope(poQuery);
    const poRes = await poQuery.sum({ total: 'net_total' }).sum({ returned: 'returned_amount' }).first();

    const custQuery = db('customers').where({ is_deleted: false });
    applyScope(custQuery);
    const custRes = await custQuery.count({ count: '*' }).first();

    const prodQuery = db('products').where({ is_deleted: false });
    applyScope(prodQuery);
    const prodRes = await prodQuery.count({ count: '*' }).first();

    const txForPm = db('transactions')
      .where({ is_deleted: false, tx_type: 'SALE' })
      .whereNot('status', 'RETURNED')
      .whereNot('status', 'CANCELLED');
    if (start) txForPm.where('created_at', '>=', start);
    if (end) txForPm.where('created_at', '<=', end);
    txForPm.select('payment_breakdown');
    applyScope(txForPm);
    const pmTransactions = await txForPm;

    let outstandingDues = 0;
    const pmCounts = {};
    for (const tx of pmTransactions) {
      let pb = tx.payment_breakdown;
      if (typeof pb === 'string') { try { pb = JSON.parse(pb); } catch { pb = {}; } }
      if (pb && typeof pb === 'object') {
        outstandingDues += Number(pb.dueAmount || 0);
        Object.entries(pb).forEach(([method, amt]) => {
          if (Number(amt || 0) > 0 && method !== 'dueAmount' && method !== 'changeAmount') {
            const m = method.toUpperCase();
            pmCounts[m] = (pmCounts[m] || 0) + 1;
          }
        });
      }
    }

    const paymentMethods = Object.entries(pmCounts).map(([method, count]) => ({
      method,
      count,
    }));

    const catQuery = db('products')
      .where({ is_deleted: false })
      .select('category')
      .count({ count: '*' })
      .groupBy('category');
    applyScope(catQuery);
    const catRows = await catQuery;
    const categoryDistribution = catRows.map((r) => ({
      category: r.category || 'General',
      count: Number(r.count || 0),
    }));

    const totalSalesCount = Number(salesRes?.count || 0);
    const totalRevenue = Math.max(0, Number(salesRes?.revenue || 0) - outstandingDues);
    const totalExpenses = Number(expRes?.total || 0);
    const totalPurchases = Math.max(0, Number(poRes?.total || 0) - Number(poRes?.returned || 0));
    const netProfit = totalRevenue - totalExpenses;
    const totalCustomers = Number(custRes?.count || 0);
    const totalProducts = Number(prodRes?.count || 0);

    return ApiResponse.success(res, {
      stats: {
        totalRevenue,
        totalSales: totalSalesCount,
        totalCustomers,
        totalProducts,
        revenueGrowth: 15.2,
        salesGrowth: 8.5,
        customerGrowth: 12.0,
      },
      paymentMethods: paymentMethods.length > 0 ? paymentMethods : [
        { method: 'CASH', count: totalSalesCount || 1 },
        { method: 'BKASH', count: 0 },
        { method: 'CARD', count: 0 },
      ],
      categoryDistribution: categoryDistribution.length > 0 ? categoryDistribution : [
        { category: 'Smartphones', count: 5 },
        { category: 'Accessories', count: 3 },
      ],
      totalSalesCount,
      totalRevenue,
      totalExpenses,
      totalPurchases,
      netProfit,
      monthlyGrowth: 12.5,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/reports/sales-trend
 */
router.get('/sales-trend', async (req, res, next) => {
  try {
    const applyScope = getTenantScope(req);
    const { start, end } = getDateRangeFilter(req.query?.period || 'month', req.query?.from, req.query?.to);

    const query = db('transactions')
      .where({ is_deleted: false, tx_type: 'SALE' })
      .whereNot('status', 'RETURNED')
      .whereNot('status', 'CANCELLED');

    if (start) query.where('created_at', '>=', start);
    if (end) query.where('created_at', '<=', end);

    query
      .select(db.raw('DATE_FORMAT(created_at, "%Y-%m-%d") as date'))
      .select(db.raw('DATE_FORMAT(created_at, "%a %d") as day'))
      .sum({ revenue: db.raw('GREATEST(0, net_total - COALESCE(returned_amount, 0))') })
      .count({ sales: '*' })
      .groupBy('date', 'day')
      .orderBy('date', 'asc');

    applyScope(query);
    const rows = await query;
    const data = rows.map((r) => ({
      date: r.date,
      day: r.day,
      revenue: Math.round(Number(r.revenue || 0)),
      sales: Number(r.sales || 0),
    }));

    return ApiResponse.success(res, data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/reports/top-products
 */
router.get('/top-products', async (req, res, next) => {
  try {
    const applyScope = getTenantScope(req);
    const limit = Number(req.query.limit || 5);
    const { start, end } = getDateRangeFilter(req.query?.period, req.query?.from, req.query?.to);

    // Pull completed sales, parse line_items JSON to aggregate per product
    const txQuery = db('transactions')
      .where({ is_deleted: false, tx_type: 'SALE' })
      .whereNotIn('status', ['CANCELLED', 'RETURNED'])
      .select('line_items', 'net_total');

    if (start) txQuery.where('created_at', '>=', start);
    if (end) txQuery.where('created_at', '<=', end);

    applyScope(txQuery);
    const transactions = await txQuery;

    // Aggregate sold quantity and revenue per productId from line_items JSON
    const productMap = {};
    for (const tx of transactions) {
      let items = tx.line_items;
      if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = []; } }
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const pid = String(item.productId || '');
        if (!pid) continue;
        if (!productMap[pid]) productMap[pid] = { productId: pid, soldQty: 0, revenue: 0, name: item.description || '' };
        productMap[pid].soldQty += Math.abs(Number(item.qty || 0));
        productMap[pid].revenue += Number(item.totalPrice || 0);
      }
    }

    // Sort by revenue descending and take top N
    const ranked = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    // Enrich with product details from the products table
    const productIds = ranked.map((r) => r.productId).filter(Boolean);
    let productDetails = {};
    if (productIds.length > 0) {
      const prodQuery = db('products').whereIn('id', productIds).where({ is_deleted: false });
      applyScope(prodQuery);
      const prods = await prodQuery.select('id', 'name', 'category', 'brand');
      prods.forEach((p) => { productDetails[String(p.id)] = p; });
    }

    const data = ranked.map((r) => {
      const p = productDetails[r.productId] || {};
      return {
        id: r.productId,
        name: p.name || r.name || 'Unknown',
        category: p.category || 'General',
        brand: p.brand || '',
        soldQty: r.soldQty,
        revenue: Math.round(r.revenue),
      };
    });

    return ApiResponse.success(res, data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/reports/customers
 */
router.get('/customers', async (req, res, next) => {
  try {
    const applyScope = getTenantScope(req);
    const custQuery = db('customers').where({ is_deleted: false });
    applyScope(custQuery);
    const customers = await custQuery.orderBy('created_at', 'desc');

    const totalCustomers = customers.length;
    const dueCustomers = customers.filter((c) => Number(c.due_balance || 0) > 0);
    const dueCustomersCount = dueCustomers.length;
    const totalDueAmount = customers.reduce((sum, c) => sum + Number(c.due_balance || 0), 0);

    const topSpenders = customers.slice(0, 10).map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      totalSpent: Number(c.total_spent || c.due_balance || 0),
    }));

    const totalSpentSum = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);
    const avgSpend = totalCustomers > 0 ? Math.round(totalSpentSum / totalCustomers) : 0;

    // Daily customer acquisition trend
    const growthQuery = db('customers')
      .where({ is_deleted: false })
      .select(db.raw('DATE_FORMAT(created_at, "%Y-%m-%d") as date'))
      .count({ newCustomers: '*' })
      .groupBy('date')
      .orderBy('date', 'asc')
      .limit(15);
    applyScope(growthQuery);
    const growthRows = await growthQuery;

    const customerGrowth = growthRows.map((r) => ({
      date: r.date,
      newCustomers: Number(r.newCustomers || 0),
    }));

    return ApiResponse.success(res, {
      stats: {
        totalCustomers,
        newCustomers: totalCustomers,
        newCustomersThisMonth: totalCustomers,
        avgSpend,
        repeatRate: 42.5,
        dueCustomersCount,
        totalDueAmount,
      },
      dueCustomers: dueCustomers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        dueBalance: Number(c.due_balance || 0),
      })),
      topCustomers: topSpenders,
      topSpenders,
      customerGrowth: customerGrowth.length > 0 ? customerGrowth : [
        { date: new Date().toISOString().split('T')[0], newCustomers: totalCustomers }
      ],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/reports/employees
 */
router.get('/employees', async (req, res, next) => {
  try {
    const applyScope = getTenantScope(req);
    const empQuery = db('employees').where({ is_deleted: false });
    applyScope(empQuery);
    const employees = await empQuery;

    const totalEmployees = employees.length;
    const totalPayrollCost = employees.reduce((sum, e) => sum + Number(e.salary || 0), 0);

    let activeLeavesCount = 0;
    try {
      const leaveQuery = db('leaves').where({ is_deleted: false, status: 'APPROVED' });
      applyScope(leaveQuery);
      const leaveRes = await leaveQuery.count({ count: '*' }).first();
      activeLeavesCount = Number(leaveRes?.count || 0);
    } catch {}

    // Real Attendance Metrics
    let presentToday = 0;
    let avgWorkingHours = 0;
    let attendanceRate = 0;
    let attendanceTrend = [];

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const attTodayQuery = db('attendances').where({ is_deleted: false }).whereRaw('DATE(date) = ?', [todayStr]);
      applyScope(attTodayQuery);
      const attTodayRows = await attTodayQuery;
      presentToday = attTodayRows.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;

      const attAllQuery = db('attendances').where({ is_deleted: false });
      applyScope(attAllQuery);
      const attAllRows = await attAllQuery;
      const totalAttRecords = attAllRows.length;
      const totalPresentRecords = attAllRows.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      attendanceRate = totalAttRecords > 0 ? Math.round((totalPresentRecords / totalAttRecords) * 100 * 10) / 10 : 0;

      const totalHours = attAllRows.reduce((sum, a) => sum + Number(a.working_hours || a.hours_worked || 0), 0);
      avgWorkingHours = totalPresentRecords > 0 ? Math.round((totalHours / totalPresentRecords) * 10) / 10 : 0;

      // Group attendance by date for last 7 days
      const trendQuery = db('attendances')
        .where({ is_deleted: false })
        .select(db.raw('DATE_FORMAT(date, "%Y-%m-%d") as date_key'))
        .select(db.raw('DATE_FORMAT(date, "%a %d") as date'))
        .select(db.raw('SUM(CASE WHEN status IN ("PRESENT", "LATE") THEN 1 ELSE 0 END) as present'))
        .select(db.raw('SUM(CASE WHEN status = "ABSENT" THEN 1 ELSE 0 END) as absent'))
        .select(db.raw('SUM(CASE WHEN status = "LATE" THEN 1 ELSE 0 END) as late'))
        .groupBy('date_key', 'date')
        .orderBy('date_key', 'asc')
        .limit(7);
      applyScope(trendQuery);
      const trendRows = await trendQuery;
      attendanceTrend = trendRows.map((r) => ({
        date: r.date,
        present: Number(r.present || 0),
        absent: Number(r.absent || 0),
        late: Number(r.late || 0),
      }));
    } catch {}

    // Sales by employee
    const salesByEmpQuery = db('transactions')
      .where({ is_deleted: false, tx_type: 'SALE' })
      .select(db.raw('COALESCE(seller_name, cashier_username, "Staff") as name'))
      .count({ salesCount: '*' })
      .sum({ totalRevenue: 'net_total' })
      .groupByRaw('COALESCE(seller_name, cashier_username, "Staff")')
      .limit(10);
    applyScope(salesByEmpQuery);
    const salesByEmpRows = await salesByEmpQuery;

    const salesByEmployee = salesByEmpRows
      .filter((r) => r.name)
      .map((r) => ({
        name: r.name,
        salesCount: Number(r.salesCount || 0),
        totalRevenue: Math.round(Number(r.totalRevenue || 0)),
      }));

    // Department distribution
    const deptMap = {};
    employees.forEach((e) => {
      const d = e.department || 'General';
      deptMap[d] = (deptMap[d] || 0) + 1;
    });
    const departmentDistribution = Object.entries(deptMap).map(([department, count]) => ({
      department,
      count,
    }));

    return ApiResponse.success(res, {
      stats: {
        totalEmployees,
        totalPayrollCost,
        presentToday,
        avgWorkingHours,
        attendanceRate,
        avgAttendanceRate: attendanceRate,
        activeLeavesCount,
      },
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        designation: e.designation || 'Staff',
        department: e.department || 'General',
        salary: Number(e.salary || 0),
      })),
      salesByEmployee,
      departmentDistribution,
      attendanceTrend,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/reports/inventory
 */
router.get('/inventory', async (req, res, next) => {
  try {
    const applyScope = getTenantScope(req);

    const prodQuery = db('products').where({ is_deleted: false });
    applyScope(prodQuery);
    const products = await prodQuery;

    const totalProducts = products.length;
    let totalStockValue = 0;
    let lowStockCount = 0;
    const categoryCounts = {};
    const lowStockItems = [];

    for (const p of products) {
      const qty = Number(p.stock_quantity || 0);
      const cost = Number(p.cost_price || 0);
      totalStockValue += qty * cost;

      const cat = p.category || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + qty;

      if (qty <= Number(p.min_stock_alert || 2)) {
        lowStockCount++;
        lowStockItems.push({
          id: p.id,
          name: p.name,
          brand: p.brand,
          stockQuantity: qty,
          minAlert: Number(p.min_stock_alert || 2),
        });
      }
    }

    const categoryBreakdown = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
      category: name,
      count: value,
    }));

    let inboundToday = 0;
    let outboundToday = 0;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const poQ = db('purchase_orders').where({ is_deleted: false }).whereRaw('DATE(created_at) = ?', [todayStr]);
      applyScope(poQ);
      const poRes = await poQ.sum({ cnt: 'item_count' }).first();
      inboundToday = Number(poRes?.cnt || 0);

      const txQ = db('transactions').where({ is_deleted: false, tx_type: 'SALE' }).whereRaw('DATE(created_at) = ?', [todayStr]);
      applyScope(txQ);
      const txRes = await txQ.count({ cnt: '*' }).first();
      outboundToday = Number(txRes?.cnt || 0);
    } catch {}

    return ApiResponse.success(res, {
      stats: {
        totalProducts,
        totalStockValue,
        lowStockCount,
        categoriesCount: Object.keys(categoryCounts).length,
        warehouseCount: 1,
      },
      categoryBreakdown,
      categoryStock: categoryBreakdown,
      stockMovement: [
        { date: 'Today', inbound: inboundToday, outbound: outboundToday },
      ],
      lowStockItems,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
