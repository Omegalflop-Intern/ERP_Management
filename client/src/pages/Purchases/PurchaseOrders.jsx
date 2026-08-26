import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Eye,
  Package,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Truck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import PageHeader from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/button';
import PurchaseInvoiceModal from '../../components/purchases/PurchaseInvoiceModal';
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
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

const STATUSES = ['ALL', 'RECEIVED', 'APPROVED', 'PARTIALLY_RECEIVED', 'DRAFT', 'CANCELLED'];

const STATUS_COLORS = {
  RECEIVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  APPROVED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  PARTIALLY_RECEIVED: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  DRAFT: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
  CANCELLED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
};

const CATEGORIES = [
  'Smartphones',
  'Feature Phones',
  'Tablets',
  'Smartwatches',
  'Audio & Earbuds',
  'Chargers & Cables',
  'Power Banks',
  'Cases & Protectors',
  'Accessories',
  'General',
];

export default function PurchaseOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewPO, setViewPO] = useState(null);
  const [returnPO, setReturnPO] = useState(null);
  const [payDuePO, setPayDuePO] = useState(null);
  const [printPO, setPrintPO] = useState(null);
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
    const grossPurchases = orders.reduce((acc, o) => acc + (Number(o.netTotal || o.subTotal) || 0), 0);
    const totalReturned = orders.reduce((acc, o) => acc + (Number(o.returnedAmount) || 0), 0);
    const netPurchases = Math.max(0, grossPurchases - totalReturned);
    const totalPaid = orders.reduce((acc, o) => acc + (Number(o.paidAmount) || 0), 0);
    const totalDue = orders.reduce((acc, o) => acc + (Number(o.dueAmount) || 0), 0);
    return { grossPurchases, netPurchases, totalPurchases: netPurchases, totalPaid, totalDue, totalReturned };
  }, [orders]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase & Inventory Restock"
        subtitle="Manage supplier purchases, restock products automatically, track IMEIs, and process returns."
        icon={Truck}
        breadcrumbs={['Purchases & Suppliers', 'Purchase Orders']}
        actions={
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md text-xs font-semibold px-4 py-2"
          >
            <Plus className="w-4 h-4" /> New Restock Purchase
          </Button>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Net Active Purchases
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1.5 font-mono">
            ৳{summary.netPurchases.toLocaleString()}
          </div>
          <div className="text-[11px] mt-1 font-medium truncate">
            {summary.totalReturned > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                ৳{summary.grossPurchases.toLocaleString()} gross • -৳{summary.totalReturned.toLocaleString()} ret.
              </span>
            ) : (
              <span className="text-slate-400">{orders.length} orders recorded</span>
            )}
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Paid
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
            ৳{summary.totalPaid.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1 font-medium">
            Disbursed to suppliers
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Supplier Payable Due
          </div>
          <div
            className={`text-2xl font-black mt-1.5 font-mono ${summary.totalDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}
          >
            ৳{summary.totalDue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Outstanding vendor dues</div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Returned to Supplier
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5 font-mono">
            ৳{summary.totalReturned.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1 font-medium">
            Credit / refunds processed
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
            <RotateCcw className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO #, supplier name, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-all shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 ${
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

      {/* Orders Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3.5">PO Number</th>
                <th className="px-4 py-3.5">Supplier</th>
                <th className="px-4 py-3.5">Products / Items</th>
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
                    <p className="text-xs text-slate-500 mt-1">
                      Click "New Restock Purchase" to record inventory stock.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((po) => {
                  const supplierName =
                    po.supplierId?.name ||
                    (typeof po.supplierId === 'string' ? po.supplierId : 'Supplier');
                  const supplierPhone = po.supplierId?.phone || '';
                  const totalBoughtUnits = (po.lineItems || []).reduce(
                    (acc, it) => acc + Number(it.qty || 1),
                    0
                  );
                  const returnedUnits = Number(po.returnedCount || 0);
                  const activeUnits = Math.max(0, totalBoughtUnits - returnedUnits);
                  const returnedAmount = Number(po.returnedAmount || 0);
                  const netTotalCost = Math.max(0, Number(po.netTotal || 0) - returnedAmount);

                  return (
                    <tr
                      key={po._id || po.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {po.poNumber}
                        </span>
                        {po.notes && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {po.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {supplierName}
                        </div>
                        {supplierPhone && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {supplierPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {po.lineItems?.length || 0} product(s) ({activeUnits} in-stock{returnedUnits > 0 ? `, ${returnedUnits} ret.` : ''})
                        </div>
                        {po.lineItems?.length > 0 && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[220px]">
                            {po.lineItems.map((it) => `${it.description || it.name} (${it.qty} bought)`).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          ৳{netTotalCost.toLocaleString()}
                        </div>
                        {returnedAmount > 0 && (
                          <div className="text-[10px] text-amber-600 font-semibold">
                            was ৳{Number(po.netTotal || 0).toLocaleString()} (-৳{returnedAmount.toLocaleString()} ret.)
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{Number(po.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold">
                        <span
                          className={
                            Number(po.dueAmount || 0) > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-400'
                          }
                        >
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
                            onClick={() => setPrintPO(po)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-colors"
                            title="Print Purchase Bill / Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {Number(po.dueAmount || 0) > 0 && (
                            <button
                              onClick={() => setPayDuePO(po)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition-colors"
                              title="Pay Supplier Due"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setViewPO(po)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            title="View PO Details"
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

      {/* ── 1. WIDE, MODERN RESTOCK PURCHASE MODAL ── */}
      {showCreateModal && (
        <CreatePurchaseModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newPo) => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['purchase-orders']);
            queryClient.invalidateQueries(['products']);
            queryClient.invalidateQueries(['products-list']);
            queryClient.invalidateQueries(['product-search-pos']);
            queryClient.invalidateQueries(['stock-overview']);
            queryClient.invalidateQueries(['imei-search']);
            queryClient.invalidateQueries(['suppliers-list']);
            if (newPo) {
              setPrintPO(newPo);
            }
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

      {/* ── PAY SUPPLIER DUE MODAL ── */}
      {payDuePO && (
        <PayPODueModal
          po={payDuePO}
          onClose={() => setPayDuePO(null)}
          onSuccess={() => {
            setPayDuePO(null);
            queryClient.invalidateQueries(['purchase-orders']);
            queryClient.invalidateQueries(['suppliers']);
            queryClient.invalidateQueries(['suppliers-list']);
            queryClient.invalidateQueries(['expenses']);
          }}
        />
      )}

      {/* ── 3. VIEW PURCHASE DETAILS MODAL ── */}
      {viewPO && (
        <ViewPurchaseModal
          po={viewPO}
          onClose={() => setViewPO(null)}
          onPrint={() => {
            const current = viewPO;
            setViewPO(null);
            setPrintPO(current);
          }}
          onReturn={() => {
            const current = viewPO;
            setViewPO(null);
            setReturnPO(current);
          }}
        />
      )}

      {/* ── 4. PRINT PURCHASE ORDER INVOICE MODAL ── */}
      {printPO && (
        <PurchaseInvoiceModal
          po={printPO}
          onClose={() => setPrintPO(null)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// MODAL 1: HIGH-END, WIDE RESTOCK PURCHASE MODAL (USER-FRIENDLY ERP UX)
// ----------------------------------------------------------------------
function CreatePurchaseModal({ suppliers, products, onClose, onSuccess }) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?._id || suppliers[0]?.id || '');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCompany, setNewSupplierCompany] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [isQuickSupplier, setIsQuickSupplier] = useState(suppliers.length === 0);

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentBreakdown, setPaymentBreakdown] = useState({
    cash: '',
    bkash: '',
    nagad: '',
    rocket: '',
    bank: '',
  });
  const [useSplitPayment, setUseSplitPayment] = useState(false);
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState('FLAT'); // 'FLAT' or 'PERCENT'
  const [tax, setTax] = useState('');
  const [taxType, setTaxType] = useState('FLAT'); // 'FLAT' or 'PERCENT'
  const [notes, setNotes] = useState('');

  const { data: activeAccountsRes } = useQuery({
    queryKey: ['pos-active-accounts'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/accounting/accounts');
        return data?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const availablePaymentMethods = useMemo(() => {
    const activeList = (activeAccountsRes || []).filter((a) => a.isActive !== false);
    if (!activeList.length) {
      return [
        { value: 'CASH', label: 'Cash Payment' },
        { value: 'BANK', label: 'Bank Transfer / Card' },
        { value: 'BKASH', label: 'bKash Merchant' },
        { value: 'NAGAD', label: 'Nagad' },
        { value: 'ROCKET', label: 'Rocket' },
        { value: 'CREDIT', label: 'Supplier Credit (Pay Later)' },
      ];
    }

    const methods = [];
    const names = activeList.map((a) => (a.name || '').toLowerCase());
    const codes = activeList.map((a) => String(a.code || ''));

    if (names.some((n) => n.includes('cash')) || codes.includes('1000')) {
      methods.push({ value: 'CASH', label: 'Cash Payment' });
    }
    if (names.some((n) => n.includes('bank') || n.includes('card')) || codes.includes('1010')) {
      methods.push({ value: 'BANK', label: 'Bank Transfer / Card' });
    }
    if (names.some((n) => n.includes('bkash')) || codes.includes('1011')) {
      methods.push({ value: 'BKASH', label: 'bKash Merchant' });
    }
    if (names.some((n) => n.includes('nagad')) || codes.includes('1012')) {
      methods.push({ value: 'NAGAD', label: 'Nagad' });
    }
    if (names.some((n) => n.includes('rocket')) || codes.includes('1013')) {
      methods.push({ value: 'ROCKET', label: 'Rocket' });
    }

    // Only allow custom liquid bank/wallet sub-accounts (exclude receivables, inventory, liabilities, equity, fixed assets)
    activeList.forEach((a) => {
      const code = String(a.code || '');
      const n = (a.name || '').toLowerCase();
      const isLiquidSubAccount =
        ![
          '1000',
          '1010',
          '1011',
          '1012',
          '1013',
          '1020',
          '1030',
          '2000',
          '3000',
          '4000',
          '5000',
          '6000',
        ].includes(code) &&
        !code.startsWith('AST-') &&
        ![
          'FURNITURE',
          'EQUIPMENT',
          'ELECTRONICS',
          'FIXED_ASSET',
          'NON_CURRENT_ASSET',
          'ACCOUNTS_RECEIVABLE',
          'INVENTORY',
        ].includes(a.subType) &&
        (n.includes('bank') ||
          n.includes('cash') ||
          n.includes('wallet') ||
          n.includes('mfs') ||
          n.includes('card'));

      if (isLiquidSubAccount) {
        methods.push({ value: a.name.toUpperCase(), label: `${a.name} (${a.code})` });
      }
    });

    methods.push({ value: 'CREDIT', label: 'Supplier Credit (Pay Later)' });
    return methods;
  }, [activeAccountsRes]);

  const liquidAccounts = useMemo(() => {
    const activeList = (activeAccountsRes || []).filter((a) => a.isActive !== false);
    if (!activeList.length) {
      return [
        { key: 'cash', code: '1000', name: 'Cash', balance: 0, icon: '💵' },
        { key: 'bkash', code: '1011', name: 'bKash', balance: 0, icon: '📱' },
        { key: 'nagad', code: '1012', name: 'Nagad', balance: 0, icon: '📱' },
        { key: 'rocket', code: '1013', name: 'Rocket', balance: 0, icon: '🚀' },
        { key: 'bank', code: '1010', name: 'Bank Account', balance: 0, icon: '🏦' },
      ];
    }
    const accounts = [];
    activeList.forEach((a) => {
      const code = String(a.code || '');
      const n = (a.name || '').toLowerCase();
      const bal = Number(a.balance || 0);

      if (code === '1000' || n.includes('cash')) {
        accounts.push({ key: 'cash', code: a.code || '1000', name: a.name || 'Cash', balance: bal, icon: '💵' });
      } else if (code === '1011' || n.includes('bkash')) {
        accounts.push({ key: 'bkash', code: a.code || '1011', name: a.name || 'bKash', balance: bal, icon: '📱' });
      } else if (code === '1012' || n.includes('nagad')) {
        accounts.push({ key: 'nagad', code: a.code || '1012', name: a.name || 'Nagad', balance: bal, icon: '📱' });
      } else if (code === '1013' || n.includes('rocket')) {
        accounts.push({ key: 'rocket', code: a.code || '1013', name: a.name || 'Rocket', balance: bal, icon: '🚀' });
      } else if (code === '1010' || n.includes('bank')) {
        accounts.push({ key: 'bank', code: a.code || '1010', name: a.name || 'Bank Account', balance: bal, icon: '🏦' });
      } else if (a.type === 'ASSET' && (n.includes('wallet') || n.includes('mfs') || n.includes('card'))) {
        const k = (a.code || a.name).toLowerCase().replace(/[^a-z0-9]/g, '_');
        accounts.push({ key: k, code: a.code, name: a.name, balance: bal, icon: '💳' });
      }
    });
    return accounts.length > 0
      ? accounts
      : [{ key: 'cash', code: '1000', name: 'Cash', balance: 0, icon: '💵' }];
  }, [activeAccountsRes]);

  const availableCategories = useMemo(() => {
    const existing = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...CATEGORIES, ...existing]));
  }, [products]);

  const availableBrands = useMemo(() => {
    const existing = products.map((p) => p.brand).filter(Boolean);
    const defaults = ['Apple', 'Samsung', 'Xiaomi', 'Realme', 'OnePlus', 'Anker', 'Havit', 'Baseus', 'Joyroom', 'Remax', 'Generic'];
    return Array.from(new Set([...defaults, ...existing]));
  }, [products]);

  const [lineItems, setLineItems] = useState([
    {
      productId: '',
      productName: '',
      brand: '',
      category: 'Smartphones',
      qty: 1,
      unitCost: '',
      sellingPrice: '',
      wholesalePrice: '',
      showImei: false,
      imeiText: '',
    },
  ]);

  const mutation = useMutation({
    mutationFn: async (payload) => api.post('/purchase-orders', payload),
    onSuccess: () => {
      toast.success('Stock purchased and synchronized into inventory!');
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
        brand: '',
        category: 'Smartphones',
        qty: 1,
        unitCost: '',
        sellingPrice: '',
        wholesalePrice: '',
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
          brand: selected.brand || '',
          category: selected.category || 'Smartphones',
          unitCost: Number(selected.costPrice || selected.cost_price || 0) || '',
          discount: '',
          sellingPrice: Number(selected.sellingPrice || selected.selling_price || 0) || '',
          wholesalePrice: Number(selected.wholesalePrice || selected.wholesale_price || 0) || '',
        };
      } else {
        next[index] = {
          ...next[index],
          productId: 'new',
          productName: '',
          brand: '',
          unitCost: '',
          discount: '',
          sellingPrice: '',
          wholesalePrice: '',
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
    return lineItems.reduce((sum, it) => {
      const gross = Number(it.qty || 1) * Number(it.unitCost || 0);
      const disc = Number(it.discount || 0);
      return sum + Math.max(0, gross - disc);
    }, 0);
  }, [lineItems]);

  const calculatedDiscount = useMemo(() => {
    const val = Number(discount || 0);
    if (discountType === 'PERCENT') {
      return (subTotal * val) / 100;
    }
    return val;
  }, [subTotal, discount, discountType]);

  const calculatedTax = useMemo(() => {
    const val = Number(tax || 0);
    if (taxType === 'PERCENT') {
      return ((subTotal - calculatedDiscount) * val) / 100;
    }
    return val;
  }, [subTotal, calculatedDiscount, tax, taxType]);

  const netTotal = Math.max(0, subTotal - calculatedDiscount + calculatedTax);
  const splitTotal = useSplitPayment
    ? Number(paymentBreakdown.cash || 0) +
      Number(paymentBreakdown.bkash || 0) +
      Number(paymentBreakdown.nagad || 0) +
      Number(paymentBreakdown.rocket || 0) +
      Number(paymentBreakdown.bank || 0)
    : 0;
  const totalPaid = useSplitPayment ? splitTotal : Number(paidAmount || 0);
  const dueAmount = Math.max(0, netTotal - totalPaid);

  const handlePayInFull = () => {
    if (useSplitPayment) {
      setPaymentBreakdown({ cash: String(netTotal), bkash: '', nagad: '', rocket: '', bank: '' });
    } else {
      setPaidAmount(netTotal);
    }
  };

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
          company: newSupplierCompany || newSupplierName,
          phone: newSupplierPhone || 'N/A',
        });
        finalSupplierId = supRes.data?.data?._id || supRes.data?.data?.id;
      } catch (err) {
        if (err.response?.status === 409 || err.response?.data?.message?.includes('already exists')) {
          try {
            const existingListRes = await api.get('/suppliers', {
              params: { search: newSupplierPhone || newSupplierName, limit: 10 },
            });
            const list =
              existingListRes.data?.data?.suppliers ||
              existingListRes.data?.data ||
              [];
            const matched = list.find(
              (s) =>
                (newSupplierPhone && s.phone === newSupplierPhone) ||
                (s.name && s.name.toLowerCase() === newSupplierName.toLowerCase())
            ) || list[0];
            if (matched) {
              finalSupplierId = matched._id || matched.id;
            } else {
              toast.error('Supplier with this phone already exists. Please select it from the dropdown.');
              return;
            }
          } catch {
            toast.error('Supplier with this phone already exists.');
            return;
          }
        } else {
          toast.error(err.response?.data?.message || 'Failed to create new supplier');
          return;
        }
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
        brand: it.brand || undefined,
        category: it.category || 'General',
        qty: Number(it.qty || 1),
        unitCost: Number(it.unitCost || 0),
        discount: Number(it.discount || 0),
        sellingPrice: Number(it.sellingPrice || Number(it.unitCost) * 1.25),
        wholesalePrice:
          it.wholesalePrice !== undefined && it.wholesalePrice !== ''
            ? Number(it.wholesalePrice)
            : undefined,
        imeis,
      };
    });

    mutation.mutate({
      supplierId: finalSupplierId,
      lineItems: processedLines,
      discount: Number(calculatedDiscount.toFixed(2)),
      tax: Number(calculatedTax.toFixed(2)),
      paymentMethod: useSplitPayment ? 'SPLIT' : paymentMethod,
      paidAmount: totalPaid,
      paymentBreakdown: useSplitPayment
        ? {
            cash: Number(paymentBreakdown.cash || 0),
            bkash: Number(paymentBreakdown.bkash || 0),
            nagad: Number(paymentBreakdown.nagad || 0),
            rocket: Number(paymentBreakdown.rocket || 0),
            bank: Number(paymentBreakdown.bank || 0),
          }
        : undefined,
      notes,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl md:max-w-6xl w-[96vw] max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#0f172a]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 px-5 sm:px-6 pr-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  New Stock Restock & Purchase Order
                </h2>
                <span className="hidden sm:inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 whitespace-nowrap shrink-0">
                  Auto-Inventory Sync
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add stock items from vendor. Store stock and catalog are automatically updated.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Section: Supplier Selection Card */}
          <div className="bg-slate-50/80 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Supplier / Vendor Details *
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickSupplier(!isQuickSupplier)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-semibold self-start sm:self-auto"
              >
                {isQuickSupplier ? '← Select Existing Supplier' : '+ Quick Add New Supplier'}
              </button>
            </div>

            {!isQuickSupplier ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-2">
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
                  >
                    <option value="">-- Select Supplier from List --</option>
                    {suppliers.map((s) => (
                      <option key={s._id || s.id} value={s._id || s.id}>
                        {s.name} {s.phone ? `(${s.phone})` : ''} {s.company ? `— ${s.company}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1e293b] p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
                  {suppliers.find((s) => String(s._id || s.id) === String(supplierId))?.phone
                    ? `Phone: ${suppliers.find((s) => String(s._id || s.id) === String(supplierId))?.phone}`
                    : 'Select a supplier to link order'}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Supplier / Vendor Name *
                  </Label>
                  <Input
                    required
                    placeholder="e.g. Tech Diversity"
                    value={newSupplierName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewSupplierName(val);
                      if (!newSupplierCompany || newSupplierCompany === newSupplierName) {
                        setNewSupplierCompany(val);
                      }
                    }}
                    className="h-9 text-xs rounded-xl mt-1 bg-white dark:bg-[#1e293b]"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Company / Enterprise
                  </Label>
                  <Input
                    placeholder="e.g. Tech Diversity Ltd"
                    value={newSupplierCompany}
                    onChange={(e) => setNewSupplierCompany(e.target.value)}
                    className="h-9 text-xs rounded-xl mt-1 bg-white dark:bg-[#1e293b]"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Supplier Contact Phone
                  </Label>
                  <Input
                    placeholder="e.g. 01711223344"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    className="h-9 text-xs rounded-xl mt-1 bg-white dark:bg-[#1e293b]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Middle Section: Items Data Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Purchased Products & Restock Quantities *
                </span>
                <span className="text-[11px] text-slate-400">({lineItems.length} items)</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                className="h-8 text-xs rounded-xl gap-1.5 border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Row
              </Button>
            </div>

            {/* Structured Table for Products */}
            <div className="space-y-3">
              {lineItems.map((item, index) => {
                const lineGross = Number(item.qty || 1) * Number(item.unitCost || 0);
                const lineTotal = lineGross;
                const effectiveCost = Number(item.unitCost || 0);
                const imeisCount = item.imeiText
                  ? item.imeiText
                      .split(/[\n,]+/)
                      .map((s) => s.trim())
                      .filter(Boolean).length
                  : 0;

                return (
                  <div
                    key={index}
                    className="p-4 bg-slate-50/60 dark:bg-slate-900/30 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-400/50 dark:hover:border-blue-600/50 transition-all space-y-3 shadow-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                      {/* Product Selector / Name (3 cols) */}
                      <div className="sm:col-span-3 space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Product / Item Name *</span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 lowercase font-normal">
                            #{index + 1}
                          </span>
                        </Label>
                        <select
                          value={item.productId || (item.productName ? 'new' : '')}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          className="w-full px-2.5 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-blue-500"
                        >
                          <option value="new">+ Type New Product Name Below</option>
                          <optgroup label="Select from Store Catalog">
                            {products.map((p) => {
                              const qty = p.stockQuantity ?? p.stock ?? 0;
                              return (
                                <option key={p._id || p.id} value={p._id || p.id}>
                                  {p.name} (In stock: {qty})
                                </option>
                              );
                            })}
                          </optgroup>
                        </select>

                        {(!item.productId || item.productId === 'new') && (
                          <Input
                            required
                            placeholder="Type product model/name..."
                            value={item.productName}
                            onChange={(e) => handleLineChange(index, 'productName', e.target.value)}
                            className="h-8 text-xs rounded-xl bg-white dark:bg-[#1e293b] mt-1 border-blue-400"
                          />
                        )}
                      </div>

                      {/* Brand (2 cols) */}
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Brand
                        </Label>
                        <select
                          value={item.isCustomBrand ? 'custom' : item.brand || 'Generic'}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              handleLineChange(index, 'isCustomBrand', true);
                              handleLineChange(index, 'brand', '');
                            } else {
                              handleLineChange(index, 'isCustomBrand', false);
                              handleLineChange(index, 'brand', e.target.value);
                            }
                          }}
                          className="w-full px-2 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                        >
                          {availableBrands.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                          <option value="custom">+ Custom Brand...</option>
                        </select>

                        {item.isCustomBrand && (
                          <Input
                            placeholder="Enter brand..."
                            value={item.brand}
                            onChange={(e) => handleLineChange(index, 'brand', e.target.value)}
                            className="h-8 text-xs rounded-xl bg-white dark:bg-[#1e293b] mt-1 border-blue-400"
                          />
                        )}
                      </div>

                      {/* Category (2 cols) */}
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Category
                        </Label>
                        <select
                          value={item.isCustomCategory ? 'custom' : item.category || 'Smartphones'}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              handleLineChange(index, 'isCustomCategory', true);
                              handleLineChange(index, 'category', '');
                            } else {
                              handleLineChange(index, 'isCustomCategory', false);
                              handleLineChange(index, 'category', e.target.value);
                            }
                          }}
                          className="w-full px-2 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                        >
                          {availableCategories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          <option value="custom">+ Custom...</option>
                        </select>

                        {item.isCustomCategory && (
                          <Input
                            required
                            placeholder="Category..."
                            value={item.category}
                            onChange={(e) => handleLineChange(index, 'category', e.target.value)}
                            className="h-8 text-xs rounded-xl bg-white dark:bg-[#1e293b] mt-1 border-blue-400"
                          />
                        )}
                      </div>

                      {/* Qty (1 col) */}
                      <div className="sm:col-span-1 space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-center block">
                          Qty *
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          required
                          placeholder="1"
                          value={item.qty}
                          onChange={(e) =>
                            handleLineChange(index, 'qty', Math.max(1, Number(e.target.value)))
                          }
                          className="h-9 text-xs font-mono font-bold text-center rounded-xl bg-white dark:bg-[#1e293b]"
                        />
                      </div>

                      {/* Unit Cost (1 col) */}
                      <div className="sm:col-span-1 space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right block">
                          Cost (৳) *
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          required
                          placeholder="0"
                          value={item.unitCost === 0 ? '' : item.unitCost}
                          onChange={(e) =>
                            handleLineChange(
                              index,
                              'unitCost',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="h-9 text-xs font-mono font-bold text-right rounded-xl bg-white dark:bg-[#1e293b]"
                        />
                      </div>

                      {/* Retail Price (1 col) */}
                      <div className="sm:col-span-1 space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right block">
                          Retail (৳)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={item.sellingPrice === 0 ? '' : item.sellingPrice}
                          onChange={(e) =>
                            handleLineChange(
                              index,
                              'sellingPrice',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="h-9 text-xs font-mono font-bold text-right rounded-xl bg-white dark:bg-[#1e293b]"
                        />
                      </div>

                      {/* Wholesale Price (1 col) */}
                      <div className="sm:col-span-1 space-y-1">
                        <Label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-right block">
                          Wholesale (৳)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={item.wholesalePrice === 0 ? '' : item.wholesalePrice}
                          onChange={(e) =>
                            handleLineChange(
                              index,
                              'wholesalePrice',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="h-9 text-xs font-mono font-bold text-right rounded-xl bg-white dark:bg-[#1e293b] border-indigo-200 dark:border-indigo-900/50"
                        />
                      </div>

                      {/* Line Total & Remove Action (1 col) */}
                      <div className="sm:col-span-1 flex items-center justify-end gap-1 pb-0.5">
                        <div className="text-right flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Subtotal
                          </div>
                          <div className="font-mono font-black text-xs text-slate-900 dark:text-slate-100 truncate">
                            ৳{lineTotal.toLocaleString()}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={lineItems.length <= 1}
                          onClick={() => handleRemoveLine(index)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-20 transition-colors shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* IMEI Toggle & Input Strip */}
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleLineChange(index, 'showImei', !item.showImei)}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1.5 font-semibold"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        {item.showImei
                          ? 'Close IMEI / Serial Box'
                          : `+ Add IMEI / Serial Numbers ${imeisCount > 0 ? `(${imeisCount} entered)` : '(Optional)'}`}
                      </button>

                      {Number(item.sellingPrice || 0) > 0 && effectiveCost > 0 && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          Landed Cost: ৳{effectiveCost}/unit • Margin: +৳
                          {(Number(item.sellingPrice) - effectiveCost).toLocaleString()} (
                          {Math.round(
                            ((Number(item.sellingPrice) - effectiveCost) / effectiveCost) * 100
                          )}
                          %)
                        </span>
                      )}
                    </div>

                    {item.showImei && (
                      <div className="bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-1">
                        <Label className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                          Enter or Scan IMEI / Serials ({item.qty} units expected, separated by
                          commas or line breaks):
                        </Label>
                        <textarea
                          rows={2}
                          placeholder="356789012345678, 356789012345679..."
                          value={item.imeiText}
                          onChange={(e) => handleLineChange(index, 'imeiText', e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Section: Payment & Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
            {/* Left: Payment Method & Notes */}
            <div className="md:col-span-6 space-y-4">
              <div className="bg-slate-50/80 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" /> Payment & Billing Info
                </span>

                {/* Split Payment Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUseSplitPayment(!useSplitPayment)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                      useSplitPayment
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {useSplitPayment ? 'Multi-Payment ON' : 'Split Payment'}
                  </button>
                  {useSplitPayment && (
                    <span className="text-[10px] text-blue-500 font-medium">
                      Split across multiple methods
                    </span>
                  )}
                </div>

                {!useSplitPayment ? (
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Payment Method
                    </Label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      {availablePaymentMethods.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {liquidAccounts.map((acc) => (
                      <div key={acc.key} className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-white/60 dark:bg-[#1e293b]/60 border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-sm shrink-0">{acc.icon}</span>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                              {acc.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({acc.code}) • Bal: ৳{acc.balance.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={paymentBreakdown[acc.key] || ''}
                          onChange={(e) =>
                            setPaymentBreakdown((prev) => ({ ...prev, [acc.key]: e.target.value }))
                          }
                          className="h-8 w-28 text-xs font-mono font-bold text-right rounded-lg bg-white dark:bg-[#0f172a] border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    ))}
                    <div className="flex justify-between text-[10px] font-bold pt-1.5 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">Split Total:</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 text-xs">
                        ৳{splitTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Order Reference / Invoice Notes
                  </Label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Vendor Invoice #INV-8891, Restock batch note..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full mt-1 p-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Right: Calculations & Totals */}
            <div className="md:col-span-6">
              <div className="bg-slate-50/90 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs shadow-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                    ৳{subTotal.toLocaleString()}
                  </span>
                </div>

                {/* Discount input with Flat / Percent toggle */}
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Discount:
                    </span>
                    <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-800 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setDiscountType('FLAT')}
                        className={`px-1.5 py-0.5 rounded-md transition-all ${
                          discountType === 'FLAT'
                            ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        ৳
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('PERCENT')}
                        className={`px-1.5 py-0.5 rounded-md transition-all ${
                          discountType === 'PERCENT'
                            ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {discountType === 'PERCENT' && calculatedDiscount > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        (-৳{calculatedDiscount.toLocaleString()})
                      </span>
                    )}
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder={discountType === 'PERCENT' ? '0%' : '0 ৳'}
                      value={discount === 0 ? '' : discount}
                      onChange={(e) =>
                        setDiscount(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="h-7 w-28 text-xs font-mono text-right rounded-lg bg-white dark:bg-[#1e293b]"
                    />
                  </div>
                </div>

                {/* Tax / VAT input with Flat / Percent toggle */}
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Tax / VAT:
                    </span>
                    <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-800 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setTaxType('FLAT')}
                        className={`px-1.5 py-0.5 rounded-md transition-all ${
                          taxType === 'FLAT'
                            ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        ৳
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaxType('PERCENT')}
                        className={`px-1.5 py-0.5 rounded-md transition-all ${
                          taxType === 'PERCENT'
                            ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {taxType === 'PERCENT' && calculatedTax > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        (+৳{calculatedTax.toLocaleString()})
                      </span>
                    )}
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder={taxType === 'PERCENT' ? '0%' : '0 ৳'}
                      value={tax === 0 ? '' : tax}
                      onChange={(e) => setTax(e.target.value === '' ? '' : Number(e.target.value))}
                      className="h-7 w-28 text-xs font-mono text-right rounded-lg bg-white dark:bg-[#1e293b]"
                    />
                  </div>
                </div>

                <div className="flex justify-between font-black text-base text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>GRAND TOTAL:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 text-lg">
                    ৳{netTotal.toLocaleString()}
                  </span>
                </div>

                {/* Paid Now & Pay Full Button */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        Paid Now:
                      </span>
                      <button
                        type="button"
                        onClick={handlePayInFull}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                      >
                        ⚡ Pay in Full
                      </button>
                    </div>
                    {!useSplitPayment && (
                      <Input
                        type="number"
                        min="0"
                        max={netTotal}
                        placeholder="0"
                        value={paidAmount === 0 ? '' : paidAmount}
                        onChange={(e) =>
                          setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="h-7 w-32 text-xs font-mono text-right rounded-lg bg-white dark:bg-[#1e293b] border-emerald-500 font-black text-emerald-600"
                      />
                    )}
                    {useSplitPayment && (
                      <span className="font-mono font-black text-emerald-600 text-sm">
                        ৳{splitTotal.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between font-bold text-xs pt-1">
                    <span
                      className={
                        dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                      }
                    >
                      Supplier Due Balance:
                    </span>
                    <span
                      className={`font-mono font-bold ${dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}
                    >
                      ৳{dueAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Modal Actions */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>
                Total{' '}
                <strong>{lineItems.reduce((acc, it) => acc + Number(it.qty || 1), 0)} units</strong>{' '}
                ready to restock
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 sm:flex-none rounded-xl text-xs px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold px-6 py-2 shadow-md gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {mutation.isPending
                  ? 'Processing Restock...'
                  : `Confirm Purchase (৳${netTotal.toLocaleString()})`}
              </Button>
            </div>
          </div>
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

  const discountRatio = useMemo(() => {
    const sub = Number(po.subTotal || po.sub_total || 0);
    const net = Number(po.netTotal || po.net_total || 0);
    if (sub > 0 && net > 0) return net / sub;
    return 1;
  }, [po]);

  const [settlementType, setSettlementType] = useState(
    Number(po.dueAmount || po.due_amount || 0) > 0 ? 'ADJUST_DUE' : 'WALLET_REFUND'
  );
  const [refundMethod, setRefundMethod] = useState('CASH');

  const { data: activeAccountsRes } = useQuery({
    queryKey: ['pos-active-accounts'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/accounting/accounts');
        return data?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const availableRefundWallets = useMemo(() => {
    const activeList = (activeAccountsRes || []).filter((a) => a.isActive !== false);
    if (!activeList.length) {
      return [
        { value: 'CASH', label: 'Cash Account (1000)' },
        { value: 'BANK', label: 'Bank Account (1010)' },
        { value: 'BKASH', label: 'bKash Account (1011)' },
        { value: 'NAGAD', label: 'Nagad Account (1012)' },
        { value: 'ROCKET', label: 'Rocket Account (1013)' },
      ];
    }
    const methods = [];
    const names = activeList.map((a) => (a.name || '').toLowerCase());
    const codes = activeList.map((a) => String(a.code || ''));

    if (names.some((n) => n.includes('cash')) || codes.includes('1000')) {
      methods.push({ value: 'CASH', label: 'Cash on Hand (1000)' });
    }
    if (names.some((n) => n.includes('bank') || n.includes('card')) || codes.includes('1010')) {
      methods.push({ value: 'BANK', label: 'Bank Account (1010)' });
    }
    if (names.some((n) => n.includes('bkash')) || codes.includes('1011')) {
      methods.push({ value: 'BKASH', label: 'bKash Wallet (1011)' });
    }
    if (names.some((n) => n.includes('nagad')) || codes.includes('1012')) {
      methods.push({ value: 'NAGAD', label: 'Nagad Wallet (1012)' });
    }
    if (names.some((n) => n.includes('rocket')) || codes.includes('1013')) {
      methods.push({ value: 'ROCKET', label: 'Rocket Wallet (1013)' });
    }
    return methods.length > 0 ? methods : [{ value: 'CASH', label: 'Cash on Hand' }];
  }, [activeAccountsRes]);

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
      const rawCost = Number(item.unitCost || 0);
      const effectiveUnitCost = Math.round(rawCost * discountRatio);

      setReturnSelection({
        ...returnSelection,
        [key]: {
          productId: item.productId?._id || item.productId?.id || item.productId,
          description: item.description || item.name,
          unitCost: effectiveUnitCost,
          originalUnitCost: rawCost,
          maxQty: Number(item.qty || 1),
          qty: 1,
          refundAmount: effectiveUnitCost,
          reason: generalReason,
          notes: '',
        },
      });
    }
  };

  const updateItem = (key, field, val) => {
    setReturnSelection((prev) => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: val,
        },
      };
    });
  };

  const updateItemQty = (key, qty, effectiveCost) => {
    setReturnSelection((prev) => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: {
          ...prev[key],
          qty,
          refundAmount: Math.round(qty * (effectiveCost || 0)),
        },
      };
    });
  };

  const totalRefund = useMemo(() => {
    return Object.values(returnSelection).reduce(
      (sum, it) =>
        sum + (Number(it.refundAmount) || Number(it.unitCost || 0) * Number(it.qty || 1)),
      0
    );
  }, [returnSelection]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const items = Object.values(returnSelection).map((it) => ({
      ...it,
      qty: Math.max(1, Number(it.qty || 1)),
    }));
    if (items.length === 0) {
      toast.error('Please select at least 1 item to return');
      return;
    }
    mutation.mutate({
      items,
      reason: generalReason,
      settlementType,
      refundMethod,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl w-[94vw] max-h-[88vh] overflow-y-auto rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#0f172a]">
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3 pr-10 sm:pr-8">
          <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
            <RotateCcw className="w-5 h-5 shrink-0" /> Return Products to Supplier
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Return items from PO{' '}
            <strong className="font-mono text-slate-800 dark:text-slate-200">{po.poNumber}</strong>{' '}
            back to vendor. Store stock will be deducted and supplier balance adjusted.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Reason & Settlement Options Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                General Return Reason
              </Label>
              <Input
                value={generalReason}
                onChange={(e) => setGeneralReason(e.target.value)}
                placeholder="e.g. Factory fault, damaged parcel, wrong batch"
                className="h-9 text-xs mt-1 rounded-xl bg-white dark:bg-[#1e293b] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Settlement & Refund Flow *
              </Label>
              <select
                value={settlementType}
                onChange={(e) => setSettlementType(e.target.value)}
                className="w-full h-9 px-3 mt-1 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
              >
                <option value="WALLET_REFUND">💵 Receive Cash / Bank / MFS Refund to Wallet</option>
                <option value="ADJUST_DUE">📑 Deduct from Supplier Due Balance</option>
                <option value="EXCHANGE">🔄 Item Replacement / Exchange (No Cash Refund)</option>
              </select>
            </div>

            {settlementType === 'WALLET_REFUND' && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Deposit Refund Money Into:
                </span>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#1e293b] border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none shadow-xs"
                >
                  {availableRefundWallets.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                Select Line Items to Return
              </Label>
              {discountRatio < 1 && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  ⚡ Discount Proportionately Applied to Unit Cost
                </span>
              )}
            </div>

            {lineItems.map((item, idx) => {
              const key = `item-${idx}`;
              const isSelected = !!returnSelection[key];
              const purchasedQty = Number(item.qty || 1);
              const alreadyReturned = Number(item.returnedQty || 0);
              const maxQty = Math.max(0, purchasedQty - alreadyReturned);
              const rawCost = Number(item.unitCost || 0);
              const effectiveCost = Math.round(rawCost * discountRatio);
              const selectedQty = Number(returnSelection[key]?.qty || 0);
              const refundTotal = Number(returnSelection[key]?.refundAmount || (selectedQty * effectiveCost));

              return (
                <div
                  key={key}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                    isSelected
                      ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-xs'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item, idx)}
                        className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                      />
                      <div className="truncate">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {item.description || item.name}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                          Purchased: {purchasedQty} pcs @ ৳{rawCost.toLocaleString()}
                          {discountRatio < 1 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                              (Net Cost: ৳{effectiveCost.toLocaleString()})
                            </span>
                          )}
                        </div>
                        {!isSelected && maxQty > 0 && (
                          <div className="text-[10px] text-rose-500 dark:text-rose-400 font-medium mt-0.5">
                            Click to select return quantity (up to {maxQty} pcs)
                          </div>
                        )}
                        {alreadyReturned > 0 && (
                          <div className="text-[10px] text-amber-500 dark:text-amber-400 font-medium mt-0.5">
                            Already returned: {alreadyReturned} pcs
                          </div>
                        )}
                      </div>
                    </label>

                    <div className="text-right shrink-0">
                      {isSelected ? (
                        <div className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                          Return: ৳{refundTotal.toLocaleString()}
                        </div>
                      ) : (
                        <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                          Total: ৳
                          {Number(item.totalCost || item.qty * item.unitCost || 0).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-rose-200 dark:border-rose-900/40">
                      <div>
                        <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                          Return Qty (pcs)
                        </Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Input
                            type="number"
                            min="1"
                            max={maxQty}
                            value={
                              returnSelection[key]?.qty === undefined
                                ? ''
                                : returnSelection[key]?.qty
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                updateItem(key, 'qty', '');
                                return;
                              }
                              const num = Number(val);
                              const q = Math.min(maxQty, Math.max(1, Number.isNaN(num) ? 1 : num));
                              updateItemQty(key, q, effectiveCost);
                            }}
                            onBlur={() => {
                              const current = Number(returnSelection[key]?.qty);
                              if (!current || Number.isNaN(current) || current < 1) {
                                updateItemQty(key, 1, effectiveCost);
                              }
                            }}
                            className="h-8 text-xs font-mono font-bold rounded-xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700"
                          />
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
                            / {maxQty}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                          Refund Amount (৳)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={returnSelection[key]?.refundAmount}
                          onChange={(e) => updateItem(key, 'refundAmount', Number(e.target.value))}
                          className="h-8 text-xs font-mono rounded-xl mt-1 text-right font-black text-rose-600 dark:text-rose-400 bg-white dark:bg-[#1e293b] border-slate-300 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                          Item Notes
                        </Label>
                        <Input
                          placeholder="Specific defect details..."
                          value={returnSelection[key]?.notes}
                          onChange={(e) => updateItem(key, 'notes', e.target.value)}
                          className="h-8 text-xs rounded-xl mt-1 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Total Refund Value:{' '}
              <span className="text-rose-600 dark:text-rose-400 font-mono text-base font-extrabold ml-1">
                ৳{totalRefund.toLocaleString()}
              </span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="rounded-xl flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || Object.keys(returnSelection).length === 0}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold gap-1.5 flex-1 sm:flex-none"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {mutation.isPending ? 'Processing...' : 'Confirm Return to Supplier'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// MODAL 3: VIEW PURCHASE ORDER & GOODS RECEIPT SLIP
// ----------------------------------------------------------------------
function ViewPurchaseModal({ po, onClose, onPrint, onReturn }) {
  const supplierName =
    po.supplierId?.name || (typeof po.supplierId === 'string' ? po.supplierId : 'Supplier');
  const supplierPhone = po.supplierId?.phone || '';
  const supplierAddress = po.supplierId?.address || '';
  const lineItems = po.lineItems || [];
  const returnLogs = po.returnLogs || [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl w-[94vw] max-h-[88vh] overflow-y-auto rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#0f172a]">
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3 pr-10 sm:pr-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <DialogTitle className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {po.poNumber}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Purchased on {new Date(po.createdAt).toLocaleString('en-BD')}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Print Invoice
              </button>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase border shrink-0 ${
                  STATUS_COLORS[po.status] || STATUS_COLORS.DRAFT
                }`}
              >
                {po.status?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Supplier Info */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {supplierName}
            </div>
            {supplierPhone && (
              <div className="text-slate-500 font-mono mt-0.5">Phone: {supplierPhone}</div>
            )}
            {supplierAddress && <div className="text-slate-400 mt-0.5">{supplierAddress}</div>}
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="px-3.5 py-2.5 text-left">Product</th>
                  <th className="px-3.5 py-2.5 text-center">Qty</th>
                  <th className="px-3.5 py-2.5 text-right">Cost (৳)</th>
                  <th className="px-3.5 py-2.5 text-right">Retail (৳)</th>
                  <th className="px-3.5 py-2.5 text-right text-indigo-600 dark:text-indigo-400">Wholesale (৳)</th>
                  <th className="px-3.5 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.description || item.name}
                      </div>
                      {item.imeis?.length > 0 && (
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                          IMEIs: {item.imeis.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-bold">{item.qty}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono">
                      ৳{Number(item.unitCost || 0).toLocaleString()}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {Number(item.sellingPrice || 0) > 0 ? `৳${Number(item.sellingPrice).toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      {Number(item.wholesalePrice || 0) > 0 ? `৳${Number(item.wholesalePrice).toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      ৳{Number(item.totalCost || item.qty * item.unitCost || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financials & Notes */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div>
                Payment Method: <strong>{po.paymentMethod}</strong>
              </div>
              <div>
                Paid:{' '}
                <strong className="text-emerald-600">
                  ৳{Number(po.paidAmount || 0).toLocaleString()}
                </strong>
              </div>
              {po.paymentBreakdown &&
                (() => {
                  const pb =
                    typeof po.paymentBreakdown === 'string'
                      ? JSON.parse(po.paymentBreakdown)
                      : po.paymentBreakdown;
                  const parts = Object.entries(pb).filter(([, v]) => v > 0);
                  return parts.length > 0 ? (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {parts.map(([k, v]) => (
                        <span
                          key={k}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          {k}: ৳{Number(v).toLocaleString()}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}
              <div>
                Due:{' '}
                <strong
                  className={Number(po.dueAmount || 0) > 0 ? 'text-rose-600' : 'text-slate-500'}
                >
                  ৳{Number(po.dueAmount || 0).toLocaleString()}
                </strong>
              </div>
              {po.notes && (
                <div className="text-[11px] text-slate-400 pt-1 border-t">Notes: {po.notes}</div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 text-right">
              <div>Subtotal: ৳{Number(po.subTotal || 0).toLocaleString()}</div>
              {po.discount > 0 && (
                <div className="text-rose-600">
                  Discount: -৳{Number(po.discount).toLocaleString()}
                </div>
              )}
              {po.tax > 0 && <div>Tax: +৳{Number(po.tax).toLocaleString()}</div>}
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 pt-1 border-t">
                Net Total: ৳{Number(po.netTotal || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Return History */}
          {returnLogs.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/40 text-xs space-y-1.5">
              <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Supplier Return Logs ({returnLogs.length})
              </div>
              <div className="divide-y divide-amber-200/60 dark:divide-amber-900/40">
                {returnLogs.map((r, i) => (
                  <div key={i} className="py-1 flex justify-between text-[11px]">
                    <span>
                      {r.description} ({r.qty} pcs) — {r.reason}
                    </span>
                    <span className="font-bold text-rose-600 font-mono">
                      -৳{Number(r.refundAmount || 0).toLocaleString()}
                    </span>
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

// ----------------------------------------------------------------------
// MODAL 4: PAY SUPPLIER DUE BALANCE MODAL
// ----------------------------------------------------------------------
function PayPODueModal({ po, onClose, onSuccess }) {
  const due = Number(po.dueAmount || 0);
  const [amount, setAmount] = useState(due);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  const supplierName = typeof po.supplierId === 'object' ? po.supplierId?.name : 'Supplier';

  const mutation = useMutation({
    mutationFn: async (payload) => api.post(`/purchase-orders/${po._id || po.id}/pay-due`, payload),
    onSuccess: () => {
      toast.success(
        `Supplier payment of ৳${Number(amount).toLocaleString()} recorded successfully!`
      );
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Number(amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    mutation.mutate({
      amount: Number(amount),
      paymentMethod,
      notes,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#0f172a] overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Pay Supplier Due Balance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {po.poNumber} — {supplierName}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Total Order Cost:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                ৳{Number(po.netTotal || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Already Paid:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ৳{Number(po.paidAmount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs pt-1.5 border-t border-slate-200 dark:border-slate-700/80">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Current Due Payable:
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                ৳{due.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Payment Amount (৳) *
              </Label>
              <button
                type="button"
                onClick={() => setAmount(due)}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Pay Full Due (৳{due.toLocaleString()})
              </button>
            </div>
            <Input
              type="number"
              min="1"
              max={due}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 text-sm font-mono font-bold rounded-xl bg-white dark:bg-[#1e293b]"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Payment Method *
            </Label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              <option value="CASH">Cash Payment</option>
              <option value="BANK">Bank Transfer / Card</option>
              <option value="BKASH">bKash Merchant</option>
              <option value="NAGAD">Nagad</option>
              <option value="ROCKET">Rocket</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Payment Notes (Optional)
            </Label>
            <Input
              placeholder="e.g. Cleared via Bank Transfer Ref #1234"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs rounded-xl bg-white dark:bg-[#1e293b]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {mutation.isPending ? 'Processing...' : 'Confirm Due Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
