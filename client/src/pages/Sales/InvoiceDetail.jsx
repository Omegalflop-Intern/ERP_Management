import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Maximize,
  Minimize,
  Printer,
  RotateCcw,
  Smartphone,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
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

  const getPageStyle = () => {
    switch (printSize) {
      case 'a4half':
        return `@page { size: A5 portrait; margin: 0; } @media print { html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
      case 'receipt':
        return `@page { size: 80mm auto; margin: 0; } @media print { html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
      case 'thermal':
        return `@page { size: 58mm auto; margin: 0; } @media print { html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
      default:
        return `@page { size: A4 portrait; margin: 0; } @media print { html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    contentRef: printRef,
    documentTitle: sale ? `Invoice-${sale.invoiceNumber}` : 'Invoice',
    pageStyle: getPageStyle(),
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

  const toggleReturnItem = (item) => {
    const key = item._id;
    const remainingQty = item.qty - (item.returnedQty || 0);
    if (remainingQty <= 0) return;

    if (returnSelection[key]) {
      const next = { ...returnSelection };
      delete next[key];
      setReturnSelection(next);
    } else {
      setReturnSelection({
        ...returnSelection,
        [key]: {
          lineItemId: item._id,
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

  const calculateReturnTotal = () => {
    return Object.values(returnSelection).reduce(
      (sum, item) => sum + item.unitPrice * (Number(item.quantity) || 0),
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
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {INVOICE_SIZES.map((size) => (
              <button
                key={size.key}
                onClick={() => setPrintSize(size.key)}
                className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${printSize === size.key ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}
              >
                <size.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{size.label}</span>
              </button>
            ))}
          </div>

          {sale.status !== 'RETURNED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReturnModal(true)}
              className="gap-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            >
              <RotateCcw className="w-4 h-4" /> Return Items
            </Button>
          )}

          <Button
            onClick={async () => {
              const { executeClientPrint } = await import('../../utils/invoiceGenerator');
              executeClientPrint(
                printRef.current,
                `Invoice-${sale?.invoiceNumber || ''}`,
                printSize
              );
            }}
            className="bg-red-700 hover:bg-red-600 text-white gap-2"
            size="sm"
          >
            <Printer className="w-4 h-4" /> Print
          </Button>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDownload(!showDownload)}
              className="gap-2 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
            >
              <Download className="w-4 h-4 text-slate-700 dark:text-slate-300" /> PDF
            </Button>
            {showDownload && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDownload(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 min-w-[180px]">
                  {[
                    {
                      label: '⚡ Backend Vector PDF',
                      fn: async () => {
                        const mod = await import('../../utils/invoiceGenerator');
                        mod.downloadBackendInvoicePdf(sale._id, sale.invoiceNumber);
                      },
                    },
                    {
                      label: 'A4 Full Size',
                      fn: async () => {
                        const mod = await import('../../utils/invoiceGenerator');
                        mod.generateA4Invoice(sale, printRef.current);
                      },
                    },
                    {
                      label: 'A4 Half Size',
                      fn: async () => {
                        const mod = await import('../../utils/invoiceGenerator');
                        mod.generateA4HalfInvoice(sale, printRef.current);
                      },
                    },
                    {
                      label: 'Receipt (80mm)',
                      fn: async () => {
                        const mod = await import('../../utils/invoiceGenerator');
                        mod.generateReceipt80(sale, printRef.current);
                      },
                    },
                    {
                      label: 'Thermal (58mm)',
                      fn: async () => {
                        const mod = await import('../../utils/invoiceGenerator');
                        mod.generateReceipt58(sale, printRef.current);
                      },
                    },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        opt.fn();
                        setShowDownload(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <span>Return &amp; Refund Log ({sale.returnLogs?.length || 0} entries)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                Total Refunded: ৳{(sale.returnedAmount || 0).toLocaleString()} (
                {sale.returnLogs?.reduce((acc, l) => acc + (l.qty || 1), 0) || 0} pcs returned)
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreditNoteModal(true)}
                className="gap-1.5 text-xs text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 font-bold"
              >
                <Printer className="w-3.5 h-3.5" /> Return Credit Note
              </Button>
            </div>
          </div>
          <div className="divide-y divide-amber-200/50 dark:divide-amber-900/40 border border-amber-200 dark:border-amber-900/40 rounded-lg overflow-hidden bg-white/60 dark:bg-gray-900/40">
            {sale.returnLogs?.map((log, idx) => (
              <div
                key={idx}
                className="p-2.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200"
              >
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-2">
                    {log.returnInvoiceNumber && (
                      <span className="font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                        {log.returnInvoiceNumber}
                      </span>
                    )}
                    {log.imeiOrSerial ? (
                      <span className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        IMEI: {log.imeiOrSerial}
                      </span>
                    ) : (
                      <span>Bulk Line Item</span>
                    )}
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                      {log.reason || 'defective'}
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

      {/* Invoice Renderer */}
      <div className="bg-gray-200 dark:bg-gray-900 rounded-xl p-4 flex justify-center overflow-x-auto">
        <div ref={printRef} className={`${getWidth()} flex-shrink-0 printable-invoice-container`}>
          {renderInvoice()}
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
              {sale.lineItems?.map((item) => {
                const availableToReturn = item.qty - (item.returnedQty || 0);
                const isSelected = !!returnSelection[item._id];
                const isFullyReturned = availableToReturn <= 0;

                return (
                  <div
                    key={item._id}
                    className={`p-3 rounded-lg border transition-all ${isFullyReturned ? 'bg-gray-100 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-60' : isSelected ? 'bg-red-500/10 border-red-500/40' : 'bg-background border-border'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          disabled={isFullyReturned}
                          checked={isSelected}
                          onChange={() => toggleReturnItem(item)}
                          className="w-4 h-4 text-red-600 rounded cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">
                            {item.description}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {item.imeiOrSerial ? `IMEI: ${item.imeiOrSerial}` : 'Bulk Product'} |
                            Unit: ৳{item.unitPrice?.toLocaleString()}
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
                            value={returnSelection[item._id]?.quantity}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              updateReturnField(
                                item._id,
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
                            value={returnSelection[item._id]?.reason}
                            onChange={(e) => updateReturnField(item._id, 'reason', e.target.value)}
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
                            value={returnSelection[item._id]?.notes}
                            onChange={(e) => updateReturnField(item._id, 'notes', e.target.value)}
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
            <div className="text-sm font-semibold">
              Total Refund:{' '}
              <span className="text-red-600 font-mono">
                ৳{calculateReturnTotal().toLocaleString()}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowReturnModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={returnMutation.isPending || Object.keys(returnSelection).length === 0}
                onClick={handleSubmitReturn}
              >
                {returnMutation.isPending ? 'Processing...' : 'Confirm Return & Refund'}
              </Button>
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
                className="bg-red-700 hover:bg-red-600 text-white font-bold gap-2 text-xs"
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
    </div>
  );
}
