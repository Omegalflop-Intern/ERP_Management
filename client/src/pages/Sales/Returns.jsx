import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Printer,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  Smartphone,
  User,
  X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ReturnCreditNote from '../../components/sales/ReturnCreditNote';
import { NumberInput } from '../../components/ui/NumberInput';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { executeClientPrint } from '../../utils/invoiceGenerator';
export default function Returns() {
  const navigate = useNavigate();
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnAction, setReturnAction] = useState('REFUND'); // 'REFUND' or 'REPLACEMENT'
  const [replacementItem, setReplacementItem] = useState({
    productId: '',
    name: '',
    unitPrice: 0,
    imeiOrSerial: '',
    quantity: 1,
  });
  const [completedReturnModal, setCompletedReturnModal] = useState(null);
  const creditNoteRef = useRef(null);
  const { styled } = useTheme();
  const queryClient = useQueryClient();

  // Fetch store products for replacement option
  const { data: storeProducts = [] } = useQuery({
    queryKey: ['products-for-replacement'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 100 } });
      return res.data?.data?.products || res.data?.data || [];
    },
  });

  // Fetch recent sales for 1-click return selection (strictly returnable sales)
  const { data: recentSalesRes, isLoading: loadingRecent } = useQuery({
    queryKey: ['recent-sales-returns', invoiceSearch],
    queryFn: async () => {
      const params = { limit: 10, returnable: true };
      if (invoiceSearch.trim()) params.customer = invoiceSearch.trim();
      const res = await api.get('/sales', { params });
      return res.data?.data || [];
    },
  });

  const recentSales = (recentSalesRes || []).filter(
    (sale) =>
      sale.status !== 'RETURNED' &&
      sale.status !== 'CANCELLED' &&
      Number(sale.returnedAmount || 0) < Number(sale.netTotal || 0)
  );

  const searchMutation = useMutation({
    mutationFn: async (query) => {
      const res = await api.get(`/sales/invoice/${encodeURIComponent(query)}`);
      return res.data?.data;
    },
    onSuccess: (data) => {
      onSelectSale(data);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'No matching sale found'),
  });

  const returnMutation = useMutation({
    mutationFn: async ({ saleId, items, returnAction, replacementItem }) =>
      api.post(`/sales/${saleId}/return`, { items, returnAction, replacementItem }),
    onSuccess: (res) => {
      toast.success(
        res.data.message ||
          (returnAction === 'REPLACEMENT'
            ? 'Product replaced successfully'
            : 'Return processed successfully')
      );
      const updatedSale = res.data?.data?.sale || selectedSale;
      const returnInvoiceNumber = res.data?.data?.returnInvoiceNumber;

      // Filter recent return logs belonging to this return
      const currentLogs = (updatedSale?.returnLogs || []).filter(
        (l) => l.returnInvoiceNumber === returnInvoiceNumber || true
      );

      setCompletedReturnModal({
        sale: updatedSale,
        returnInvoiceNumber,
        logs: currentLogs,
        returnAction,
        replacementItem,
      });

      setSelectedSale(null);
      setReturnItems([]);
      setReturnAction('REFUND');
      setReplacementItem({ productId: '', name: '', unitPrice: 0, imeiOrSerial: '', quantity: 1 });
      setInvoiceSearch('');
      queryClient.invalidateQueries(['sales']);
      queryClient.invalidateQueries(['recent-sales-returns']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['stock']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Return failed'),
  });

  const onSelectSale = (sale) => {
    setSelectedSale(sale);
    setReturnAction('REFUND');
    setReplacementItem({ productId: '', name: '', unitPrice: 0, imeiOrSerial: '', quantity: 1 });
    setReturnItems(
      (sale.lineItems || []).map((item, idx) => {
        const remaining = typeof item.remainingQty === 'number' ? item.remainingQty : Math.max(0, item.qty - (item.returnedQty || 0));
        const isAlreadyReturned = item.isFullyReturned || remaining <= 0;
        return {
          lineItemId: item._id || item.id || idx,
          productId: item.productId?._id || item.productId,
          imeiOrSerial: item.imeiOrSerial || '',
          quantity: remaining > 0 ? 1 : 0,
          maxQty: remaining,
          isAlreadyReturned,
          reason: 'defective',
          notes: '',
          selected: false,
        };
      })
    );
  };

  const toggleItem = (index) => {
    const updated = [...returnItems];
    if (updated[index]?.isAlreadyReturned || (updated[index]?.maxQty ?? 0) <= 0) return;
    updated[index].selected = !updated[index].selected;
    setReturnItems(updated);
  };

  const updateReturnQty = (index, qty) => {
    const updated = [...returnItems];
    const maxQty = updated[index]?.maxQty ?? updated[index]?.quantity ?? 0;
    if (maxQty <= 0) return;
    updated[index].quantity = Math.max(1, Math.min(qty, maxQty));
    setReturnItems(updated);
  };

  const updateReason = (index, reason) => {
    const updated = [...returnItems];
    updated[index].reason = reason;
    setReturnItems(updated);
  };

  const handleReturn = () => {
    const items = returnItems
      .filter((i) => i.selected && !i.isAlreadyReturned && i.quantity > 0)
      .map((i) => ({
        productId: i.productId,
        imeiOrSerial: i.imeiOrSerial,
        quantity: i.quantity,
        reason: i.reason,
        notes: i.notes,
      }));
    if (items.length === 0) return toast.error('Select at least one available item to return');
    if (returnAction === 'REPLACEMENT' && !replacementItem.productId) {
      return toast.error('Please select a replacement product from the catalog');
    }
    returnMutation.mutate({
      saleId: selectedSale._id || selectedSale.id,
      items,
      returnAction,
      replacementItem: returnAction === 'REPLACEMENT' ? replacementItem : undefined,
    });
  };

  const selectedCount = returnItems.filter((i) => i.selected).length;

  const cardCls = styled
    ? 'neu-card p-4 space-y-4'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-4';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/sales')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[#2563EB] dark:text-blue-400" /> Sales Return
            Processing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Search sale by invoice number, IMEI / Serial, customer name, or phone number
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className={cardCls}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && invoiceSearch.trim()) {
                  searchMutation.mutate(invoiceSearch.trim());
                }
              }}
              className={`w-full pl-10 pr-4 py-2.5 text-sm ${
                styled
                  ? 'neu-input'
                  : 'bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2563EB] font-mono'
              }`}
            />
          </div>
          <button
            onClick={() => {
              if (invoiceSearch.trim()) searchMutation.mutate(invoiceSearch.trim());
            }}
            disabled={!invoiceSearch.trim() || searchMutation.isPending}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            {searchMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Find Sale
          </button>
        </div>

        {/* Live Search Matches / Recent Sales List */}
        {!selectedSale && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>
                {invoiceSearch.trim()
                  ? `Search Matches for "${invoiceSearch}"`
                  : 'Recent Completed Sales (Click to select for Return)'}
              </span>
              {loadingRecent && <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />}
            </div>

            {recentSales.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                No recent sales found matching search query
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {recentSales.map((sale) => {
                  const paid =
                    (sale.paymentBreakdown?.cash || 0) +
                    (sale.paymentBreakdown?.bkash || 0) +
                    (sale.paymentBreakdown?.rocket || 0) +
                    (sale.paymentBreakdown?.nagad || 0) +
                    (sale.paymentBreakdown?.bank || 0);
                  const isWholesale =
                    sale.saleType === 'WHOLESALE' || sale.customerId?.customerType === 'B2B';

                  return (
                    <button
                      key={sale._id}
                      onClick={() => onSelectSale(sale)}
                      className="text-left p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-red-500 dark:hover:border-red-500 bg-gray-50/50 dark:bg-gray-900/40 hover:bg-red-50/40 dark:hover:bg-red-900/10 transition-all flex flex-col justify-between space-y-1.5"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono font-bold text-xs text-red-600 dark:text-red-400">
                          {sale.invoiceNumber}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isWholesale
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}
                        >
                          {isWholesale ? 'Wholesale B2B' : 'Retail B2C'}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-between">
                        <span className="truncate max-w-[180px]">
                          {sale.customerName || 'Walk-in Customer'}
                        </span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          ৳{sale.netTotal?.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-[10px] text-gray-400 flex items-center justify-between">
                        <span>{sale.lineItems?.length || 0} item(s)</span>
                        <span>{new Date(sale.createdAt).toLocaleDateString('en-BD')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Sale Details & Item Return Panel */}
      {selectedSale && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Sale Info Card */}
          <div className={cardCls}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 font-mono">
                    {selectedSale.invoiceNumber}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      selectedSale.saleType === 'WHOLESALE'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}
                  >
                    {selectedSale.saleType === 'WHOLESALE' ? 'Wholesale B2B' : 'Retail B2C'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Customer: <strong>{selectedSale.customerName}</strong> (
                  {selectedSale.customerPhone || 'N/A'})
                </p>
                <p className="text-[11px] text-gray-400">
                  Sold on: {new Date(selectedSale.createdAt).toLocaleString('en-BD')}
                </p>
              </div>
              <div className="text-right flex items-center sm:flex-col justify-between">
                <div className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  ৳{selectedSale.netTotal?.toLocaleString()}
                </div>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="text-xs text-red-600 hover:underline font-semibold"
                >
                  Change Sale
                </button>
              </div>
            </div>

            {/* Return Items Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Select Sold Line Items to Return
                </span>
                {returnItems.every((item) => item.isAlreadyReturned) && (
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> All items already returned
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {returnItems.map((item, i) => {
                  const lineItem = selectedSale.lineItems[i];
                  const isReturned = item.isAlreadyReturned || (lineItem && lineItem.isFullyReturned) || (item.maxQty <= 0);

                  return (
                    <div
                      key={i}
                      className={`p-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${
                        isReturned
                          ? 'bg-gray-50/70 dark:bg-gray-900/40 opacity-70'
                          : item.selected
                          ? 'bg-red-50/70 dark:bg-red-900/10'
                          : 'bg-white dark:bg-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          disabled={isReturned}
                          onChange={() => toggleItem(i)}
                          className={`w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-[#2563EB] ${
                            isReturned ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 flex-wrap">
                            <span className={isReturned ? 'line-through text-gray-400 dark:text-gray-500' : ''}>
                              {lineItem?.description}
                            </span>
                            {isReturned ? (
                              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700/60 px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                Already Returned
                              </span>
                            ) : lineItem?.returnedQty > 0 ? (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                {lineItem.returnedQty} of {lineItem.qty} returned ({item.maxQty} remaining)
                              </span>
                            ) : null}
                          </div>
                          {item.imeiOrSerial ? (
                            <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 inline-block mt-0.5">
                              IMEI: {item.imeiOrSerial}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400">
                              Bulk item ({lineItem?.qty} pcs purchased
                              {lineItem?.returnedQty > 0 ? `, ${lineItem.returnedQty} returned` : ''})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="w-20">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase">
                            Return Qty
                          </label>
                          <NumberInput
                            value={item.quantity}
                            disabled={isReturned}
                            onChange={(e) => updateReturnQty(i, Number(e.target.value))}
                            min={isReturned ? 0 : 1}
                            max={item.maxQty || 1}
                            className={`w-full px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-xs font-bold text-center text-gray-900 dark:text-gray-100 ${
                              isReturned ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>

                        <div className="w-32">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase">
                            Reason
                          </label>
                          <select
                            value={item.reason}
                            disabled={isReturned}
                            onChange={(e) => updateReason(i, e.target.value)}
                            className={`w-full px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-xs font-semibold text-gray-900 dark:text-gray-100 ${
                              isReturned ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <option value="defective">Defective / Damaged</option>
                            <option value="wrong_item">Wrong Item</option>
                            <option value="change_of_mind">Change of Mind</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div className="text-right min-w-[70px]">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase">
                            Refund
                          </label>
                          <span className="text-sm font-mono font-bold text-red-600 dark:text-red-400">
                            ৳{(() => {
                              if (isReturned) return '0';
                              // Calculate effective refund price considering discounts
                              const hasGlobalDiscount =
                                selectedSale.subTotal > 0 &&
                                selectedSale.netTotal < selectedSale.subTotal;
                              const globalDiscountFactor = hasGlobalDiscount
                                ? selectedSale.netTotal / selectedSale.subTotal
                                : 1;
                              const baseEffectiveUnitPrice =
                                lineItem?.qty > 0
                                  ? (lineItem.totalPrice || 0) / lineItem.qty
                                  : lineItem?.unitPrice || 0;
                              const effectiveUnitPrice = Math.round(
                                baseEffectiveUnitPrice * globalDiscountFactor
                              );
                              return (effectiveUnitPrice * item.quantity).toLocaleString();
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Return Action Type Selector (Cash Refund vs Product Replacement) */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Select Return Resolution / Action
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReturnAction('REFUND')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      returnAction === 'REFUND'
                        ? 'border-red-500 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200 ring-2 ring-red-500/20 shadow-xs'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${returnAction === 'REFUND' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">1. Money / Cash Refund</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Product is restored into stock & cash/payment is refunded to customer.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnAction('REPLACEMENT')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      returnAction === 'REPLACEMENT'
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${returnAction === 'REPLACEMENT' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">2. Product Replacement / Exchange</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Exchange for another product with automatic price difference adjustment.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Product Replacement Picker */}
              {returnAction === 'REPLACEMENT' && (
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Choose Replacement Product from Catalog
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-6 space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">
                        Replacement Product *
                      </label>
                      <select
                        value={replacementItem.productId}
                        onChange={(e) => {
                          const p = storeProducts.find(
                            (x) => String(x.id || x._id) === String(e.target.value)
                          );
                          setReplacementItem({
                            productId: e.target.value,
                            name: p ? p.name : '',
                            unitPrice: p ? Number(p.selling_price || p.sellingPrice || 0) : 0,
                            imeiOrSerial: '',
                            quantity: 1,
                          });
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 font-medium focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select Replacement Product --</option>
                        {storeProducts.map((p) => {
                          const qty = p.stockQuantity ?? p.stock ?? p.stock_quantity ?? 0;
                          const price = Number(p.selling_price || p.sellingPrice || 0);
                          return (
                            <option key={p.id || p._id} value={p.id || p._id}>
                              {p.name} — ৳{price.toLocaleString()} (Stock: {qty})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">
                        Exchange Price (৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={replacementItem.unitPrice || ''}
                        onChange={(e) =>
                          setReplacementItem((prev) => ({
                            ...prev,
                            unitPrice: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">
                        IMEI / Serial (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter IMEI..."
                        value={replacementItem.imeiOrSerial || ''}
                        onChange={(e) =>
                          setReplacementItem((prev) => ({
                            ...prev,
                            imeiOrSerial: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-mono text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Calculation & Confirmation */}
              {(() => {
                const totalReturnValue = returnItems
                  .filter((i) => i.selected)
                  .reduce((sum, item) => {
                    const idx = returnItems.indexOf(item);
                    const lineItem = selectedSale.lineItems[idx];
                    if (!lineItem) return sum;
                    const hasGlobalDiscount =
                      selectedSale.subTotal > 0 && selectedSale.netTotal < selectedSale.subTotal;
                    const globalDiscountFactor = hasGlobalDiscount
                      ? selectedSale.netTotal / selectedSale.subTotal
                      : 1;
                    const baseEffectiveUnitPrice =
                      lineItem.qty > 0
                        ? (lineItem.totalPrice || 0) / lineItem.qty
                        : lineItem.unitPrice || 0;
                    const effectiveUnitPrice = Math.round(
                      baseEffectiveUnitPrice * globalDiscountFactor
                    );
                    return sum + effectiveUnitPrice * item.quantity;
                  }, 0);

                const replacementTotal =
                  returnAction === 'REPLACEMENT'
                    ? (Number(replacementItem.unitPrice) || 0) *
                      (Number(replacementItem.quantity) || 1)
                    : 0;
                const priceDiff = replacementTotal - totalReturnValue;

                return (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {selectedCount} item(s) selected for return
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      {returnAction === 'REFUND' ? (
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Total Refund to Customer</div>
                          <div className="text-xl font-mono font-extrabold text-red-600 dark:text-red-400">
                            ৳{totalReturnValue.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-right space-y-0.5">
                          <div className="text-[11px] text-gray-400">
                            Returned: <strong>৳{totalReturnValue.toLocaleString()}</strong> | Repl:{' '}
                            <strong>৳{replacementTotal.toLocaleString()}</strong>
                          </div>
                          <div className="text-base font-mono font-extrabold flex items-center gap-1 justify-end">
                            <span>Balance Diff:</span>
                            {priceDiff > 0 && (
                              <span className="text-amber-600 dark:text-amber-400">
                                +৳{priceDiff.toLocaleString()} (Customer Pays)
                              </span>
                            )}
                            {priceDiff < 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                ৳{Math.abs(priceDiff).toLocaleString()} (Refund to Customer)
                              </span>
                            )}
                            {priceDiff === 0 && (
                              <span className="text-blue-600 dark:text-blue-400">
                                ৳0 (Even Exchange)
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleReturn}
                        disabled={
                          selectedCount === 0 ||
                          returnMutation.isPending ||
                          (returnAction === 'REPLACEMENT' && !replacementItem.productId)
                        }
                        className={`px-6 py-2.5 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-xs shrink-0 ${
                          returnAction === 'REPLACEMENT'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {returnMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : returnAction === 'REPLACEMENT' ? (
                          <RefreshCw className="w-4 h-4" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        {returnAction === 'REPLACEMENT'
                          ? 'Confirm Product Exchange'
                          : 'Confirm Cash Return'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Return Invoice Modal */}
      {completedReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" /> Return Completed
                  Successfully
                </h2>
                <p className="text-xs text-gray-500">
                  Credit Note Voucher:{' '}
                  <strong className="font-mono text-red-600 dark:text-red-400">
                    {completedReturnModal.returnInvoiceNumber || 'RET-INV'}
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    executeClientPrint(
                      creditNoteRef.current,
                      completedReturnModal.returnInvoiceNumber || 'Return-Credit-Note',
                      'a4'
                    )
                  }
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs"
                >
                  <Printer className="w-4 h-4" /> Print Return Invoice (Credit Note)
                </button>
                <button
                  onClick={() => setCompletedReturnModal(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Credit Note Preview */}
            <div className="p-2 bg-gray-100 dark:bg-gray-950 rounded-xl overflow-x-auto">
              <div ref={creditNoteRef}>
                <ReturnCreditNote
                  sale={completedReturnModal.sale}
                  returnLogsGroup={completedReturnModal.logs}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCompletedReturnModal(null)}
                className="px-5 py-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
