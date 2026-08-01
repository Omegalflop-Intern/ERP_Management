import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  DollarSign,
  Layers,
  Package,
  PackageX,
  Search,
  ShieldCheck,
  Smartphone,
  Tag,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { StockAdjustmentModal } from '../../components/stock/StockAdjustmentModal';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All Items' },
  { id: 'AVAILABLE', label: 'In Stock' },
  { id: 'SOLD', label: 'Sold Out' },
  { id: 'IMEI', label: 'IMEI / Serial Devices' },
  { id: 'BULK', label: 'Bulk Products (No IMEI)' },
];

export default function StockOverview() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const { styled } = useTheme();

  const { data: catList } = useQuery({
    queryKey: ['catalog', 'CATEGORY'],
    queryFn: async () => {
      const { data } = await api.get('/catalog', { params: { type: 'CATEGORY' } });
      return data.data || [];
    },
  });

  const CATEGORIES = ['ALL', ...(catList || []).map((c) => c.name)];

  const { data: inventoryRes, isLoading: loadingInventory } = useQuery({
    queryKey: ['stock-overview-inventory'],
    queryFn: async () => {
      const res = await api.get('/inventory', { params: { limit: 500 } });
      return res.data?.data || [];
    },
  });

  const { data: productsRes, isLoading: loadingProducts } = useQuery({
    queryKey: ['stock-overview-products'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 500 } });
      return res.data?.data || [];
    },
  });

  const inventoryUnits = inventoryRes || [];
  const products = productsRes || [];

  const isLoading = loadingInventory || loadingProducts;

  const imeiProductIds = new Set(
    inventoryUnits.map((u) => u.productId?._id || u.productId).filter(Boolean)
  );

  const unifiedItems = [];

  inventoryUnits.forEach((u) => {
    const prod = u.productId && typeof u.productId === 'object' ? u.productId : {};
    unifiedItems.push({
      id: `imei-${u._id}`,
      name: prod.name || 'Device',
      brand: prod.brand || '',
      category: prod.category || 'General',
      sku: prod.sku || '',
      type: 'IMEI',
      imeiOrSerial: u.imeiOrSerial,
      status: u.status === 'Available' ? 'Available' : 'Sold Out',
      costPrice: u.purchasePrice || prod.costPrice || 0,
      sellingPrice: u.currentSellingPrice || prod.sellingPrice || 0,
      warrantyMonths: prod.warrantyMonths ?? 12,
      qty: 1,
      isBulk: false,
    });
  });

  products.forEach((p) => {
    if (!imeiProductIds.has(p._id)) {
      unifiedItems.push({
        id: `bulk-${p._id}`,
        name: p.name,
        brand: p.brand,
        category: p.category || 'General',
        sku: p.sku || '',
        type: 'BULK',
        imeiOrSerial: 'N/A (Bulk Stock)',
        status: p.stockQuantity > 0 ? 'Available' : 'Sold Out',
        costPrice: p.costPrice || 0,
        sellingPrice: p.sellingPrice || 0,
        warrantyMonths: p.warrantyMonths ?? 12,
        qty: p.stockQuantity || 0,
        isBulk: true,
      });
    }
  });

  const availableItems = unifiedItems.filter((i) => i.status === 'Available');
  const soldOutItems = unifiedItems.filter((i) => i.status === 'Sold Out');
  const totalAvailablePcs = availableItems.reduce((acc, i) => acc + i.qty, 0);
  const totalSoldPcs = soldOutItems.reduce((acc, i) => acc + (i.isBulk ? 0 : 1), 0);
  const totalStockValue = availableItems.reduce((acc, i) => acc + i.costPrice * i.qty, 0);
  const imeiCount = availableItems.filter((i) => !i.isBulk).length;
  const bulkCount = availableItems.filter((i) => i.isBulk).reduce((a, b) => a + b.qty, 0);

  const filteredItems = unifiedItems.filter((item) => {
    const query = search.toLowerCase().trim();
    const matchSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.brand.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.imeiOrSerial.toLowerCase().includes(query);

    const matchCat = category === 'ALL' || item.category === category;

    let matchFilter = true;
    if (activeFilter === 'AVAILABLE') matchFilter = item.status === 'Available';
    else if (activeFilter === 'SOLD') matchFilter = item.status === 'Sold Out';
    else if (activeFilter === 'IMEI') matchFilter = !item.isBulk;
    else if (activeFilter === 'BULK') matchFilter = item.isBulk;

    return matchSearch && matchCat && matchFilter;
  });

  const cardCls = styled
    ? 'neu-card p-4 space-y-1'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-1';

  const [showAuditModal, setShowAuditModal] = useState(false);
  const qc = useQueryClient();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Package className="w-7 h-7 text-red-600 dark:text-red-400" /> Stock Overview &amp;
            Inventory Breakdown
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time tracking for available stock, sold out items, IMEI devices &amp; bulk non-IMEI
            inventory
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAuditModal(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-xl transition-colors flex items-center gap-2 shrink-0"
        >
          <PackageX className="w-4 h-4" /> Log Stock Audit / Discrepancy
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardCls}>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center justify-between">
            <span>Available Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {isLoading ? (
              <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              `${totalAvailablePcs} pcs`
            )}
          </div>
          <div className="text-[11px] text-gray-400 font-mono">
            {imeiCount} IMEI units • {bulkCount} bulk pcs
          </div>
        </div>

        <div className={cardCls}>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center justify-between">
            <span>Sold Out Items</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {isLoading ? (
              <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              `${soldOutItems.length} items`
            )}
          </div>
          <div className="text-[11px] text-gray-400 font-mono">Tracked in sales ledger</div>
        </div>

        <div className={cardCls}>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center justify-between">
            <span>Total Stock Value</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            {isLoading ? (
              <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              `৳${totalStockValue.toLocaleString()}`
            )}
          </div>
          <div className="text-[11px] text-gray-400 font-mono">Based on unit cost price</div>
        </div>

        <div className={cardCls}>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center justify-between">
            <span>Product Types</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {isLoading ? (
              <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              `${products.length} Products`
            )}
          </div>
          <div className="text-[11px] text-gray-400 font-mono">
            {(catList || []).length} Catalog categories
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 text-sm ${
              styled
                ? 'neu-input'
                : 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500'
            }`}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === f.id
                  ? 'bg-red-600 text-white shadow-md'
                  : styled
                    ? 'neu-btn-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`px-3 py-1.5 text-xs font-bold ${
              styled
                ? 'neu-input'
                : 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100'
            }`}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock Table */}
      <div
        className={`overflow-hidden ${styled ? 'neu-card p-0' : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800'}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <th className="px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Product &amp; Brand
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  IMEI / Serial
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Type &amp; Warranty
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Status &amp; Stock
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">
                  Cost Price
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">
                  Selling Price
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">
                  Est. Profit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No matching stock items found</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const estProfit = (item.sellingPrice - item.costPrice) * item.qty;
                  const isAvailable = item.status === 'Available';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-sm text-gray-900 dark:text-gray-100">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5">
                          <span>{item.brand}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-gray-400">{item.sku}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {item.isBulk ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 font-mono">
                            Bulk Product
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            {item.imeiOrSerial}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase w-max ${
                              item.isBulk
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            }`}
                          >
                            {item.isBulk ? 'Bulk Stock' : 'IMEI Unit'}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              item.warrantyMonths > 0
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}
                          >
                            {item.warrantyMonths > 0
                              ? `🛡️ ${item.warrantyMonths}m Warranty`
                              : 'No Warranty (N/A)'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              isAvailable
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="text-xs font-bold font-mono text-gray-700 dark:text-gray-300">
                            {item.qty} pc{item.qty > 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-sm text-gray-700 dark:text-gray-300">
                        ৳{item.costPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{item.sellingPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                        +৳{estProfit.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StockAdjustmentModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['stock-overview-inventory'] });
          qc.invalidateQueries({ queryKey: ['stock-overview-products'] });
        }}
      />
    </div>
  );
}
