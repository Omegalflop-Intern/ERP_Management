import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Download,
  FileText,
  Maximize,
  Minimize,
  Printer,
  RefreshCw,
  RotateCcw,
  Smartphone,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { toast } from 'sonner';
import {
  InvoiceA4Full,
  InvoiceA4Half,
  InvoiceReceipt,
  InvoiceThermal,
} from '../../components/sales/Invoice';
import ReturnCreditNote from '../../components/sales/ReturnCreditNote';
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
import api from '../../lib/api';
import { executeClientPrint } from '../../utils/invoiceGenerator';

const INVOICE_SIZES = [
  { key: 'a4', label: 'A4 Full', icon: Maximize },
  { key: 'a4half', label: 'A4 Half', icon: FileText },
  { key: 'receipt', label: 'Receipt', icon: Minimize },
  { key: 'thermal', label: 'Thermal', icon: Smartphone },
];

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const printRef = useRef(null);
  const creditNoteRef = useRef(null);
  const [printSize, setPrintSize] = useState('a4');
  const [showDownload, setShowDownload] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [showCollectDueModal, setShowCollectDueModal] = useState(false);
  const [returnSelection, setReturnSelection] = useState({});

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      const res = await api.get(`/sales/${id}`);
      return res.data?.data;
    },
    enabled: !!id,
  });

  const returnMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post(`/sales/${id}/return`, payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Return processed successfully');
      setShowReturnModal(false);
      setReturnSelection({});
      queryClient.invalidateQueries(['sale', id]);
      queryClient.invalidateQueries(['sales']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to process return');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Sale not found</p>
        <button
          onClick={() => navigate('/sales')}
          className="mt-4 text-red-600 hover:underline text-sm"
        >
          Back to Sales
        </button>
      </div>
    );
  }

  const paid =
    (sale.paymentBreakdown?.cash || 0) +
    (sale.paymentBreakdown?.bkash || 0) +
    (sale.paymentBreakdown?.rocket || 0) +
    (sale.paymentBreakdown?.nagad || 0) +
    (sale.paymentBreakdown?.bank || 0);

  const renderInvoice = () => {
    switch (printSize) {
      case 'a4half':
        return <InvoiceA4Half sale={sale} />;
      case 'receipt':
        return <InvoiceReceipt sale={sale} />;
      case 'thermal':
        return <InvoiceThermal sale={sale} />;
      default:
        return <InvoiceA4Full sale={sale} />;
    }
  };

  const getWidth = () => {
    switch (printSize) {
      case 'receipt':
        return 'max-w-[80mm]';
      case 'thermal':
        return 'max-w-[58mm]';
      default:
        return 'max-w-[210mm]';
    }
  };

  const getItemKey = (item, idx) =>
    String(item?._id || item?.id || item?.lineItemId || item?.productId?._id || item?.productId || `item-${idx}`);

  const toggleReturnItem = (item, idx) => {
    const key = getItemKey(item, idx);
    const remainingQty = (item.qty || 0) - (item.returnedQty || 0);
    if (remainingQty <= 0) return;

    if (returnSelection[key]) {
      const next = { ...returnSelection };
      delete next[key];
      setReturnSelection(next);
    } else {
      setReturnSelection({
        ...returnSelection,
        [key]: {
          lineItemId: item._id || item.id || item.lineItemId || key,
          productId: item.productId?._id || item.productId,
          imeiOrSerial: item.imeiOrSerial || '',
          description: item.description,
          unitPrice: item.unitPrice,
          maxQty: remainingQty,
          quantity: 1,
          reason: 'defective',
          notes: '',
        },
      });
    }
  };

  const updateReturnField = (key, field, val) => {
    if (!returnSelection[key]) return;
    setReturnSelection({
      ...returnSelection,
      [key]: {
        ...returnSelection[key],
        [field]: val,
      },
    });
  };

  // Calculate effective refund price accounting for global discount
  const getEffectiveReturnUnitPrice = (item) => {
    const hasGlobalDiscount = sale.subTotal > 0 && sale.netTotal < sale.subTotal;
    const globalDiscountFactor = hasGlobalDiscount ? sale.netTotal / sale.subTotal : 1;
    const baseEffective = item.unitPrice;
    return Math.round(baseEffective * globalDiscountFactor);
  };

  const calculateReturnTotal = () => {
    return Object.values(returnSelection).reduce(
      (sum, item) => sum + getEffectiveReturnUnitPrice(item) * (Number(item.quantity) || 0),
      0
    );
  };

  const handleSubmitReturn = () => {
    const items = Object.values(returnSelection).map((item) => ({
      lineItemId: item.lineItemId,
      productId: item.productId,
      imeiOrSerial: item.imeiOrSerial,
      quantity: Number(item.quantity) || 1,
      reason: item.reason,
      notes: item.notes,
    }));

    if (items.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    returnMutation.mutate({ items });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RETURNED':
        return <Badge variant="destructive">Fully Returned</Badge>;
      case 'PARTIALLY_RETURNED':
        return <Badge variant="warning">Partially Returned</Badge>;
      default:
        return <Badge variant="success">Completed</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/sales')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Invoice {sale.invoiceNumber}
              </h1>
              {getStatusBadge(sale.status)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(sale.createdAt).toLocaleString('en-BD')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Print Size Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800/80 rounded-xl p-1 border border-gray-200 dark:border-gray-700/50">
            {INVOICE_SIZES.map((size) => (
              <button
                key={size.key}
                onClick={() => setPrintSize(size.key)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  printSize === size.key
                    ? 'bg-white dark:bg-gray-700 shadow-md shadow-gray-200/50 dark:shadow-gray-900/50 text-[#2563EB] dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <size.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{size.label}</span>
              </button>
            ))}
          </div>

          {/* Collect Due Button */}
          {Number(sale.paymentBreakdown?.dueAmount || 0) > 0 && (
            <button
              onClick={() => setShowCollectDueModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:shadow-md active:scale-[0.97]"
            >
              <DollarSign className="w-4 h-4" /> Collect Due (৳{Number(sale.paymentBreakdown.dueAmount).toLocaleString()})
            </button>
          )}

          {/* Return Items Button */}
          {sale.status !== 'RETURNED' && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md hover:shadow-amber-200/30 dark:hover:shadow-amber-900/20 active:scale-[0.97]"
            >
              <RotateCcw className="w-4 h-4" /> Return Items
            </button>
          )}

          {/* Print Button */}
          <button
            onClick={async () => {
              const { executeClientPrint } = await import('../../utils/invoiceGenerator');
              executeClientPrint(
                printRef.current,
                `Invoice-${sale?.invoiceNumber || ''}`,
                printSize
              );
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.97]"
          >
            <Printer className="w-4 h-4" /> Print
          </button>

          {/* PDF Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDownload(!showDownload)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md hover:shadow-gray-200/40 dark:hover:shadow-gray-900/30 active:scale-[0.97]"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
            {showDownload && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDownload(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-gray-300/40 dark:shadow-gray-900/60 py-2 min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Export Options
                    </span>
                  </div>
                  {[
                    {
                      label: '⚡ Backend Vector PDF',
                      desc: 'Server-rendered high quality',
                      fn: async () => {
                        const mod = await import('../../utils/invoiceGenerator');
                        mod.downloadBackendInvoicePdf(sale._id, sale.invoiceNumber);
                      },
                    },
                    {
                      label: 'A4 Full Size',
                      desc: 'Standard full page',
                      fn: async () => {
                        const mod = await import('../../utils/invoiceGenerator');
                        mod.generateA4Invoice(sale, printRef.current);
                      },
                    },
                    {
                      label: 'A4 Half Size',
                      desc: 'Compact A5 format',
                      fn: async () => {
                        const mod = await import('../../utils/invoiceGenerator');
                        mod.generateA4HalfInvoice(sale, printRef.current);
                      },
                    },
                    {
                      label: 'Receipt (80mm)',
                      desc: 'POS receipt format',
                      fn: async () => {
                        const mod = await import('../../utils/invoiceGenerator');
                        mod.generateReceipt80(sale, printRef.current);
                      },
                    },
                    {
                      label: 'Thermal (58mm)',
                      desc: 'Small thermal printer',
                      fn: async () => {
                        const mod = await import('../../utils/invoiceGenerator');
                        mod.generateReceipt58(sale, printRef.current);
                      },
                    },
                  ].map((opt, idx) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        opt.fn();
                        setShowDownload(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex flex-col gap-0.5"
                    >
                      <span>{opt.label}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Grand Total</div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            ৳{sale.netTotal?.toLocaleString()}
          </div>
          {sale.returnedAmount > 0 && (
            <div className="text-xs text-amber-600 font-medium mt-1">
              Returned: -৳{sale.returnedAmount.toLocaleString()}
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
            Net Paid / Retained
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            ৳{Math.max(0, paid - (sale.returnedAmount || 0)).toLocaleString()}
          </div>
          {sale.returnedAmount > 0 && (
            <div className="text-[10px] text-gray-400 mt-1">
              Initially Rec'd: ৳{paid.toLocaleString()} (-৳{sale.returnedAmount.toLocaleString()}{' '}
              ref.)
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Due</div>
          <div
            className={`text-xl font-bold ${sale.paymentBreakdown?.dueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}
          >
            ৳{sale.paymentBreakdown?.dueAmount?.toLocaleString() || 0}
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Customer</div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {sale.customerName}
          </div>
          <div className="text-xs text-gray-500">{sale.customerPhone}</div>
          {sale.customerEmail && <div className="text-xs text-gray-400">{sale.customerEmail}</div>}
          {sale.customerAddress && (
            <div className="text-xs text-gray-400">{sale.customerAddress}</div>
          )}
        </div>
      </div>

      {/* Return History Section if return logs exist */}
      {(sale.returnLogs?.length > 0 || sale.returnedAmount > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
              <RotateCcw className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Return & Refund History ({sale.returnLogs?.length || 1} event)</span>
            </div>
            <button
              onClick={() => setShowCreditNoteModal(true)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> View Credit Note
            </button>
          </div>

          <div className="divide-y divide-amber-200/60 dark:divide-amber-900/30">
            {sale.returnLogs?.map((log, idx) => (
              <div key={idx} className="py-2.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>{log.description}</span>
                    {log.imeiOrSerial && (
                      <span className="font-mono text-[10px] bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                        {log.imeiOrSerial}
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                      {log.reason || 'Returned'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-2">
                    <span>
                      Returned Qty: <strong>{log.qty} pc(s)</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Effective Unit Refund: ৳
                      {(
                        log.effectiveUnitPrice ||
                        (log.qty > 0 ? Math.round(log.refundAmount / log.qty) : log.refundAmount)
                      )?.toLocaleString()}
                    </span>
                    <span>•</span>
                    <span>
                      Date: {new Date(log.returnedAt || sale.updatedAt).toLocaleString('en-BD')}
                    </span>
                    {log.notes && <span>• Notes: {log.notes}</span>}
                  </div>
                </div>
                <div className="text-right font-mono font-extrabold text-sm text-red-600 dark:text-red-400">
                  -৳{log.refundAmount?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Renderer with Responsive Fit & Scroll */}
      <div className="bg-slate-200/80 dark:bg-slate-900/80 rounded-2xl p-2 sm:p-4 md:p-6 w-full shadow-inner border border-slate-300/40 dark:border-slate-800">
        <div className="w-full overflow-x-auto pb-4 flex justify-start md:justify-center">
          <div
            ref={printRef}
            className={`${getWidth()} w-full min-w-[320px] sm:min-w-[650px] md:min-w-[750px] flex-shrink-0 printable-invoice-container`}
          >
            {renderInvoice()}
          </div>
        </div>
      </div>

      {/* Return Modal Dialog */}
      <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <RotateCcw className="w-5 h-5" /> Process Sales Return & Refund
            </DialogTitle>
            <DialogDescription>
              Select items from Invoice{' '}
              <span className="font-mono font-bold">{sale.invoiceNumber}</span> to return back to
              inventory stock.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              {sale.lineItems?.map((item, idx) => {
                const itemKey = getItemKey(item, idx);
                const availableToReturn = item.qty - (item.returnedQty || 0);
                const isSelected = !!returnSelection[itemKey];
                const isFullyReturned = availableToReturn <= 0;

                return (
                  <div
                    key={itemKey}
                    className={`p-3 rounded-lg border transition-all ${isFullyReturned ? 'bg-gray-100 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-60' : isSelected ? 'bg-red-500/10 border-red-500/40' : 'bg-background border-border'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          disabled={isFullyReturned}
                          checked={isSelected}
                          onChange={() => toggleReturnItem(item, idx)}
                          className="w-4 h-4 text-red-600 rounded cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">
                            {item.description}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {item.imeiOrSerial ? `IMEI: ${item.imeiOrSerial}` : 'Bulk Product'} |
                            Unit: ৳
                            {getEffectiveReturnUnitPrice({
                              unitPrice: item.unitPrice,
                            })?.toLocaleString()}
                            {sale.subTotal > 0 && sale.netTotal < sale.subTotal && (
                              <span className="text-[10px] text-gray-400 ml-1">
                                (original: ৳{item.unitPrice?.toLocaleString()})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {isFullyReturned ? (
                          <Badge variant="destructive">Returned</Badge>
                        ) : (
                          <div className="text-xs text-muted-foreground font-mono">
                            Sold: {item.qty}{' '}
                            {item.returnedQty > 0 && (
                              <span className="text-amber-500">(Ret: {item.returnedQty})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-red-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-[11px]">
                            Return Qty (Max {availableToReturn})
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            max={availableToReturn}
                            value={returnSelection[itemKey]?.quantity}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              updateReturnField(
                                itemKey,
                                'quantity',
                                Math.min(availableToReturn, Math.max(1, Number(e.target.value)))
                              )
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px]">Reason</Label>
                          <select
                            value={returnSelection[itemKey]?.reason}
                            onChange={(e) => updateReturnField(itemKey, 'reason', e.target.value)}
                            className="w-full h-8 px-2 bg-background border border-input rounded-md text-xs text-foreground"
                          >
                            <option value="defective">Defective / Damaged</option>
                            <option value="wrong_item">Wrong Item</option>
                            <option value="change_of_mind">Change of Mind</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-[11px]">Notes (Optional)</Label>
                          <Input
                            placeholder="Reason details..."
                            value={returnSelection[itemKey]?.notes}
                            onChange={(e) => updateReturnField(itemKey, 'notes', e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-between sm:justify-between border-t pt-3">
            <div className="space-y-1">
              <div className="text-sm font-semibold">
                Total Refund:{' '}
                <span className="text-red-600 font-mono">
                  ৳{calculateReturnTotal().toLocaleString()}
                </span>
              </div>
              {sale.subTotal > 0 && sale.netTotal < sale.subTotal && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400">
                  Discount applied:{' '}
                  {Math.round(((sale.subTotal - sale.netTotal) / sale.subTotal) * 100)}% off
                  original price
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg text-xs transition-all border border-gray-200 dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={returnMutation.isPending || Object.keys(returnSelection).length === 0}
                onClick={handleSubmitReturn}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-2 shadow-xs"
              >
                {returnMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                Confirm Return & Refund
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Credit Note Voucher Modal */}
      {showCreditNoteModal && sale && (
        <Dialog open={showCreditNoteModal} onOpenChange={setShowCreditNoteModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-red-600" /> Return Credit Note Voucher
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Official Return Voucher for Original Invoice #{sale.invoiceNumber}
                </DialogDescription>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  executeClientPrint(
                    creditNoteRef.current,
                    `Credit-Note-${sale.invoiceNumber}`,
                    'a4'
                  )
                }
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold gap-2 text-xs"
              >
                <Printer className="w-4 h-4" /> Print Return Credit Note
              </Button>
            </DialogHeader>

            <div className="p-2 bg-gray-100 dark:bg-gray-950 rounded-xl overflow-x-auto">
              <div ref={creditNoteRef}>
                <ReturnCreditNote sale={sale} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowCreditNoteModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Collect Due Modal */}
      {showCollectDueModal && (
        <InvoiceCollectDueModal
          sale={sale}
          onClose={() => setShowCollectDueModal(false)}
          onSuccess={() => {
            setShowCollectDueModal(false);
            queryClient.invalidateQueries({ queryKey: ['sale', id] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer-history'] });
            queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
          }}
        />
      )}
    </div>
  );
}

function InvoiceCollectDueModal({ sale, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const dueAmount = Number(sale.paymentBreakdown?.dueAmount || 0);

  const mutation = useMutation({
    mutationFn: async () => {
      let collectAmount = amount === '' ? dueAmount : Number(amount);
      if (isNaN(collectAmount) || collectAmount <= 0) {
        throw new Error('Please enter a valid payment amount');
      }
      if (collectAmount > dueAmount) {
        collectAmount = dueAmount;
      }

      const custId = typeof sale.customerId === 'object' ? (sale.customerId?._id || sale.customerId?.id) : sale.customerId;

      if (custId) {
        return api.post(`/customers/${custId}/collect-due`, {
          amount: collectAmount,
          paymentMethod: method,
        });
      }

      const updatedBreakdown = { ...(sale.paymentBreakdown || {}) };
      const m = (method || 'cash').toLowerCase();
      updatedBreakdown[m] = (Number(updatedBreakdown[m]) || 0) + collectAmount;
      updatedBreakdown.dueAmount = Math.max(0, dueAmount - collectAmount);

      const targetSaleId = sale.id || sale._id;
      return api.put(`/sales/${targetSaleId}`, { paymentBreakdown: updatedBreakdown });
    },
    onSuccess: () => {
      toast.success('Due payment collected and recorded successfully!');
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || e.message || 'Failed to collect payment'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[94vw] rounded-3xl p-0 border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#0f172a]">
        <div className="p-5 px-6 pr-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Collect Due — {sale.invoiceNumber}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Record customer payment against this invoice.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Customer:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-2">
              <span className="text-rose-600 font-bold uppercase text-[10px]">Invoice Due Pending:</span>
              <span className="text-base font-black font-mono text-rose-600">
                ৳{dueAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Amount to Collect (৳) *
            </Label>
            <Input
              type="number"
              min="1"
              max={dueAmount}
              placeholder={`Max: ${dueAmount}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 rounded-xl mt-1.5 bg-slate-50 dark:bg-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Leave blank to settle full invoice due of ৳{dueAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Payment Method
            </Label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full mt-1.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="cash">Cash in Hand</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
              <option value="bank">Bank / Card</option>
            </select>
          </div>

          <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 px-5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {mutation.isPending ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
