import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Smartphone, Wrench, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';

const statusConfig = {
  RECEIVED: {
    label: 'Received',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  INSPECTING: {
    label: 'Inspecting',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  AWAITING_PARTS: {
    label: 'Awaiting Parts',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  REPAIRED: {
    label: 'Repaired',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  },
};

import PageHeader from '../components/layout/PageHeader';
import EmptyState from '../components/ui/EmptyState';

export default function RepairsView() {
  const queryClient = useQueryClient();
  const { styled } = useTheme();
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    customerName: '',
    customerPhone: '',
    deviceModel: '',
    imeiOrSerial: '',
    issueDescription: '',
    estimatedCost: '',
    advancePaid: '',
    technicianName: 'Sabbir Ahmed',
  });

  const { data: repairsData, isLoading } = useQuery({
    queryKey: ['repairs'],
    queryFn: async () => {
      const { data } = await api.get('/repairs');
      return data.data || [];
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/repairs', payload);
      return data.data;
    },
    onSuccess: (ticket) => {
      toast.success(`Repair Ticket ${ticket.ticketNumber} Created!`, {
        description: `Device: ${ticket.deviceModel} (${ticket.customerName})`,
      });
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setShowNewTicketModal(false);
      setTicketForm({
        customerName: '',
        customerPhone: '',
        deviceModel: '',
        imeiOrSerial: '',
        issueDescription: '',
        estimatedCost: '',
        advancePaid: '',
        technicianName: 'Sabbir Ahmed',
      });
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/repairs/${id}/status`, { status });
      return data.data;
    },
    onSuccess: (data) => {
      toast.success(`Status updated to ${data.status}`);
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const repairs = repairsData || [];

  const handleFormChange = (field, value) => setTicketForm((prev) => ({ ...prev, [field]: value }));

  const inputCls = styled
    ? 'neu-input w-full px-3 py-2 rounded-lg text-sm'
    : 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repair & Service Management"
        subtitle="Log mobile repair tickets, track technician service progress, and issue repair invoices."
        icon={Wrench}
        breadcrumbs={['Purchases & Repairs', 'Repairs & Services']}
        actions={
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" /> Log Repair Ticket
          </button>
        }
      />

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* Repair Tickets Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repairs.map((ticket) => {
            const sc = statusConfig[ticket.status] || statusConfig.RECEIVED;
            return (
              <div
                key={ticket._id}
                className={`p-5 rounded-2xl space-y-4 transition-all ${styled ? 'neu-card' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                    {ticket.ticketNumber}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${sc.color}`}>
                    {sc.label}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-500" /> {ticket.deviceModel}
                  </div>
                  {ticket.imeiOrSerial && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      IMEI: {ticket.imeiOrSerial}
                    </div>
                  )}
                  <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/60 p-2 rounded-lg border border-gray-200 dark:border-gray-800 mt-2">
                    <strong>Issue:</strong> {ticket.issueDescription}
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-200 dark:border-gray-800/80">
                  <div className="flex justify-between">
                    <span>
                      Customer:{' '}
                      <strong className="text-gray-700 dark:text-gray-200">
                        {ticket.customerName}
                      </strong>
                    </span>
                    <span className="font-mono">{ticket.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Cost:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      ৳{ticket.estimatedCost?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance Paid:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      ৳{ticket.advancePaid?.toLocaleString()}
                    </span>
                  </div>
                  {ticket.technicianName && (
                    <div className="flex justify-between text-[11px] pt-1">
                      <span>Technician:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                        {ticket.technicianName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Status Buttons */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-1 text-[11px]">
                  {ticket.status === 'RECEIVED' && (
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({ id: ticket._id, status: 'INSPECTING' })
                      }
                      className="flex-1 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded font-medium"
                    >
                      Inspect
                    </button>
                  )}
                  {['INSPECTING', 'AWAITING_PARTS'].includes(ticket.status) && (
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({ id: ticket._id, status: 'REPAIRED' })
                      }
                      className="flex-1 py-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded font-medium"
                    >
                      Mark Repaired
                    </button>
                  )}
                  {ticket.status === 'REPAIRED' && (
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({ id: ticket._id, status: 'DELIVERED' })
                      }
                      className="flex-1 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 rounded font-medium"
                    >
                      Deliver
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {repairs.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Wrench className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No repair tickets yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Click "Create Repair Ticket" to get started
              </p>
            </div>
          )}
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md overflow-hidden shadow-2xl ${styled ? 'neu-card rounded-2xl' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl'}`}
          >
            <div
              className={`px-6 py-4 flex items-center justify-between ${styled ? '' : 'border-b border-gray-200 dark:border-gray-800'}`}
            >
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" /> New Repair Ticket
              </h3>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTicketMutation.mutate({
                  ...ticketForm,
                  estimatedCost: Number(ticketForm.estimatedCost),
                  advancePaid: Number(ticketForm.advancePaid) || 0,
                });
              }}
              className="p-6 space-y-3 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={ticketForm.customerName}
                  onChange={(e) => handleFormChange('customerName', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Customer Phone
                </label>
                <input
                  type="text"
                  required
                  value={ticketForm.customerPhone}
                  onChange={(e) => handleFormChange('customerPhone', e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Device Model
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketForm.deviceModel}
                    onChange={(e) => handleFormChange('deviceModel', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    IMEI / Serial
                  </label>
                  <input
                    type="text"
                    value={ticketForm.imeiOrSerial}
                    onChange={(e) => handleFormChange('imeiOrSerial', e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Problem Description
                </label>
                <textarea
                  required
                  rows={2}
                  value={ticketForm.issueDescription}
                  onChange={(e) => handleFormChange('issueDescription', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Estimated Cost (৳)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={ticketForm.estimatedCost}
                    onChange={(e) => handleFormChange('estimatedCost', e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Advance Deposit (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ticketForm.advancePaid}
                    onChange={(e) => handleFormChange('advancePaid', e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Technician
                </label>
                <input
                  type="text"
                  value={ticketForm.technicianName}
                  onChange={(e) => handleFormChange('technicianName', e.target.value)}
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={createTicketMutation.isPending}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all"
              >
                {createTicketMutation.isPending ? 'Creating...' : 'Create Repair Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
