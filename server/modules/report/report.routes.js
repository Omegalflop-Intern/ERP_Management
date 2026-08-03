import { Router } from 'express';
import { Transaction } from '../sale/sale.model.js';
import { InventoryUnit } from '../imei/imei.model.js';
import { RepairTicket } from '../../models/RepairTicket.js';
import { Product } from '../product/product.model.js';
import { Customer } from '../customer/customer.model.js';
import { Expense } from '../expense/expense.model.js';
import { PurchaseOrder } from '../purchase/purchaseOrder.model.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkTenantStatus } from '../../middleware/tenant.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate);
router.use(checkTenantStatus);
router.use(authorize('ADMIN', 'MANAGER', 'CASHIER', 'STAFF'));

router.get('/dashboard', async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || null;
    const tenantMatch = (query) => (tenantId ? { ...query, tenantId } : query);

    let totalSalesCount = 0, totalRevenue = 0;
    let totalAvailableUnits = 0, totalStockValue = 0;
    let activeRepairsCount = 0, totalCustomers = 0;
    let totalExpenses = 0, totalPurchasesCost = 0, totalCostAndExpenses = 0;

    try {
      const expenseAgg = await Expense.aggregate([
        { $match: tenantMatch({ isDeleted: false }) },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      totalExpenses = expenseAgg[0]?.total || 0;

      const purchaseAgg = await PurchaseOrder.aggregate([
        { $match: tenantMatch({ isDeleted: false, status: { $ne: 'CANCELLED' } }) },
        { $group: { _id: null, total: { $sum: '$netTotal' } } },
      ]);
      totalPurchasesCost = purchaseAgg[0]?.total || 0;

      totalCostAndExpenses = totalExpenses + totalPurchasesCost;
    } catch (err) {
      console.error('[DASHBOARD] Cost & Expense calc error:', err.message);
    }

    try {
      totalSalesCount = await Transaction.countDocuments(tenantMatch({ isDeleted: false }));
      const revenueResult = await Transaction.aggregate([
        { $match: tenantMatch({ isDeleted: false, txType: 'SALE' }) },
        {
          $group: {
            _id: null,
            total: {
              $sum: { $subtract: ['$netTotal', { $ifNull: ['$returnedAmount', 0] }] }
            }
          }
        },
      ]);
      totalRevenue = revenueResult[0]?.total || 0;
    } catch {}

    let lowStockItems = [];
    try {
      const activeProducts = await Product.find(tenantMatch({ isDeleted: false }));

      // Get count of available IMEI units grouped by productId
      const imeiAvailableCounts = await InventoryUnit.aggregate([
        { $match: tenantMatch({ status: 'Available', isDeleted: false }) },
        {
          $group: {
            _id: '$productId',
            count: { $sum: 1 },
            totalCost: { $sum: '$purchasePrice' }
          }
        }
      ]);

      const imeiMap = {};
      imeiAvailableCounts.forEach(c => {
        if (c._id) {
          imeiMap[c._id.toString()] = { count: c.count, totalCost: c.totalCost };
        }
      });

      // Products that have EVER had IMEI units
      const productsWithIMEI = new Set(
        (await InventoryUnit.distinct('productId', tenantMatch({ isDeleted: false }))).map(id => id?.toString()).filter(Boolean)
      );

      let calcAvailableUnits = 0;
      let calcStockValue = 0;

      for (const p of activeProducts) {
        const pIdStr = p._id.toString();
        let availCount = 0;
        let costVal = 0;

        if (productsWithIMEI.has(pIdStr)) {
          // Driven by available IMEI count
          const imeiInfo = imeiMap[pIdStr] || { count: 0, totalCost: 0 };
          availCount = imeiInfo.count;
          costVal = imeiInfo.totalCost || (availCount * p.costPrice);
        } else {
          // Bulk product (driven by stockQuantity)
          availCount = p.stockQuantity || 0;
          costVal = availCount * (p.costPrice || 0);
        }

        calcAvailableUnits += availCount;
        calcStockValue += costVal;

        const minAlert = p.minStockAlert || 2;
        if (availCount <= minAlert) {
          lowStockItems.push({
            id: p._id,
            name: p.name,
            brand: p.brand,
            count: availCount,
            minAlert,
            category: p.category,
          });
        }
      }

      totalAvailableUnits = calcAvailableUnits;
      totalStockValue = calcStockValue;
    } catch {}

    try {
      activeRepairsCount = await RepairTicket.countDocuments(tenantMatch({
        status: { $nin: ['DELIVERED', 'CANCELLED'] },
      }));
    } catch {}

    let totalDueAmount = 0;
    try {
      totalCustomers = await Customer.countDocuments(tenantMatch({ isDeleted: false }));
      const custDue = await Customer.aggregate([
        { $match: tenantMatch({ isDeleted: false }) },
        { $group: { _id: null, due: { $sum: '$dueBalance' } } }
      ]);
      totalDueAmount = custDue[0]?.due || 0;
    } catch {}

    // Real sales & due trend (24h, 7d, 30d, 90d)
    let salesTrendData = [];
    let dueTrendData = [];
    try {
      const period = req.query.period || '7d';
      const now = new Date();

      if (period === '24h') {
        const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const transactions = await Transaction.find(tenantMatch({
          isDeleted: false,
          txType: 'SALE',
          createdAt: { $gte: startTime },
        })).select('netTotal paymentBreakdown.dueAmount createdAt');

        const slots = [];
        for (let i = 23; i >= 0; i--) {
          const slotTime = new Date(now.getTime() - i * 60 * 60 * 1000);
          const hourLabel = slotTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          slots.push({
            year: slotTime.getFullYear(),
            month: slotTime.getMonth(),
            date: slotTime.getDate(),
            hour: slotTime.getHours(),
            day: hourLabel,
            revenue: 0,
            due: 0,
            sales: 0,
          });
        }

        transactions.forEach((tx) => {
          const txDate = new Date(tx.createdAt);
          const y = txDate.getFullYear();
          const m = txDate.getMonth();
          const d = txDate.getDate();
          const h = txDate.getHours();

          const matchingSlot = slots.find(
            (s) => s.year === y && s.month === m && s.date === d && s.hour === h
          );
          if (matchingSlot) {
            const rev = tx.netTotal || 0;
            const due = tx.paymentBreakdown?.dueAmount || 0;
            matchingSlot.revenue += rev;
            matchingSlot.due += due;
            matchingSlot.sales += 1;
          }
        });

        salesTrendData = slots.map((s) => ({
          day: s.day,
          revenue: s.revenue,
          sales: s.sales,
        }));

        dueTrendData = slots.map((s) => ({
          day: s.day,
          dueAmount: s.due,
          paidAmount: Math.max(0, s.revenue - s.due),
        }));
      } else {
        const numDays = period === '30d' ? 30 : period === '90d' ? 90 : 7;
        const startTime = new Date(now);
        startTime.setDate(startTime.getDate() - (numDays - 1));
        startTime.setHours(0, 0, 0, 0);

        const transactions = await Transaction.find(tenantMatch({
          isDeleted: false,
          txType: 'SALE',
          createdAt: { $gte: startTime },
        })).select('netTotal paymentBreakdown.dueAmount createdAt');

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const slots = [];
        const slotMap = {};

        for (let i = numDays - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);

          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const label = numDays === 7 
            ? dayNames[d.getDay()] 
            : `${d.getDate()} ${monthNames[d.getMonth()]}`;

          const slot = {
            dateStr: key,
            day: label,
            revenue: 0,
            due: 0,
            sales: 0,
          };
          slots.push(slot);
          slotMap[key] = slot;
        }

        transactions.forEach((tx) => {
          const txDate = new Date(tx.createdAt);
          const key = `${txDate.getFullYear()}-${txDate.getMonth()}-${txDate.getDate()}`;
          const matchingSlot = slotMap[key];
          if (matchingSlot) {
            const rev = tx.netTotal || 0;
            const due = tx.paymentBreakdown?.dueAmount || 0;
            matchingSlot.revenue += rev;
            matchingSlot.due += due;
            matchingSlot.sales += 1;
          }
        });

        salesTrendData = slots.map((s) => ({
          day: s.day,
          revenue: s.revenue,
          sales: s.sales,
        }));

        dueTrendData = slots.map((s) => ({
          day: s.day,
          dueAmount: s.due,
          paidAmount: Math.max(0, s.revenue - s.due),
        }));
      }
    } catch {}

    // Real brand distribution
    let brandDistribution = [];
    try {
      const brandData = await InventoryUnit.aggregate([
        { $match: tenantMatch({ status: 'Available', isDeleted: false }) },
        { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$product.brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]);
      brandDistribution = brandData.map(b => ({ name: b._id || 'Unknown', value: b.count }));

      if (brandDistribution.length === 0) {
        const prodBrandData = await Product.aggregate([
          { $match: tenantMatch({ isDeleted: false, stockQuantity: { $gt: 0 } }) },
          { $group: { _id: '$brand', count: { $sum: '$stockQuantity' } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]);
        brandDistribution = prodBrandData.map(b => ({ name: b._id || 'General', value: b.count }));
      }
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
        totalCostAndExpenses,
      },
      charts: { salesTrendData, dueTrendData, brandDistribution },
      lowStockItems,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
