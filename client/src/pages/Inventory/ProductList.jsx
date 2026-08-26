import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  Edit,
  FileText,
  Filter,
  Info,
  Package,
  Plus,
  Search,
  Smartphone,
  Trash2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';
import { NumberInput } from '../../components/ui/NumberInput';

const PHONE_CATEGORIES = [
  'smartphones',
  'feature phones',
  'phones',
  'mobile phones',
  'handsets',
  'smart phones',
  'smartphone',
];
const isPhoneCat = (cat) => PHONE_CATEGORIES.includes((cat || '').toLowerCase().trim());

const UNIT_COLORS = [
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800',
];
const getUnitColorClass = (idx) => UNIT_COLORS[idx % UNIT_COLORS.length];

import PageHeader from '../../components/layout/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

import { useBranchStore } from '../../store/branchStore';

export default function ProductList() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const queryClient = useQueryClient();
  const { styled } = useTheme();
  const fileInputRef = useRef(null);
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

  const { data: catList } = useQuery({
    queryKey: ['catalog', 'CATEGORY', activeBranchId],
    queryFn: async () => {
      const { data } = await api.get('/catalog', { params: { type: 'CATEGORY' } });
      return data.data || [];
    },
  });

  const categories = catList || [];
  const CATEGORIES = ['ALL', ...categories.map((c) => c.name)];

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, category, activeBranchId],
    queryFn: async () => {
      const res = await api.get('/products', { params: { search, category, limit: 50, branchId: activeBranchId } });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries(['products']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete'),
  });

  const importMutation = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post('/products/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (res) => {
      toast.success(`Imported: ${res.data.data.created} created, ${res.data.data.skipped} skipped`);
      queryClient.invalidateQueries(['products']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Import failed'),
  });

  const handleExport = async () => {
    try {
      const res = await api.get('/products/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Products exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (file) importMutation.mutate(file);
    e.target.value = '';
  };

  const products = data?.data || [];
  const toggleExpand = (id) => setExpandedProduct((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Inventory"
        subtitle="Manage your store's smartphones, accessories, IMEI serials, stock prices, and category catalog."
        icon={Package}
        breadcrumbs={['Products & Stock', 'Products Catalog']}
        actions={
          <>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-xs transition-all border border-slate-200 dark:border-slate-700 shadow-xs"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-xs transition-all border border-slate-200 dark:border-slate-700 shadow-xs disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> {importMutation.isPending ? 'Importing...' : 'Import'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImport}
            />
            <button
              onClick={() => setShowBulkImport(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs transition-all shadow-xs"
            >
              <FileText className="w-4 h-4" /> Bulk IMEI
            </button>
            <button
              onClick={() => {
                setEditProduct(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <th className="text-left px-2 py-3 w-8"></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  SKU
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Stock &amp; IMEIs
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Cost
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Retail
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                  Wholesale
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <React.Fragment key={p._id}>
                    <tr className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-2 py-3">
                        {(p.availableIMEIs?.length > 0 || isPhoneCat(p.category)) && (
                          <button
                            onClick={() => toggleExpand(p._id)}
                            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                          >
                            {expandedProduct === p._id ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {p.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-xs text-gray-500 font-medium">{p.brand}</span>
                            {(p.ram || p.storage) && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                {p.ram}
                                {p.ram && p.storage ? ' / ' : ''}
                                {p.storage}
                              </span>
                            )}
                            {p.color && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                {p.color}
                              </span>
                            )}
                            {p.warrantyMonths !== undefined && (
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                  p.warrantyMonths > 0
                                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                {p.warrantyMonths > 0
                                  ? `${p.warrantyMonths}m Warranty`
                                  : 'No Warranty (N/A)'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
                          {p.sku || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                          {p.category || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.availableIMEIs?.length > 0 ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <Smartphone className="w-3 h-3" /> {p.availableIMEIs.length} Unit
                              {p.availableIMEIs.length > 1 ? 's' : ''}
                            </span>
                            <div
                              className="text-[10px] font-mono text-gray-400 max-w-[160px] truncate"
                              title={p.availableIMEIs.join(', ')}
                            >
                              {p.availableIMEIs.slice(0, 2).join(', ')}
                              {p.availableIMEIs.length > 2
                                ? ` +${p.availableIMEIs.length - 2}`
                                : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-gray-500">
                            {p.stockQuantity ?? 0} in stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-gray-700 dark:text-gray-300">
                        &#2547;{p.costPrice?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono font-bold text-green-700 dark:text-green-400">
                        &#2547;{p.sellingPrice?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {Number(p.wholesalePrice || 0) > 0 ? (
                          `৳${Number(p.wholesalePrice).toLocaleString()}`
                        ) : (
                          <span className="text-gray-400 font-normal text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditProduct(p);
                              setShowForm(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              confirmDelete(`Delete "${p.name}"?`, () =>
                                deleteMutation.mutate(p._id)
                              )
                            }
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedProduct === p._id && (
                      <tr className="bg-gray-50/70 dark:bg-gray-900/40">
                        <td colSpan={8} className="px-6 pb-4 pt-2">
                          <IMEIUnitsPanel productId={p._id} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data?.pagination && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
            Showing {products.length} of {data.pagination.total} products
          </div>
        )}
      </div>

      {showForm && (
        <ProductFormModal
          product={editProduct}
          onClose={() => {
            setShowForm(false);
            setEditProduct(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditProduct(null);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['catalog'] });
            queryClient.invalidateQueries({ queryKey: ['stock-overview-products'] });
          }}
        />
      )}

      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => {
            setShowBulkImport(false);
            queryClient.invalidateQueries(['products']);
          }}
        />
      )}
    </div>
  );
}

function IMEIUnitsPanel({ productId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['imei-units', productId],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}/imei-units`);
      return res.data?.data || [];
    },
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex gap-2 py-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-xs text-gray-400 py-2">No individual IMEI units found for this product.</p>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Available IMEI Units &mdash; {data.length} total
      </p>
      <div className="flex flex-wrap gap-2">
        {data.map((unit, idx) => (
          <div
            key={unit._id || idx}
            className={`inline-flex flex-col px-3 py-1.5 rounded-lg border text-[10px] font-mono ${getUnitColorClass(idx)}`}
          >
            <span className="font-bold text-[11px] tracking-widest">{unit.imeiOrSerial}</span>
            <div className="flex items-center gap-2 mt-0.5 font-sans">
              {unit.color && <span className="font-semibold">{unit.color}</span>}
              {(unit.ram || unit.storage) && (
                <span className="opacity-80">
                  {unit.ram}
                  {unit.ram && unit.storage ? '/' : ''}
                  {unit.storage}
                </span>
              )}
              <span
                className={`ml-auto px-1 rounded text-[9px] font-bold uppercase ${unit.status === 'Available' ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}
              >
                {unit.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BulkImportModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState('json');
  const [jsonText, setJsonText] = useState('');
  const [csvText, setCsvText] = useState('');
  const [isParsed, setIsParsed] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [parseError, setParseError] = useState('');

  const JSON_TEMPLATE = JSON.stringify(
    [
      {
        name: 'Samsung Galaxy A55',
        brand: 'Samsung',
        category: 'Smartphones',
        costPrice: 35000,
        sellingPrice: 40000,
        wholesalePrice: 37000,
        imei: '358910481029410',
        color: 'Awesome Navy',
        ram: '8GB',
        storage: '128GB',
      },
      {
        name: 'Samsung Galaxy A55',
        brand: 'Samsung',
        category: 'Smartphones',
        costPrice: 35000,
        sellingPrice: 40000,
        wholesalePrice: 37000,
        imei: '358910481029411',
        color: 'Awesome Lilac',
        ram: '8GB',
        storage: '128GB',
      },
      {
        name: 'iPhone 15',
        brand: 'Apple',
        category: 'Smartphones',
        costPrice: 110000,
        sellingPrice: 125000,
        wholesalePrice: 118000,
        imei: '990000862471854',
        color: 'Black Titanium',
        ram: '8GB',
        storage: '256GB',
      },
    ],
    null,
    2
  );

  const CSV_TEMPLATE =
    'name,brand,category,costPrice,sellingPrice,wholesalePrice,imei,color,ram,storage\nSamsung Galaxy A55,Samsung,Smartphones,35000,40000,37000,358910481029410,Awesome Navy,8GB,128GB\nSamsung Galaxy A55,Samsung,Smartphones,35000,40000,37000,358910481029411,Awesome Lilac,8GB,128GB\niPhone 15,Apple,Smartphones,110000,125000,118000,990000862471854,Black Titanium,8GB,256GB';

  const downloadTemplate = (type) => {
    const content = type === 'json' ? JSON_TEMPLATE : CSV_TEMPLATE;
    const mime = type === 'json' ? 'application/json' : 'text/csv';
    const ext = type === 'json' ? 'json' : 'csv';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_import_template.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseContent = () => {
    setParseError('');
    try {
      let rows = [];
      if (tab === 'json') {
        rows = JSON.parse(jsonText.trim());
        if (!Array.isArray(rows)) throw new Error('JSON must be an array of objects');
      } else {
        const lines = csvText.trim().split('\n').filter(Boolean);
        if (lines.length < 2)
          throw new Error('CSV must have a header row and at least one data row');
        const headers = lines[0].split(',').map((h) => h.trim());
        rows = lines.slice(1).map((line) => {
          const vals = line.split(',').map((v) => v.trim());
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = vals[i] || '';
          });
          return obj;
        });
      }
      if (!Array.isArray(rows) || rows.length === 0) throw new Error('No rows found');
      setParsedRows(rows);
      setIsParsed(true);
    } catch (err) {
      setParseError(err.message);
      setIsParsed(false);
    }
  };

  const bulkMutation = useMutation({
    mutationFn: async (rows) => api.post('/products/bulk-import', { rows }),
    onSuccess: (res) => {
      const d = res.data?.data || {};
      toast.success(
        `Bulk import complete: ${d.createdProductsCount || 0} products, ${d.createdImeisCount || 0} IMEIs added`
      );
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Bulk import failed'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800 shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" /> Bulk IMEI Import
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Import multiple products with individual IMEI, Color &amp; RAM/Storage per unit
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex gap-2">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Each row = one IMEI unit.</strong> Same product name+brand gets grouped
            automatically. Fields:{' '}
            <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
              name, brand, category, costPrice, sellingPrice, wholesalePrice, imei, color, ram,
              storage
            </code>
            . Phone categories require a unique 15-digit IMEI per unit. Non-phone items may omit
            imei.
          </div>
        </div>

        <div className="px-6 pt-4">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            {['json', 'csv'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setIsParsed(false);
                  setParsedRows([]);
                  setParseError('');
                }}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${tab === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pt-3 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Paste your {tab.toUpperCase()} below, or download a template.
            </p>
            <button
              onClick={() => downloadTemplate(tab)}
              className="text-xs font-semibold text-purple-600 hover:text-purple-500 flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download Template
            </button>
          </div>

          <textarea
            value={tab === 'json' ? jsonText : csvText}
            onChange={(e) =>
              tab === 'json' ? setJsonText(e.target.value) : setCsvText(e.target.value)
            }
            rows={10}
            placeholder={tab === 'json' ? JSON_TEMPLATE : CSV_TEMPLATE}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 resize-none"
            spellCheck={false}
          />

          {parseError && (
            <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">{parseError}</p>
            </div>
          )}

          {isParsed && parsedRows.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {parsedRows.length} rows parsed &mdash; preview
              </p>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-52">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                      <tr>
                        {[
                          '#',
                          'Name',
                          'Brand',
                          'Category',
                          'IMEI',
                          'Color',
                          'RAM',
                          'Storage',
                          'Sell Price',
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        >
                          <td className="px-3 py-1.5 text-gray-400">{idx + 1}</td>
                          <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {row.name || '\u2014'}
                          </td>
                          <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">
                            {row.brand || '\u2014'}
                          </td>
                          <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">
                            {row.category || '\u2014'}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-purple-700 dark:text-purple-400 whitespace-nowrap">
                            {row.imei || '\u2014'}
                          </td>
                          <td className="px-3 py-1.5">
                            {row.color ? (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getUnitColorClass(idx)}`}
                              >
                                {row.color}
                              </span>
                            ) : (
                              '\u2014'
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">
                            {row.ram || '\u2014'}
                          </td>
                          <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">
                            {row.storage || '\u2014'}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-green-700 dark:text-green-400">
                            &#2547;{Number(row.sellingPrice || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          {!isParsed ? (
            <button
              onClick={parseContent}
              disabled={!(tab === 'json' ? jsonText.trim() : csvText.trim())}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium rounded-lg text-sm transition-colors"
            >
              Parse &amp; Preview
            </button>
          ) : (
            <button
              onClick={() => bulkMutation.mutate(parsedRows)}
              disabled={bulkMutation.isPending}
              className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {bulkMutation.isPending ? 'Importing...' : `Import ${parsedRows.length} Rows`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductFormModal({ product, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    category: product?.category || '',
    model: product?.model || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    imeiOrSerial: '',
    stockQuantity: product?.stockQuantity ?? 1,
    ram: product?.ram || '',
    storage: product?.storage || '',
    color: product?.color || '',
    costPrice: product?.costPrice || '',
    sellingPrice: product?.sellingPrice || '',
    wholesalePrice: product?.wholesalePrice || '',
    vatRate: product?.vatRate || 0,
    unit: product?.unit || 'piece',
    warrantyMonths: product?.warrantyMonths ?? 12,
    minStockAlert: product?.minStockAlert || 2,
    isActive: product?.isActive !== false,
    description: product?.description || '',
  });

  const { data: catList } = useQuery({
    queryKey: ['catalog', 'CATEGORY'],
    queryFn: async () => {
      const { data } = await api.get('/catalog', { params: { type: 'CATEGORY' } });
      return data.data || [];
    },
  });

  const { data: brandList } = useQuery({
    queryKey: ['catalog', 'BRAND'],
    queryFn: async () => {
      const { data } = await api.get('/catalog', { params: { type: 'BRAND' } });
      return data.data || [];
    },
  });

  const isPhone = isPhoneCat(form.category);

  // Auto calculate IMEI line count for stock quantity
  const imeiLinesCount = form.imeiOrSerial
    ? form.imeiOrSerial
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean).length
    : 0;

  const cost = Number(form.costPrice) || 0;
  const sell = Number(form.sellingPrice) || 0;
  const profit = sell - cost;
  const marginPct = sell > 0 ? ((profit / sell) * 100).toFixed(1) : 0;

  const inputCls =
    'w-full px-3.5 py-2 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all';

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        costPrice: Number(data.costPrice),
        sellingPrice: Number(data.sellingPrice),
        wholesalePrice: Number(data.wholesalePrice) || undefined,
        stockQuantity:
          isPhone && imeiLinesCount > 0 ? imeiLinesCount : Number(data.stockQuantity) || 0,
        warrantyMonths: Number(data.warrantyMonths) || 0,
        vatRate: Number(data.vatRate) || 0,
        minStockAlert: Number(data.minStockAlert),
        isActive: data.isActive,
      };
      if (product) return api.put(`/products/${product._id}`, payload);
      return api.post('/products', payload);
    },
    onSuccess: () => {
      toast.success(product ? 'Product updated successfully' : 'Product created successfully');
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save product'),
  });

  const handleAutoSKU = () => {
    const brandName = form.brand || 'PROD';
    const prefix =
      brandName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8) || 'PROD';
    const random6 = Math.floor(100000 + Math.random() * 900000);
    setForm((prev) => ({ ...prev, sku: `${prefix}-${random6}` }));
  };

  const handleBrandChange = (val) => {
    setForm((prev) => {
      const updated = { ...prev, brand: val };
      if (!prev.sku) {
        const prefix =
          (val || 'PROD')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 8) || 'PROD';
        const random6 = Math.floor(100000 + Math.random() * 900000);
        updated.sku = `${prefix}-${random6}`;
      }
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-primary w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {product ? 'Edit Product Catalog' : 'Add New Product'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Enter product details, pricing, variants, and IMEIs
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Full Width Segmented Control Tab Navigation */}
        <div className="px-5 py-2.5 shrink-0 border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl">
            {[
              { id: 'basic', label: '1. Basic Info' },
              { id: 'imei', label: `2. IMEIs ${isPhone ? '*' : ''}` },
              { id: 'pricing', label: '3. Pricing & Stock' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
                  activeTab === t.id
                    ? 'bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
          className="p-5 space-y-3.5 overflow-y-auto flex-1"
        >
          {/* Tab 1: Basic Info */}
          {activeTab === 'basic' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Product Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. iPhone 15 Pro Max"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Brand *
                  </label>
                  <input
                    required
                    value={form.brand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    list="brand-list"
                    placeholder="Apple, Samsung, etc."
                    className={inputCls}
                  />
                  <datalist id="brand-list">
                    {(brandList || []).map((b) => (
                      <option key={b._id} value={b.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <input
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    list="category-list"
                    placeholder="Select category"
                    className={inputCls}
                  />
                  <datalist id="category-list">
                    {[
                      'SMARTPHONE',
                      'FEATURE_PHONE',
                      'CHARGER',
                      'HEADPHONE',
                      'BACK_COVER',
                      'SCREEN_PROTECTOR',
                      'POWER_BANK',
                      'SMARTWATCH',
                      'EARBUDS',
                      'ACCESSORIES',
                      'OTHER',
                      ...(catList || []).map((c) => c.name),
                    ].map((catName, idx) => (
                      <option key={idx} value={catName} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Model
                  </label>
                  <input
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="e.g. A3106 / 256GB"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      SKU Code
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoSKU}
                      className="text-[11px] text-[#2563EB] dark:text-blue-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Wand2 className="w-3 h-3" /> Auto
                    </button>
                  </div>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. APPLE-849201"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Barcode
                  </label>
                  <input
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    placeholder="Scan or type barcode"
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Unit Measurement
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className={inputCls}
                >
                  <option value="piece">Piece (Pcs)</option>
                  <option value="set">Set / Pack</option>
                  <option value="box">Box</option>
                </select>
              </div>
            </div>
          )}

          {/* Tab 2: IMEIs & Variants */}
          {activeTab === 'imei' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    className={`block text-xs font-bold uppercase tracking-wider ${
                      isPhone
                        ? 'text-[#2563EB] dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isPhone
                      ? 'IMEI List * (15 Digits Per Line)'
                      : 'IMEI / Serial Numbers (Optional)'}
                  </label>
                  {imeiLinesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-400 text-xs font-mono font-bold">
                      {imeiLinesCount} units detected
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={form.imeiOrSerial}
                  onChange={(e) => setForm({ ...form, imeiOrSerial: e.target.value })}
                  placeholder={
                    isPhone
                      ? 'Format: 15-Digit-IMEI:Color:RAM/Storage\nExample:\n358910481029410:Midnight Black:8GB/256GB\n358910481029411:Natural Titanium:8GB/256GB'
                      : 'Optional serial numbers, one per line\nExample: SN104920194'
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  For phone categories, each line represents one inventory unit. Stock quantity will
                  automatically update.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Default RAM
                  </label>
                  <input
                    value={form.ram}
                    onChange={(e) => setForm({ ...form, ram: e.target.value })}
                    placeholder="e.g. 8GB"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Default Storage
                  </label>
                  <input
                    value={form.storage}
                    onChange={(e) => setForm({ ...form, storage: e.target.value })}
                    placeholder="e.g. 256GB"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Default Color
                  </label>
                  <input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="e.g. Black"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Pricing & Stock */}
          {activeTab === 'pricing' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Cost Price (৳) *
                  </label>
                  <NumberInput
                    required
                    value={form.costPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    placeholder="0.00"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Selling Price (৳) *
                  </label>
                  <NumberInput
                    required
                    value={form.sellingPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    placeholder="0.00"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Wholesale (৳)
                  </label>
                  <NumberInput
                    value={form.wholesalePrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })}
                    placeholder="0.00"
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              {/* Live Profit Margin Calculator Indicator */}
              {cost > 0 && sell > 0 && (
                <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Estimated Unit Profit:</span>
                  <div className="flex items-center gap-3 font-mono font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ৳{profit.toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {marginPct}% Margin
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Stock Qty {isPhone ? '(auto)' : '*'}
                  </label>
                  <NumberInput
                    min="0"
                    required
                    disabled={isPhone && imeiLinesCount > 0}
                    value={isPhone && imeiLinesCount > 0 ? imeiLinesCount : form.stockQuantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    className={`${inputCls} font-bold font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Warranty (Months)
                  </label>
                  <select
                    value={form.warrantyMonths}
                    onChange={(e) => setForm({ ...form, warrantyMonths: Number(e.target.value) })}
                    className={inputCls}
                  >
                    <option value={0}>No Warranty</option>
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={24}>24 Months (2 Years)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Min Stock Alert
                  </label>
                  <NumberInput
                    value={form.minStockAlert}
                    onChange={(e) => setForm({ ...form, minStockAlert: e.target.value })}
                    min={1}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Active in Product Catalog
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-xs"
            >
              {mutation.isPending
                ? 'Saving Product...'
                : product
                  ? 'Update Product'
                  : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
