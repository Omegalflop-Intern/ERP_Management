import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, DollarSign, Phone, User, RefreshCw, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function DueCollection() {
  const [search, setSearch] = useState('');
  const [collectModal, setCollectModal] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sales', 'due'],
    queryFn: async () => {
      const res = await api.get('/sales', { params: { limit: 200 } });
      return res.data?.data || [];
    },
  });

  const sales = (data || []).filter(s => s.paymentBreakdown?.dueAmount > 0);
  const filteredSales = search
    ? sales.filter(s => s.customerName?.toLowerCase().includes(search.toLowerCase()) || s.customerPhone?.includes(search))
    : sales;

  const totalDue = sales.reduce((sum, s) => sum + (s.paymentBreakdown?.dueAmount || 0), 0);

  const summaryCards = [
    { label: 'Total Due', value: `৳${totalDue.toLocaleString()}`, color: 'text-red-600 dark:text-red-400', icon: AlertCircle },
    { label: 'Customers with Due', value: new Set(sales.map(s => s.customerPhone).filter(Boolean)).size, color: 'text-amber-600 dark:text-amber-400', icon: User },
    { label: 'Invoices with Due', value: sales.length, color: 'text-blue-600 dark:text-blue-400', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Due Collection</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track and collect pending payments from customers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>
              {isLoading ? <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /> : card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search by customer name or phone..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500" />
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Invoice</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Paid</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Due</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-green-500" />
                    <p>No pending dues found</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const paid = (s.paymentBreakdown?.cash || 0) + (s.paymentBreakdown?.bkash || 0) + (s.paymentBreakdown?.rocket || 0) + (s.paymentBreakdown?.nagad || 0) + (s.paymentBreakdown?.bank || 0);
                  return (
                    <tr key={s._id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3"><span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{s.invoiceNumber}</span></td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.customerName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{s.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">৳{s.netTotal?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">৳{paid.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-red-600 dark:text-red-400">৳{s.paymentBreakdown?.dueAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{new Date(s.createdAt).toLocaleDateString('en-BD')}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setCollectModal(s)}
                            className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors">
                            Collect
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

      {collectModal && <CollectDueModal sale={collectModal} onClose={() => setCollectModal(null)} onSuccess={() => { setCollectModal(null); queryClient.invalidateQueries(['sales']); }} />}
    </div>
  );
}

function CollectDueModal({ sale, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const dueAmount = sale.paymentBreakdown?.dueAmount || 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const collectAmount = Number(amount) || dueAmount;
      const updatedBreakdown = { ...sale.paymentBreakdown };
      if (method === 'cash') updatedBreakdown.cash = (updatedBreakdown.cash || 0) + collectAmount;
      else if (method === 'bkash') updatedBreakdown.bkash = (updatedBreakdown.bkash || 0) + collectAmount;
      else if (method === 'rocket') updatedBreakdown.rocket = (updatedBreakdown.rocket || 0) + collectAmount;
      else if (method === 'nagad') updatedBreakdown.nagad = (updatedBreakdown.nagad || 0) + collectAmount;
      else if (method === 'bank') updatedBreakdown.bank = (updatedBreakdown.bank || 0) + collectAmount;
      updatedBreakdown.dueAmount = Math.max(0, dueAmount - collectAmount);
      return api.put(`/sales/${sale._id}`, { paymentBreakdown: updatedBreakdown });
    },
    onSuccess: () => { toast.success('Payment collected'); onSuccess(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Collect Due Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">Invoice</div>
            <div className="font-mono font-bold text-gray-900 dark:text-gray-100">{sale.invoiceNumber}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{sale.customerName} &middot; {sale.customerPhone}</div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400 mt-2">Due: ৳{dueAmount.toLocaleString()}</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Amount (৳)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Max: ${dueAmount}`}
              max={dueAmount}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500" />
            <p className="text-xs text-gray-400 mt-1">Leave empty to collect full amount</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500">
              <option value="cash">Cash</option>
              <option value="bkash">bKash</option>
              <option value="rocket">Rocket</option>
              <option value="nagad">Nagad</option>
              <option value="bank">Bank/Card</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-colors">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              {mutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              Collect Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
