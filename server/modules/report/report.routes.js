import { Router } from 'express';
import { Transaction } from '../sale/sale.model.js';
import { InventoryUnit } from '../imei/imei.model.js';
import { RepairTicket } from '../../models/RepairTicket.js';
import { Product } from '../product/product.model.js';
import { Customer } from '../customer/customer.model.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER', 'CASHIER', 'STAFF'));

router.get('/dashboard', async (req, res, next) => {
  try {
    let totalSalesCount = 0, totalRevenue = 0;
    let totalAvailableUnits = 0, totalStockValue = 0;
    let activeRepairsCount = 0, totalCustomers = 0;

    try {
      totalSalesCount = await Transaction.countDocuments({ isDeleted: false });
      const revenueResult = await Transaction.aggregate([
        { $match: { isDeleted: false, txType: 'SALE' } },
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
      const activeProducts = await Product.find({ isDeleted: false });

      // Get count of available IMEI units grouped by productId
      const imeiAvailableCounts = await InventoryUnit.aggregate([
        { $match: { status: 'Available', isDeleted: false } },
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
        (await InventoryUnit.distinct('productId', { isDeleted: false })).map(id => id?.toString()).filter(Boolean)
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
      activeRepairsCount = await RepairTicket.countDocuments({
        status: { $nin: ['DELIVERED', 'CANCELLED'] },
      });
    } catch {}

    let totalDueAmount = 0;
    try {
      totalCustomers = await Customer.countDocuments({ isDeleted: false });
      const custDue = await Customer.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, due: { $sum: '$dueBalance' } } }
      ]);
      totalDueAmount = custDue[0]?.due || 0;
    } catch {}

    // Real sales & due trend (last 7 days)
    let salesTrendData = [];
    let dueTrendData = [];
    try {
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const nextD = new Date(d);
        nextD.setDate(nextD.getDate() + 1);

        const daySales = await Transaction.aggregate([
          { $match: { isDeleted: false, txType: 'SALE', createdAt: { $gte: d, $lt: nextD } } },
          { $group: { _id: null, revenue: { $sum: '$netTotal' }, due: { $sum: '$paymentBreakdown.dueAmount' }, count: { $sum: 1 } } },
        ]);

        const rev = daySales[0]?.revenue || 0;
        const due = daySales[0]?.due || 0;

        salesTrendData.push({
          day: days[d.getDay()],
          revenue: rev,
          sales: daySales[0]?.count || 0,
        });

        dueTrendData.push({
          day: days[d.getDay()],
          dueAmount: due,
          paidAmount: Math.max(0, rev - due),
        });
      }
    } catch {}

    // Real brand distribution
    let brandDistribution = [];
    try {
      const brandData = await InventoryUnit.aggregate([
        { $match: { status: 'Available', isDeleted: false } },
        { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$product.brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]);
      brandDistribution = brandData.map(b => ({ name: b._id || 'Unknown', value: b.count }));

      if (brandDistribution.length === 0) {
        const prodBrandData = await Product.aggregate([
          { $match: { isDeleted: false, stockQuantity: { $gt: 0 } } },
          { $group: { _id: '$brand', count: { $sum: '$stockQuantity' } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]);
        brandDistribution = prodBrandData.map(b => ({ name: b._id || 'General', value: b.count }));
      }
    } catch {}

    return ApiResponse.success(res, {
      stats: { totalSalesCount, totalRevenue, totalAvailableUnits, totalStockValue, activeRepairsCount, totalCustomers, totalDueAmount },
      charts: { salesTrendData, dueTrendData, brandDistribution },
      lowStockItems,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
