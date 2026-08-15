import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Building,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  Download,
  Eye,
  FileText,
  Minus,
  Package,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import PageHeader from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { NumberInput } from '../../components/ui/NumberInput';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

const STATUSES = ['ALL', 'RECEIVED', 'APPROVED', 'PARTIALLY_RECEIVED', 'DRAFT', 'CANCELLED'];

const STATUS_COLORS = {
  RECEIVED: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  APPROVED: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  PARTIALLY_RECEIVED: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  DRAFT: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  CANCELLED: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
};

export default function PurchaseOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewPO, setViewPO] = useState(null);
  const [returnPO, setReturnPO] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['purchase-orders', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/purchase-orders', {
        params: { search, status: statusFilter, limit: 100 },
      });
      return res.data;
    },
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const res = await api.get('/suppliers', { params: { limit: 200 } });
      return res.data?.data || [];
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 500 } });
      return res.data?.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/purchase-orders/${id}`),
    onSuccess: () => {
      toast.success('Purchase order deleted');
      queryClient.invalidateQueries(['purchase-orders']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete'),
  });

  const handleDelete = async (po) => {
    const ok = await confirmDelete(`Purchase Order ${po.poNumber}`);
    if (ok) {
      deleteMutation.mutate(po._id || po.id);
    }
  };

  const orders = data?.data || [];
  const suppliers = suppliersData || [];
  const products = productsData || [];

  const summary = useMemo(() => {
    const totalPurchases = orders.reduce((acc, o) => acc + (Number(o.netTotal) || 0), 0);
    const totalPaid = orders.reduce((acc, o) => acc + (Number(o.paidAmount) || 0), 0);
    const totalDue = orders.reduce((acc, o) => acc + (Number(o.dueAmount) || 0), 0);
    const totalReturned = orders.reduce((acc, o) => acc + (Number(o.returnedAmount) || 0), 0);
    return { totalPurchases, totalPaid, totalDue, totalReturned };
  }, [orders]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase & Inventory Restock"
        subtitle="Manage supplier purchases, restock store products automatically, track IMEIs, and process supplier returns."
        icon={Truck}
        breadcrumbs={['Purchases & Suppliers', 'Purchase Orders']}
        actions={
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> New Restock Purchase
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Purchases</div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">৳{summary.totalPurchases.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{orders.length} order(s) recorded</div>
        </div>
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Paid</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">৳{summary.totalPaid.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Disbursed to suppliers</div>
        </div>
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Supplier Payable Due</div>
          <div className={`text-xl font-black mt-1 ${summary.totalDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
            ৳{summary.totalDue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pending supplier bills</div>
        </div>
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Returned to Supplier</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">৳{summary.totalReturned.toLocaleString()}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Returned defective / credit</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO #, supplier, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors shrink-0 ${
                statusFilter === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {s === 'ALL' ? 'All Orders' : s.replace(/_/g, ' ')}
            </button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl border-slate-200 dark:border-slate-800 shrink-0 text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3.5">PO Number</th>
                <th className="px-4 py-3.5">Supplier</th>
                <th className="px-4 py-3.5">Items & Qty</th>
                <th className="px-4 py-3.5 text-right">Grand Total</th>
                <th className="px-4 py-3.5 text-right">Paid</th>
                <th className="px-4 py-3.5 text-right">Due</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="px-4 py-4">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                    <Truck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No purchase orders found</p>
                    <p className="text-xs text-slate-500 mt-1">Click "New Restock Purchase" to add your first stock restock.</p>
                  </td>
                </tr>
              ) : (
                orders.map((po) => {
                  const supplierName = po.supplierId?.name || (typeof po.supplierId === 'string' ? po.supplierId : 'Supplier');
                  const supplierPhone = po.supplierId?.phone || '';
                  const totalItems = (po.lineItems || []).reduce((acc, it) => acc + Number(it.qty || 1), 0);
                  const returnedAmount = Number(po.returnedAmount || 0);

                  return (
                    <tr key={po._id || po.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{po.poNumber}</span>
                        {po.notes && <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{po.notes}</div>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{supplierName}</div>
                        {supplierPhone && <div className="text-[10px] text-slate-400 font-mono">{supplierPhone}</div>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {po.lineItems?.length || 0} product(s) ({totalItems} pcs)
                        </div>
                        {po.lineItems?.length > 0 && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {po.lineItems.map((it) => it.description || it.name).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        ৳{Number(po.netTotal || 0).toLocaleString()}
                        {returnedAmount > 0 && (
                          <div className="text-[10px] text-amber-600 font-semibold">-৳{returnedAmount.toLocaleString()} ret.</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{Number(po.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold">
                        <span className={Number(po.dueAmount || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
                          ৳{Number(po.dueAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            STATUS_COLORS[po.status] || STATUS_COLORS.DRAFT
                          }`}
                        >
                          {po.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(po.createdAt).toLocaleDateString('en-BD')}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewPO(po)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setReturnPO(po)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 transition-colors"
                            title="Return to Supplier"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(po)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
                            title="Delete Purchase"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 1. UNIFIED NEW RESTOCK PURCHASE MODAL ── */}
      {showCreateModal && (
        <CreatePurchaseModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['purchase-orders']);
            queryClient.invalidateQueries(['products']);
            queryClient.invalidateQueries(['products-list']);
            queryClient.invalidateQueries(['stock-overview']);
          }}
        />
      )}

      {/* ── 2. RETURN TO SUPPLIER MODAL ── */}
      {returnPO && (
        <ReturnSupplierModal
          po={returnPO}
          onClose={() => setReturnPO(null)}
          onSuccess={() => {
            setReturnPO(null);
            queryClient.invalidateQueries(['purchase-orders']);
            queryClient.invalidateQueries(['products']);
            queryClient.invalidateQueries(['products-list']);
            queryClient.invalidateQueries(['stock-overview']);
          }}
        />
      )}

      {/* ── 3. VIEW PURCHASE DETAILS MODAL ── */}
      {viewPO && (
        <ViewPurchaseModal
          po={viewPO}
          onClose={() => setViewPO(null)}
          onReturn={() => {
            const current = viewPO;
            setViewPO(null);
            setReturnPO(current);
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// MODAL 1: UNIFIED SINGLE RESTOCK PURCHASE MODAL
// ----------------------------------------------------------------------
function CreatePurchaseModal({ suppliers, products, onClose, onSuccess }) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?._id || suppliers[0]?.id || '');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [isQuickSupplier, setIsQuickSupplier] = useState(suppliers.length === 0);

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');

  const [lineItems, setLineItems] = useState([
    {
      productId: '',
      productName: '',
      category: 'Smartphones',
      qty: 1,
      unitCost: 0,
      sellingPrice: 0,
      showImei: false,
      imeiText: '',
    },
  ]);

  const mutation = useMutation({
    mutationFn: async (payload) => api.post('/purchase-orders', payload),
    onSuccess: () => {
      toast.success('Stock purchased and added to store inventory successfully!');
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record purchase');
    },
  });

  const handleAddLine = () => {
    setLineItems((prev) => [
      ...prev,
      {
        productId: '',
        productName: '',
        category: 'Smartphones',
        qty: 1,
        unitCost: 0,
        sellingPrice: 0,
        showImei: false,
        imeiText: '',
      },
    ]);
  };

  const handleRemoveLine = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index, prodId) => {
    const selected = products.find((p) => String(p._id || p.id) === String(prodId));
    setLineItems((prev) => {
      const next = [...prev];
      if (selected) {
        next[index] = {
          ...next[index],
          productId: selected._id || selected.id,
          productName: selected.name,
          category: selected.category || 'Smartphones',
          unitCost: Number(selected.costPrice || selected.cost_price || 0),
          sellingPrice: Number(selected.sellingPrice || selected.selling_price || 0),
        };
      } else {
        next[index] = {
          ...next[index],
          productId: 'new',
          productName: '',
        };
      }
      return next;
    });
  };

  const handleLineChange = (index, field, val) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const subTotal = useMemo(() => {
    return lineItems.reduce((sum, it) => sum + (Number(it.qty || 1) * Number(it.unitCost || 0)), 0);
  }, [lineItems]);

  const netTotal = Math.max(0, subTotal - Number(discount || 0) + Number(tax || 0));
  const dueAmount = Math.max(0, netTotal - Number(paidAmount || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalSupplierId = supplierId;
    if (isQuickSupplier) {
      if (!newSupplierName.trim()) {
        toast.error('Please provide a supplier name');
        return;
      }
      try {
        const supRes = await api.post('/suppliers', {
          name: newSupplierName,
          phone: newSupplierPhone || 'N/A',
        });
        finalSupplierId = supRes.data?.data?._id || supRes.data?.data?.id;
      } catch (err) {
        toast.error('Failed to create new supplier');
        return;
      }
    }

    if (!finalSupplierId) {
      toast.error('Please select or create a supplier');
      return;
    }

    const processedLines = lineItems.map((it) => {
      const imeis = it.imeiText
        ? it.imeiText
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      return {
        productId: it.productId && it.productId !== 'new' ? it.productId : undefined,
        productName: it.productName || 'Gadget Item',
        description: it.productName || 'Gadget Item',
        category: it.category || 'General',
        qty: Number(it.qty || 1),
        unitCost: Number(it.unitCost || 0),
        sellingPrice: Number(it.sellingPrice || (Number(it.unitCost) * 1.25)),
        imeis,
      };
    });

    mutation.mutate({
      supplierId: finalSupplierId,
      lineItems: processedLines,
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      paymentMethod,
      paidAmount: Number(paidAmount || 0),
      notes,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="p-6 pb-3 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
            <Truck className="w-5 h-5 text-blue-600" /> New Stock Restock / Purchase Order
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Add purchased stock from supplier. Products and inventory stock will be automatically synchronized.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Supplier Section */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" /> Supplier Details *
              </span>
              <button
                type="button"
                onClick={() => setIsQuickSupplier(!isQuickSupplier)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                {isQuickSupplier ? 'Select Existing Supplier' : '+ Quick Add New Supplier'}
              </button>
            </div>

            {!isQuickSupplier ? (
              <div>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name} {s.phone ? `(${s.phone})` : ''} {s.company ? `— ${s.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px]">Supplier / Vendor Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Star Tech Wholesale"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    className="h-8 text-xs rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Phone Number</Label>
                  <Input
                    placeholder="e.g. 01700000000"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    className="h-8 text-xs rounded-lg mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Product Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" /> Restock Items & Pricing *
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                className="h-7 text-xs rounded-lg gap-1 border-blue-200 dark:border-blue-800 text-blue-600"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Item
              </Button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div
                  key={index}
                  className="p-3.5 bg-slate-50/80 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-4">
                      <Label className="text-[10px] text-slate-500 uppercase font-semibold">
                        Product (Select or Type New) *
                      </Label>
                      <div className="space-y-1 mt-1">
                        <select
                          value={item.productId || (item.productName ? 'new' : '')}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        >
                          <option value="new">+ Type New Product Name...</option>
                          <optgroup label="Existing Products in Store">
                            {products.map((p) => (
                              <option key={p._id || p.id} value={p._id || p.id}>
                                {p.name} (Stock: {p.stock || 0})
                              </option>
                            ))}
                          </optgroup>
                        </select>

                        {(!item.productId || item.productId === 'new') && (
                          <Input
                            required
                            placeholder="Enter product model / name..."
                            value={item.productName}
                            onChange={(e) => handleLineChange(index, 'productName', e.target.value)}
                            className="h-7 text-xs rounded-lg"
                          />
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <Label className="text-[10px] text-slate-500 uppercase font-semibold">Qty *</Label>
                      <Input
                        type="number"
                        min="1"
                        required
                        value={item.qty}
                        onChange={(e) => handleLineChange(index, 'qty', Math.max(1, Number(e.target.value)))}
                        className="h-7 text-xs rounded-lg mt-1 font-mono text-center"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label className="text-[10px] text-slate-500 uppercase font-semibold">Unit Cost (৳) *</Label>
                      <Input
                        type="number"
                        min="0"
                        required
                        value={item.unitCost}
                        onChange={(e) => handleLineChange(index, 'unitCost', Number(e.target.value))}
                        className="h-7 text-xs rounded-lg mt-1 font-mono text-right"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label className="text-[10px] text-slate-500 uppercase font-semibold">Retail Price (৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.sellingPrice}
                        onChange={(e) => handleLineChange(index, 'sellingPrice', Number(e.target.value))}
                        className="h-7 text-xs rounded-lg mt-1 font-mono text-right"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between gap-1.5 pb-0.5">
                      <div className="text-right flex-1 min-w-0">
                        <div className="text-[9px] text-slate-400 uppercase">Subtotal</div>
                        <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          ৳{(Number(item.qty || 1) * Number(item.unitCost || 0)).toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={lineItems.length <= 1}
                        onClick={() => handleRemoveLine(index)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Optional IMEI Drawer Toggle */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleLineChange(index, 'showImei', !item.showImei)}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Tag className="w-3 h-3" />
                      {item.showImei ? 'Hide IMEI/Serial Entry' : '+ Optional: Enter IMEI/Serials Now (or add later)'}
                    </button>
                  </div>

                  {item.showImei && (
                    <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                      <Label className="text-[10px] text-slate-500">
                        Enter IMEI / Serial Numbers ({item.qty} units expected, separated by comma or new lines)
                      </Label>
                      <textarea
                        rows={2}
                        placeholder="354890123456789, 354890123456790..."
                        value={item.imeiText}
                        onChange={(e) => handleLineChange(index, 'imeiText', e.target.value)}
                        className="w-full mt-1 p-2 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold">Payment Method</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  <option value="CASH">Cash Payment</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="ROCKET">Rocket</option>
                  <option value="CREDIT">Supplier Credit (Pay Later)</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Order / Reference Notes</Label>
                <textarea
                  rows={2}
                  placeholder="Invoice #, delivery notes, terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 p-2 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">৳{subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">Discount:</span>
                <Input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="h-6 w-28 text-xs font-mono text-right rounded"
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">Tax / VAT:</span>
                <Input
                  type="number"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(Number(e.target.value))}
                  className="h-6 w-28 text-xs font-mono text-right rounded"
                />
              </div>
              <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-slate-100 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                <span>GRAND TOTAL:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">৳{netTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Paid Now:</span>
                <Input
                  type="number"
                  min="0"
                  max={netTotal}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="h-6 w-28 text-xs font-mono text-right rounded border-emerald-500 font-bold"
                />
              </div>

              <div className="flex justify-between font-bold text-xs pt-1">
                <span className={dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
                  Balance Due:
                </span>
                <span className={`font-mono ${dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                  ৳{dueAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {mutation.isPending ? 'Saving & Adding Stock...' : 'Confirm Restock & Add to Store'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// MODAL 2: RETURN ITEMS TO SUPPLIER MODAL
// ----------------------------------------------------------------------
function ReturnSupplierModal({ po, onClose, onSuccess }) {
  const lineItems = po.lineItems || [];
  const [returnSelection, setReturnSelection] = useState({});
  const [generalReason, setGeneralReason] = useState('Defective item / Supplier Return');

  const mutation = useMutation({
    mutationFn: async (payload) => api.post(`/purchase-orders/${po._id || po.id}/return`, payload),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Products returned to supplier successfully!');
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to process supplier return');
    },
  });

  const toggleItem = (item, idx) => {
    const key = `item-${idx}`;
    if (returnSelection[key]) {
      const next = { ...returnSelection };
      delete next[key];
      setReturnSelection(next);
    } else {
      setReturnSelection({
        ...returnSelection,
        [key]: {
          productId: item.productId?._id || item.productId?.id || item.productId,
          description: item.description || item.name,
          unitCost: Number(item.unitCost || 0),
          maxQty: Number(item.qty || 1),
          qty: 1,
          refundAmount: Number(item.unitCost || 0),
          reason: generalReason,
          notes: '',
        },
      });
    }
  };

  const updateItem = (key, field, val) => {
    if (!returnSelection[key]) return;
    setReturnSelection({
      ...returnSelection,
      [key]: {
        ...returnSelection[key],
        [field]: val,
      },
    });
  };

  const totalRefund = useMemo(() => {
    return Object.values(returnSelection).reduce((sum, it) => sum + (Number(it.refundAmount) || (Number(it.unitCost || 0) * Number(it.qty || 1))), 0);
  }, [returnSelection]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const items = Object.values(returnSelection);
    if (items.length === 0) {
      toast.error('Please select at least 1 item to return');
      return;
    }
    mutation.mutate({ items, reason: generalReason });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
            <RotateCcw className="w-5 h-5" /> Return Products to Supplier
          </DialogTitle>
          <DialogDescription className="text-xs">
            Return items from PO <strong className="font-mono">{po.poNumber}</strong> back to vendor. Store stock will be deducted and supplier balance adjusted.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label className="text-xs font-semibold">General Return Reason</Label>
            <Input
              value={generalReason}
              onChange={(e) => setGeneralReason(e.target.value)}
              placeholder="e.g. Factory fault, wrong batch received"
              className="h-8 text-xs mt-1 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-slate-500">Select Items to Return</Label>
            {lineItems.map((item, idx) => {
              const key = `item-${idx}`;
              const isSelected = !!returnSelection[key];
              const maxQty = Number(item.qty || 1);

              return (
                <div
                  key={key}
                  className={`p-3 rounded-xl border transition-colors space-y-2 ${
                    isSelected
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item, idx)}
                        className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                      />
                      <div className="truncate">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {item.description || item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Purchased: {item.qty} pcs @ ৳{Number(item.unitCost || 0).toLocaleString()}
                        </div>
                      </div>
                    </label>

                    <div className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                      Total: ৳{Number(item.totalCost || (item.qty * item.unitCost) || 0).toLocaleString()}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-rose-200 dark:border-rose-900/40">
                      <div>
                        <Label className="text-[10px] text-slate-500">Return Qty (Max {maxQty})</Label>
                        <Input
                          type="number"
                          min="1"
                          max={maxQty}
                          value={returnSelection[key]?.qty}
                          onChange={(e) => {
                            const q = Math.min(maxQty, Math.max(1, Number(e.target.value)));
                            updateItem(key, 'qty', q);
                            updateItem(key, 'refundAmount', q * (item.unitCost || 0));
                          }}
                          className="h-7 text-xs font-mono rounded mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500">Refund / Credit (৳)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={returnSelection[key]?.refundAmount}
                          onChange={(e) => updateItem(key, 'refundAmount', Number(e.target.value))}
                          className="h-7 text-xs font-mono rounded mt-0.5 text-right font-bold text-rose-600"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500">Item Notes</Label>
                        <Input
                          placeholder="Optional details..."
                          value={returnSelection[key]?.notes}
                          onChange={(e) => updateItem(key, 'notes', e.target.value)}
                          className="h-7 text-xs rounded mt-0.5"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between sm:justify-between">
            <div className="text-xs font-bold">
              Total Credit Refund: <span className="text-rose-600 font-mono text-sm">৳{totalRefund.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || Object.keys(returnSelection).length === 0}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {mutation.isPending ? 'Processing Return...' : 'Confirm Return to Supplier'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// MODAL 3: VIEW PURCHASE ORDER & GOODS RECEIPT SLIP
// ----------------------------------------------------------------------
function ViewPurchaseModal({ po, onClose, onReturn }) {
  const supplierName = po.supplierId?.name || (typeof po.supplierId === 'string' ? po.supplierId : 'Supplier');
  const supplierPhone = po.supplierId?.phone || '';
  const supplierAddress = po.supplierId?.address || '';
  const lineItems = po.lineItems || [];
  const returnLogs = po.returnLogs || [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
                {po.poNumber}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Purchased on {new Date(po.createdAt).toLocaleString('en-BD')}
              </DialogDescription>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                STATUS_COLORS[po.status] || STATUS_COLORS.DRAFT
              }`}
            >
              {po.status?.replace(/_/g, ' ')}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Supplier Strip */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{supplierName}</div>
            {supplierPhone && <div className="text-slate-500 font-mono mt-0.5">Phone: {supplierPhone}</div>}
            {supplierAddress && <div className="text-slate-400 mt-0.5">{supplierAddress}</div>}
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-center">Qty</th>
                  <th className="px-3 py-2 text-right">Unit Cost</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{item.description || item.name}</div>
                      {item.imeis?.length > 0 && (
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                          IMEIs: {item.imeis.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-bold">{item.qty}</td>
                    <td className="px-3 py-2 text-right font-mono">৳{Number(item.unitCost || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      ৳{Number(item.totalCost || (item.qty * item.unitCost) || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financials & Notes */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div>Payment Method: <strong>{po.paymentMethod}</strong></div>
              <div>Paid: <strong className="text-emerald-600">৳{Number(po.paidAmount || 0).toLocaleString()}</strong></div>
              <div>Due: <strong className={Number(po.dueAmount || 0) > 0 ? 'text-rose-600' : 'text-slate-500'}>৳{Number(po.dueAmount || 0).toLocaleString()}</strong></div>
              {po.notes && <div className="text-[11px] text-slate-400 pt-1 border-t">Notes: {po.notes}</div>}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-right">
              <div>Subtotal: ৳{Number(po.subTotal || 0).toLocaleString()}</div>
              {po.discount > 0 && <div className="text-rose-600">Discount: -৳{Number(po.discount).toLocaleString()}</div>}
              {po.tax > 0 && <div>Tax: +৳{Number(po.tax).toLocaleString()}</div>}
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 pt-1 border-t">
                Net Total: ৳{Number(po.netTotal || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Return History */}
          {returnLogs.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs space-y-1.5">
              <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Supplier Return Logs ({returnLogs.length})
              </div>
              <div className="divide-y divide-amber-200/60 dark:divide-amber-900/40">
                {returnLogs.map((r, i) => (
                  <div key={i} className="py-1 flex justify-between text-[11px]">
                    <span>{r.description} ({r.qty} pcs) — {r.reason}</span>
                    <span className="font-bold text-rose-600 font-mono">-৳{Number(r.refundAmount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReturn}
            className="text-amber-600 border-amber-300 dark:border-amber-800 rounded-xl gap-1 text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Return Items to Supplier
          </Button>
          <Button type="button" onClick={onClose} size="sm" className="rounded-xl text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
