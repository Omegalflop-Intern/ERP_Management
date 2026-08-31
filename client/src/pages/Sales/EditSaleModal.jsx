import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import api from '../../lib/api';

export default function EditSaleModal({ saleId, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const initializedRef = React.useRef(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [saleType, setSaleType] = useState('RETAIL');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [paymentCash, setPaymentCash] = useState('');
  const [paymentBkash, setPaymentBkash] = useState('');
  const [paymentRocket, setPaymentRocket] = useState('');
  const [paymentNagad, setPaymentNagad] = useState('');
  const [paymentBank, setPaymentBank] = useState('');

  const { data: saleData, isLoading } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: async () => {
      const res = await api.get(`/sales/${saleId}`);
      return res.data?.data;
    },
    enabled: !!saleId,
  });

  useEffect(() => {
    if (saleData && !initializedRef.current) {
      initializedRef.current = true;
      setCustomerName(saleData.customerName || '');
      setCustomerPhone(saleData.customerPhone || '');
      setCustomerEmail(saleData.customerEmail || '');
      setSaleType(saleData.saleType || 'RETAIL');
      setItems(
        (saleData.lineItems || []).map((li) => ({
          productId: li.productId?._id || li.productId,
          description: li.description || '',
          imeiOrSerial: li.imeiOrSerial || '',
          qty: li.qty || 1,
          unitPrice: li.unitPrice ? String(li.unitPrice) : '',
          unitCost: li.unitCost ? String(li.unitCost) : '',
        }))
      );
      setDiscount(saleData.discount ? String(saleData.discount) : '');
      setTax(saleData.tax ? String(saleData.tax) : '');
      setPaymentCash(saleData.paymentBreakdown?.cash ? String(saleData.paymentBreakdown.cash) : '');
      setPaymentBkash(
        saleData.paymentBreakdown?.bkash ? String(saleData.paymentBreakdown.bkash) : ''
      );
      setPaymentRocket(
        saleData.paymentBreakdown?.rocket ? String(saleData.paymentBreakdown.rocket) : ''
      );
      setPaymentNagad(
        saleData.paymentBreakdown?.nagad ? String(saleData.paymentBreakdown.nagad) : ''
      );
      setPaymentBank(saleData.paymentBreakdown?.bank ? String(saleData.paymentBreakdown.bank) : '');
    }
  }, [saleData]);

  const numDiscount = Number(discount) || 0;
  const numTax = Number(tax) || 0;
  const subTotal = items.reduce(
    (sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.qty) || 1),
    0
  );
  const netTotal = Math.max(0, subTotal - numDiscount + numTax);
  const totalPaid =
    (Number(paymentCash) || 0) +
    (Number(paymentBkash) || 0) +
    (Number(paymentRocket) || 0) +
    (Number(paymentNagad) || 0) +
    (Number(paymentBank) || 0);
  const dueAmount = Math.max(0, netTotal - totalPaid);

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      { productId: '', description: '', imeiOrSerial: '', qty: 1, unitPrice: 0, unitCost: 0 },
    ]);
  };

  const removeItem = (idx) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateMutation = useMutation({
    mutationFn: async (payload) => api.put(`/sales/${saleId}`, payload),
    onSuccess: () => {
      toast.success('Sale updated successfully');
      queryClient.invalidateQueries(['sales']);
      queryClient.invalidateQueries(['sale', saleId]);
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update sale'),
  });

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error('At least one item is required');
      return;
    }
    for (const item of items) {
      if (!item.description) {
        toast.error('Item description is required');
        return;
      }
      if (item.unitPrice < 0) {
        toast.error('Unit price cannot be negative');
        return;
      }
    }
    updateMutation.mutate({
      customerName,
      customerPhone,
      customerEmail,
      saleType,
      items: items.map((item) => ({
        productId: item.productId,
        description: item.description,
        imeiOrSerial: item.imeiOrSerial || undefined,
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice),
        unitCost: Number(item.unitCost),
      })),
      discount: Number(discount),
      tax: Number(tax),
      paymentBreakdown: {
        cash: Number(paymentCash),
        bkash: Number(paymentBkash),
        rocket: Number(paymentRocket),
        nagad: Number(paymentNagad),
        bank: Number(paymentBank),
        dueAmount,
      },
    });
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sale — {saleData?.invoiceNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Sale Type
              </label>
              <select
                value={saleType}
                onChange={(e) => setSaleType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
              >
                <option value="RETAIL">Retail (B2C)</option>
                <option value="WHOLESALE">Wholesale (B2B)</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Unit Price (৳)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="w-24 text-right">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Total</label>
                    <div className="px-2.5 py-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100">
                      ৳{((Number(item.unitPrice) || 0) * (Number(item.qty) || 1)).toLocaleString()}
                    </div>
                  </div>
                  {item.imeiOrSerial && (
                    <div className="w-28">
                      <label className="block text-[10px] text-gray-500 mb-0.5">IMEI</label>
                      <div className="px-2.5 py-1.5 text-[10px] text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg truncate">
                        {item.imeiOrSerial}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    disabled={items.length <= 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Discount / Tax */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Discount (৳)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Tax (৳)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Payment Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { label: 'Cash', value: paymentCash, set: setPaymentCash },
                { label: 'bKash', value: paymentBkash, set: setPaymentBkash },
                { label: 'Rocket', value: paymentRocket, set: setPaymentRocket },
                { label: 'Nagad', value: paymentNagad, set: setPaymentNagad },
                { label: 'Bank', value: paymentBank, set: setPaymentBank },
              ].map((p) => (
                <div key={p.label}>
                  <label className="block text-[10px] text-gray-500 mb-0.5">{p.label}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={p.value}
                    onChange={(e) => p.set(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>৳{subTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Discount</span>
              <span className="text-red-500">- ৳{discount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Tax</span>
              <span>+ ৳{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700 pt-1.5">
              <span>Net Total</span>
              <span>৳{netTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
              <span>Paid</span>
              <span>৳{totalPaid.toLocaleString()}</span>
            </div>
            {dueAmount > 0 && (
              <div className="flex justify-between text-xs text-red-600 dark:text-red-400 font-semibold">
                <span>Due</span>
                <span>৳{dueAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
