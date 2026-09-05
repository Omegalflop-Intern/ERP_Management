import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Edit2,
  Eye,
  FileText,
  Loader2,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Smartphone,
  Tag,
  Trash2,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import PageHeader from '../components/layout/PageHeader';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import EmptyState from '../components/ui/EmptyState';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import api, { getAssetUrl } from '../lib/api';
import { confirmDelete } from '../lib/confirm';
import { useActivePaymentMethods } from '../hooks';
import {
  useCompanyInfo,
  BarcodeCanvas,
  QRCodeCanvas,
  numberToWordsBD,
} from '../components/sales/Invoice';
import { executeClientPrint } from '../utils/invoiceGenerator';

const STATUSES = [
  'ALL',
  'RECEIVED',
  'INSPECTING',
  'AWAITING_PARTS',
  'REPAIRED',
  'DELIVERED',
  'CANCELLED',
];

const statusConfig = {
  RECEIVED: {
    label: 'Received',
    color:
      'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: Clock,
  },
  INSPECTING: {
    label: 'Inspecting',
    color:
      'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: Wrench,
  },
  AWAITING_PARTS: {
    label: 'Awaiting Parts',
    color:
      'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    icon: AlertCircle,
  },
  REPAIRED: {
    label: 'Repaired (Ready)',
    color:
      'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  DELIVERED: {
    label: 'Delivered',
    color:
      'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    icon: Check,
  },
  CANCELLED: {
    label: 'Cancelled',
    color:
      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    icon: X,
  },
};

export default function RepairsView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [viewTicket, setViewTicket] = useState(null);
  const [collectDueTicket, setCollectDueTicket] = useState(null);

  const {
    data: repairsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['repairs', search, statusFilter],
    queryFn: async () => {
      const { data } = await api.get('/repairs', {
        params: { search, status: statusFilter === 'ALL' ? '' : statusFilter, limit: 100 },
      });
      return data.data || [];
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['repairs-stats'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/repairs/stats');
        return data.data;
      } catch {
        return null;
      }
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-staff'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/users', { params: { limit: 100 } });
        return data.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/customers', { params: { limit: 300 } });
        return data.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: imeiData } = useQuery({
    queryKey: ['imei-list'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/imei', { params: { limit: 300 } });
        return data.data || [];
      } catch {
        return [];
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/repairs/${id}/status`, { status });
      return data.data;
    },
    onSuccess: (data) => {
      toast.success(`Repair #${data.ticketNumber} updated to ${data.status}`);
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['repairs-stats'] });
      if (viewTicket && (viewTicket._id === data._id || viewTicket.id === data.id)) {
        setViewTicket(data);
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/repairs/${id}`),
    onSuccess: () => {
      toast.success('Repair ticket deleted');
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['repairs-stats'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const handleDelete = async (ticket) => {
    const ok = await confirmDelete(`Repair Ticket ${ticket.ticketNumber}`);
    if (ok) {
      deleteMutation.mutate(ticket._id || ticket.id);
    }
  };

  const repairs = repairsData || [];
  const users = usersData || [];
  const customers = customersData || [];
  const imeis = imeiData || [];

  const summary = useMemo(() => {
    const total = repairs.length;
    const active = repairs.filter((r) =>
      ['RECEIVED', 'INSPECTING', 'AWAITING_PARTS'].includes(r.status)
    ).length;
    const ready = repairs.filter((r) => r.status === 'REPAIRED').length;
    const delivered = repairs.filter((r) => r.status === 'DELIVERED').length;
    const totalRevenue = repairs.reduce((sum, r) => sum + (Number(r.estimatedCost) || 0), 0);
    const collectedAdvance = repairs.reduce((sum, r) => sum + (Number(r.advancePaid) || 0), 0);

    return {
      total: statsData?.total ?? total,
      active: statsData?.active ?? active,
      ready,
      delivered: statsData?.delivered ?? delivered,
      totalRevenue: statsData?.totalRevenue ?? totalRevenue,
      collectedAdvance: statsData?.totalCollected ?? collectedAdvance,
    };
  }, [repairs, statsData]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repair & Service Management"
        subtitle="Log mobile repair tickets, link customer profiles, assign technicians from staff, track progress and print receipts."
        icon={Wrench}
        breadcrumbs={['Services & Repairs', 'Repair Tickets']}
        actions={
          <Button
            onClick={() => setShowNewTicketModal(true)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md text-xs font-semibold px-4 py-2"
          >
            <Plus className="w-4 h-4" /> Log Repair Ticket
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Tickets
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1.5 font-mono">
            {summary.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            {summary.active} currently in workshop
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
            <Wrench className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            In Progress
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5 font-mono">
            {summary.active}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1 font-medium">
            Inspecting / Parts waiting
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Repaired & Ready
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
            {summary.ready}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1 font-medium">
            Ready for customer pickup
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Service Billing Value
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1.5 font-mono">
            ৳{summary.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-600/80 mt-1 font-medium">
            Advance: ৳{summary.collectedAdvance.toLocaleString()}
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search ticket #, customer, phone, device..."
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
              {s === 'ALL' ? 'All Tickets' : s.replace(/_/g, ' ')}
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

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && repairs.length === 0 && (
        <EmptyState
          icon={Wrench}
          title="No Repair Tickets Found"
          description="Log device repairs, customer fault reports, technician assignments from staff, and cost estimates."
          action={
            <Button
              onClick={() => setShowNewTicketModal(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs"
            >
              <Plus className="w-4 h-4" /> Log First Repair Ticket
            </Button>
          }
        />
      )}

      {/* Tickets Grid */}
      {!isLoading && repairs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repairs.map((ticket) => {
            const sc = statusConfig[ticket.status] || statusConfig.RECEIVED;
            const dueAmount = Math.max(
              0,
              (Number(ticket.estimatedCost) || 0) - (Number(ticket.advancePaid) || 0)
            );

            return (
              <div
                key={ticket._id || ticket.id}
                className="p-5 bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400/50 dark:hover:border-blue-600/50 shadow-sm transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Ticket # & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {ticket.ticketNumber}
                    </span>

                    {/* Status Dropdown */}
                    <select
                      value={ticket.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          id: ticket._id || ticket.id,
                          status: e.target.value,
                        })
                      }
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl border appearance-none cursor-pointer focus:outline-none ${sc.color}`}
                    >
                      <option value="RECEIVED">Received</option>
                      <option value="INSPECTING">Inspecting</option>
                      <option value="AWAITING_PARTS">Awaiting Parts</option>
                      <option value="REPAIRED">Repaired</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  {/* Device & Issue Info */}
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate">{ticket.deviceModel}</span>
                    </div>
                    {ticket.imeiOrSerial && (
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        IMEI/SN: {ticket.imeiOrSerial}
                      </div>
                    )}
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 line-clamp-2">
                      {ticket.issueDescription || 'No issue description provided'}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[120px]">{ticket.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{ticket.customerPhone}</span>
                    </div>
                  </div>

                  {/* Financials Strip */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Estimated</div>
                      <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                        ৳{Number(ticket.estimatedCost || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Advance</div>
                      <div className="text-xs font-mono font-bold text-emerald-600">
                        ৳{Number(ticket.advancePaid || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Due</div>
                      <div
                        className={`text-xs font-mono font-bold ${dueAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}
                      >
                        ৳{dueAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                    Tech:{' '}
                    <strong className="text-slate-600 dark:text-slate-300">
                      {ticket.technicianName || 'Unassigned'}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1">
                    {dueAmount > 0 && (
                      <button
                        onClick={() => setCollectDueTicket(ticket)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-colors"
                        title="Collect Remaining Due Payment"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setViewTicket(ticket)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      title="View & Print Token"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingTicket(ticket)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition-colors"
                      title="Edit Ticket"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ticket)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
                      title="Delete Ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 1. LOG NEW REPAIR TICKET MODAL ── */}
      {showNewTicketModal && (
        <RepairTicketModal
          users={users}
          customers={customers}
          imeis={imeis}
          onClose={() => setShowNewTicketModal(false)}
          onSuccess={() => {
            setShowNewTicketModal(false);
            queryClient.invalidateQueries({ queryKey: ['repairs'] });
            queryClient.invalidateQueries({ queryKey: ['repairs-stats'] });
            queryClient.invalidateQueries({ queryKey: ['customers-list'] });
          }}
        />
      )}

      {/* ── 2. EDIT REPAIR TICKET MODAL ── */}
      {editingTicket && (
        <RepairTicketModal
          initialData={editingTicket}
          users={users}
          customers={customers}
          imeis={imeis}
          onClose={() => setEditingTicket(null)}
          onSuccess={() => {
            setEditingTicket(null);
            queryClient.invalidateQueries({ queryKey: ['repairs'] });
            queryClient.invalidateQueries({ queryKey: ['repairs-stats'] });
            queryClient.invalidateQueries({ queryKey: ['customers-list'] });
          }}
        />
      )}

      {/* ── 3. COLLECT REPAIR DUE MODAL ── */}
      {collectDueTicket && (
        <CollectRepairDueModal
          ticket={collectDueTicket}
          onClose={() => setCollectDueTicket(null)}
          onSuccess={() => {
            setCollectDueTicket(null);
            queryClient.invalidateQueries({ queryKey: ['repairs'] });
            queryClient.invalidateQueries({ queryKey: ['repairs-stats'] });
            queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
            queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
          }}
        />
      )}

      {/* ── 4. VIEW & PRINT REPAIR RECEIPT MODAL ── */}
      {viewTicket && (
        <ViewRepairModal
          ticket={viewTicket}
          onClose={() => setViewTicket(null)}
          onStatusChange={(status) => {
            updateStatusMutation.mutate({ id: viewTicket._id || viewTicket.id, status });
          }}
          onCollectDue={() => {
            const cur = viewTicket;
            setViewTicket(null);
            setCollectDueTicket(cur);
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// MODAL: CREATE / EDIT REPAIR TICKET (WITH REAL USERS & CUSTOMER LINKUP)
// ----------------------------------------------------------------------
function RepairTicketModal({ initialData, users, customers, imeis, onClose, onSuccess }) {
  const isEdit = Boolean(initialData);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isQuickCustomer, setIsQuickCustomer] = useState(false);
  const [customerDevices, setCustomerDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const [form, setForm] = useState({
    customerName: initialData?.customerName || '',
    customerPhone: initialData?.customerPhone || '',
    customerEmail: initialData?.customerEmail || '',
    deviceModel: initialData?.deviceModel || '',
    imeiOrSerial: initialData?.imeiOrSerial || '',
    issueDescription: initialData?.issueDescription || '',
    estimatedCost: initialData?.estimatedCost ? String(initialData.estimatedCost) : '',
    advancePaid: initialData?.advancePaid ? String(initialData.advancePaid) : '',
    technicianName: initialData?.technicianName || users[0]?.name || 'In-House Technician',
    isCustomTech: false,
    status: initialData?.status || 'RECEIVED',
  });

  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (isEdit) {
        const { data } = await api.put(`/repairs/${initialData._id || initialData.id}`, payload);
        return data.data;
      }
      const { data } = await api.post('/repairs', payload);
      return data.data;
    },
    onSuccess: (ticket) => {
      toast.success(
        isEdit ? 'Repair ticket updated!' : `Ticket ${ticket.ticketNumber} created successfully!`
      );
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save ticket');
    },
  });

  const handleCustomerSelect = async (custId) => {
    setSelectedCustomerId(custId);
    if (!custId) {
      setCustomerDevices([]);
      return;
    }
    const found = customers.find((c) => String(c._id || c.id) === String(custId));
    if (found) {
      setForm((prev) => ({
        ...prev,
        customerName: found.name || '',
        customerPhone: found.phone || '',
        customerEmail: found.email || '',
      }));

      // Auto-fetch customer's purchase history & devices
      try {
        setLoadingDevices(true);
        const res = await api.get(`/customers/${found._id || found.id}/history`);
        const historySales = res.data?.data?.sales || [];
        const devices = [];
        historySales.forEach((s) => {
          (s.lineItems || []).forEach((item) => {
            devices.push({
              model: item.description || item.name || 'Purchased Device',
              imei: item.imeiOrSerial || '',
              invoice: s.invoiceNumber,
              date: s.createdAt,
            });
          });
        });

        // Also check if any serialized items in `imeis` match this customer
        (imeis || []).forEach((im) => {
          if (im.customerName === found.name || im.customerPhone === found.phone) {
            if (!devices.some((d) => d.imei === im.imeiOrSerial)) {
              devices.unshift({
                model: im.productName || im.product?.name || 'Device',
                imei: im.imeiOrSerial,
                invoice: 'IMEI Record',
                date: im.createdAt,
              });
            }
          }
        });

        setCustomerDevices(devices);

        // If customer has purchased devices, auto-fill the latest one!
        if (devices.length > 0 && !isEdit) {
          const latest = devices[0];
          setForm((prev) => ({
            ...prev,
            deviceModel: latest.model,
            imeiOrSerial: latest.imei || prev.imeiOrSerial,
          }));
          toast.success(
            `Auto-linked device: ${latest.model}${latest.imei ? ` (${latest.imei})` : ''}`
          );
        }
      } catch (err) {
        console.error('Failed to fetch customer device history', err);
      } finally {
        setLoadingDevices(false);
      }
    }
  };

  const handleImeiSelect = (imeiVal) => {
    setForm((prev) => {
      const found = imeis.find((i) => i.imeiOrSerial === imeiVal);
      return {
        ...prev,
        imeiOrSerial: imeiVal,
        deviceModel: found?.productName || found?.product?.name || prev.deviceModel,
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.deviceModel.trim()) {
      toast.error('Please fill in Customer Name, Phone, and Device Model');
      return;
    }

    mutation.mutate({
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail.trim() || undefined,
      deviceModel: form.deviceModel.trim(),
      imeiOrSerial: form.imeiOrSerial.trim() || undefined,
      issueDescription: form.issueDescription.trim() || 'General Inspection',
      estimatedCost: Number(form.estimatedCost || 0),
      advancePaid: Number(form.advancePaid || 0),
      technicianName: form.technicianName.trim() || 'In-House Technician',
      status: form.status,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[92vh] overflow-y-auto rounded-3xl p-0 border border-slate-300 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">
        <div className="p-5 px-6 pr-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isEdit
                  ? `Edit Repair Ticket #${initialData?.ticketNumber}`
                  : 'Log New Repair Ticket'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                Register customer device, link customer database, assign staff technician and set
                pricing.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Information (Linked with Customers Database) */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Customer Details
                (Linked to CRM) *
              </span>
              {customers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsQuickCustomer(!isQuickCustomer)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-bold"
                >
                  {isQuickCustomer
                    ? 'Select from Existing Customer List'
                    : '+ Type New Customer Details'}
                </button>
              )}
            </div>

            {!isQuickCustomer && customers.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Pick Existing Customer to Auto-Find Devices
                  </label>
                  {loadingDevices && (
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 animate-pulse font-bold">
                      Finding customer devices...
                    </span>
                  )}
                </div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-[#1e293b] border border-blue-300 dark:border-blue-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                >
                  <option value="">-- Choose Existing Customer --</option>
                  {customers.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name} ({c.phone}) {c.address ? `— ${c.address}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Customer Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Tanvir Hasan"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="h-10 text-xs rounded-xl mt-1.5 bg-white dark:bg-[#1e293b] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold placeholder:text-slate-400 shadow-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Phone Number *
                </label>
                <Input
                  required
                  placeholder="e.g. 01712345678"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="h-10 text-xs rounded-xl mt-1.5 bg-white dark:bg-[#1e293b] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold placeholder:text-slate-400 shadow-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Email Address (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="customer@email.com"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  className="h-10 text-xs rounded-xl mt-1.5 bg-white dark:bg-[#1e293b] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold placeholder:text-slate-400 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Device Details */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Device & Issue
              Details *
            </span>

            {/* Auto-found Customer Devices (Chips) */}
            {customerDevices.length > 0 && (
              <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> Customer's Purchased Devices (
                    {customerDevices.length})
                  </span>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                    Click device to auto-fill
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customerDevices.map((dev, idx) => {
                    const isSelected =
                      form.deviceModel === dev.model &&
                      (!dev.imei || form.imeiOrSerial === dev.imei);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            deviceModel: dev.model,
                            imeiOrSerial: dev.imei || prev.imeiOrSerial,
                          }));
                          toast.info(`Selected ${dev.model}`);
                        }}
                        className={`text-left px-3 py-1.5 rounded-xl text-xs transition border cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-blue-200 dark:border-blue-800 hover:border-blue-400 shadow-xs'
                        }`}
                      >
                        <div className="font-semibold truncate max-w-[220px]">{dev.model}</div>
                        <div
                          className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                          {dev.imei ? `IMEI: ${dev.imei}` : `Inv: ${dev.invoice}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Device Model / Brand *
                </label>
                <Input
                  required
                  placeholder="e.g. iPhone 13 Pro 128GB, Samsung S22"
                  value={form.deviceModel}
                  onChange={(e) => setForm({ ...form, deviceModel: e.target.value })}
                  className="h-10 text-xs rounded-xl mt-1.5 bg-white dark:bg-[#1e293b] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold placeholder:text-slate-400 shadow-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  IMEI / Serial Number (Optional)
                </label>
                <div className="relative mt-1.5">
                  <Input
                    placeholder="Type or select IMEI..."
                    value={form.imeiOrSerial}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleImeiSelect(val);
                    }}
                    className="h-10 text-xs rounded-xl font-mono bg-white dark:bg-[#1e293b] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold placeholder:text-slate-400 shadow-xs"
                    list="imei-options"
                  />
                  <datalist id="imei-options">
                    {imeis.map((item, idx) => (
                      <option key={idx} value={item.imeiOrSerial}>
                        {item.productName || item.product?.name || 'Device'}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Problem / Issue Description *
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Display glass cracked, touch working, battery draining fast..."
                value={form.issueDescription}
                onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
                className="w-full mt-1.5 p-3 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
              />
            </div>
          </div>

          {/* Pricing & Technician Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Pricing &
                Advance
              </span>
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Estimated Repair Cost (৳)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.estimatedCost}
                  onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
                  className="h-10 text-xs font-mono font-bold rounded-xl mt-1.5 bg-white dark:bg-[#1e293b] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Advance Amount Paid (৳)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.advancePaid}
                  onChange={(e) => setForm({ ...form, advancePaid: e.target.value })}
                  className="h-10 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 rounded-xl mt-1.5 bg-white dark:bg-[#1e293b] border-slate-300 dark:border-slate-700 shadow-xs"
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Technician &
                Status
              </span>

              {/* Technician Dropdown from Users & Staff */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Assigned Technician (Staff)
                </label>
                <select
                  value={form.isCustomTech ? 'custom' : form.technicianName}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setForm({ ...form, isCustomTech: true, technicianName: '' });
                    } else {
                      setForm({ ...form, isCustomTech: false, technicianName: e.target.value });
                    }
                  }}
                  className="w-full h-10 mt-1.5 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 shadow-xs"
                >
                  <optgroup label="Shop Users & Staff">
                    {users.map((u) => (
                      <option key={u._id || u.id} value={u.name}>
                        {u.name} {u.role?.name ? `(${u.role.name})` : ''}
                      </option>
                    ))}
                  </optgroup>
                  <option value="custom">+ Assign Other / External Technician...</option>
                </select>

                {form.isCustomTech && (
                  <Input
                    required
                    placeholder="Enter technician name..."
                    value={form.technicianName}
                    onChange={(e) => setForm({ ...form, technicianName: e.target.value })}
                    className="h-10 text-xs rounded-xl mt-2 bg-white dark:bg-[#1e293b] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Repair Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 mt-1.5 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 shadow-xs"
                >
                  <option value="RECEIVED">Received</option>
                  <option value="INSPECTING">Inspecting</option>
                  <option value="AWAITING_PARTS">Awaiting Parts</option>
                  <option value="REPAIRED">Repaired (Ready)</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold gap-1.5 px-5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update Ticket' : 'Create Repair Ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// MODAL: VIEW & PRINT REPAIR RECEIPT / JOB SHEET
// ----------------------------------------------------------------------
function ViewRepairModal({ ticket, onClose, onStatusChange, onCollectDue }) {
  const [printSize, setPrintSize] = useState('a4');
  const printRef = useRef(null);
  const companyInfo = useCompanyInfo();

  const dueAmount = Math.max(
    0,
    (Number(ticket.estimatedCost) || 0) - (Number(ticket.advancePaid) || 0)
  );

  const handlePrint = () => {
    executeClientPrint(printRef.current, `Repair-${ticket.ticketNumber}`, printSize);
  };

  const ticketDate = ticket.createdAt ? new Date(ticket.createdAt) : new Date();

  const getStatusBadge = (st) => {
    switch (st) {
      case 'DELIVERED':
        return { label: 'DELIVERED', color: 'border-emerald-600 text-emerald-700 bg-emerald-50' };
      case 'REPAIRED':
        return { label: 'REPAIRED / READY', color: 'border-blue-600 text-blue-700 bg-blue-50' };
      case 'INSPECTING':
        return { label: 'INSPECTING', color: 'border-indigo-600 text-indigo-700 bg-indigo-50' };
      case 'AWAITING_PARTS':
        return { label: 'AWAITING PARTS', color: 'border-amber-600 text-amber-700 bg-amber-50' };
      case 'CANCELLED':
        return { label: 'CANCELLED', color: 'border-rose-600 text-rose-700 bg-rose-50' };
      default:
        return { label: 'RECEIVED INTAKE', color: 'border-slate-600 text-slate-700 bg-slate-50' };
    }
  };

  const statusBadge = getStatusBadge(ticket.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar */}
        <div className="p-4 sm:px-6 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/15 text-blue-400 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Repair Service Sheet & Invoice
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-blue-950 text-blue-400 border border-blue-800">
                  #{ticket.ticketNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Logged on {ticketDate.toLocaleDateString('en-BD', { month: 'short', day: '2-digit', year: 'numeric' })} • {ticket.customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Status Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={ticket.status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="text-xs font-bold text-white bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="RECEIVED">Received</option>
                <option value="INSPECTING">Inspecting</option>
                <option value="AWAITING_PARTS">Awaiting Parts</option>
                <option value="REPAIRED">Repaired</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintSize('a4')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  printSize === 'a4'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> A4 Sheet
              </button>
              <button
                type="button"
                onClick={() => setPrintSize('thermal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  printSize === 'thermal'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> POS 80mm
              </button>
            </div>

            {dueAmount > 0 && onCollectDue && (
              <button
                type="button"
                onClick={onCollectDue}
                className="flex items-center gap-1.5 h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 shrink-0"
              >
                <CreditCard className="w-4 h-4" /> Collect Due (৳{dueAmount.toLocaleString()})
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 shrink-0"
            >
              <Printer className="w-4 h-4" /> Print Sheet
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950/60 flex justify-center print:p-0 print:bg-white">
          {printSize === 'a4' ? (
            <div
              ref={printRef}
              data-printable="true"
              className="printable-invoice-container printable-repair-sheet bg-white text-slate-900 p-4 sm:p-6 md:p-8 w-full max-w-[210mm] min-h-[276mm] mx-auto flex flex-col justify-between shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-2 sm:print:p-4 print:max-w-none print:w-full print:min-h-[276mm] print:flex print:flex-col print:justify-between"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              <div>
                {/* 1. BRANDING & HEADER */}
                <div className="flex justify-between items-start mb-3 print:break-inside-avoid">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      {companyInfo.logo && (
                        <img
                          src={getAssetUrl(companyInfo.logo)}
                          alt="Logo"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          className="h-8 w-auto max-w-[80px] object-contain flex-shrink-0"
                        />
                      )}
                      <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                          {companyInfo.name}
                        </h1>
                        {companyInfo.slogan && (
                          <p className="text-xs font-medium text-slate-500 mt-0.5">{companyInfo.slogan}</p>
                        )}
                      </div>
                    </div>
                    {companyInfo.address && (
                      <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                        {companyInfo.address}
                      </p>
                    )}
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-2 gap-y-0.5 pt-0.5">
                      {companyInfo.phone && (
                        <span>
                          <strong>Hotline:</strong> {companyInfo.phone}
                        </span>
                      )}
                      {companyInfo.email && (
                        <>
                          <span>•</span>
                          <span>
                            <strong>Email:</strong> {companyInfo.email}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end space-y-1">
                    <div className="text-sm font-black tracking-wider uppercase text-blue-700 border-b-2 border-slate-900 pb-0.5 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-blue-700 inline" />
                      REPAIR JOB SHEET &amp; INVOICE
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Job Ticket No
                      </p>
                      <p className="text-lg font-mono font-bold text-slate-900 tracking-tight">
                        #{ticket.ticketNumber}
                      </p>
                    </div>
                    <div className="text-xs text-slate-600 leading-tight space-y-0.5">
                      <p>
                        <strong>Date:</strong>{' '}
                        {ticketDate.toLocaleDateString('en-BD', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                      <p>
                        <strong>Time:</strong>{' '}
                        {ticketDate.toLocaleTimeString('en-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {ticket.technicianName && (
                        <p className="text-xs font-semibold text-slate-700">
                          Technician: {ticket.technicianName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="border-t-2 border-slate-900 my-3" />

                {/* 2. CUSTOMER & DEVICE INFORMATION */}
                <div className="grid grid-cols-12 gap-4 mb-4 pb-2 border-b border-slate-200 print:break-inside-avoid">
                  {/* Customer Information */}
                  <div className="col-span-7 space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center gap-1">
                      <User className="w-3 h-3 text-blue-600 inline" /> Customer Information
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm">{ticket.customerName}</p>
                    <p className="text-xs text-slate-600 font-mono">Mobile: {ticket.customerPhone}</p>
                    {ticket.customerEmail && (
                      <p className="text-xs text-slate-500">Email: {ticket.customerEmail}</p>
                    )}
                  </div>

                  {/* Device Specification & Status */}
                  <div className="col-span-5 flex flex-col justify-between items-end text-right">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center justify-end gap-1">
                        <Smartphone className="w-3 h-3 text-blue-600 inline" /> Device Under Repair
                      </span>
                      <p className="font-bold text-slate-900 text-xs">{ticket.deviceModel}</p>
                      {ticket.imeiOrSerial && (
                        <p className="text-[11px] font-mono font-bold text-purple-700">
                          IMEI/Serial: {ticket.imeiOrSerial}
                        </p>
                      )}
                    </div>

                    <div
                      className={`border-2 ${statusBadge.color} font-black text-xs px-3.5 py-1 rounded uppercase tracking-wider text-center mt-2`}
                    >
                      {statusBadge.label}
                    </div>
                  </div>
                </div>

                {/* 3. REPORTED SYMPTOMS & TECHNICAL DIAGNOSIS */}
                <div className="space-y-3 mb-4 print:break-inside-avoid">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      Reported Issue &amp; Fault Symptoms:
                    </span>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                      {ticket.issueDescription || 'No description provided'}
                    </p>
                  </div>

                  {ticket.notes && (
                    <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200/70 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 block">
                        Technician Internal Remarks &amp; Diagnostics:
                      </span>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-blue-100">
                        {ticket.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. FINANCIAL BREAKDOWN & PAYMENT STATUS */}
                <div className="grid grid-cols-12 gap-6 mb-4 pt-2 border-t border-slate-200 print:break-inside-avoid">
                  <div className="col-span-7 space-y-3">
                    <div>
                      <span className="font-extrabold uppercase text-slate-400 text-[9px] block mb-0.5">
                        Amount In Words
                      </span>
                      <p className="font-bold text-slate-900 italic text-xs leading-snug">
                        {numberToWordsBD(ticket.estimatedCost || 0)}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-0.5">
                      <span className="font-bold text-slate-700 uppercase text-[9px] block">
                        Service Guarantee Notice:
                      </span>
                      <p className="text-[10px] text-slate-500 leading-snug">
                        • Replaced hardware components carry a 30-day warranty against manufacturer defects.
                      </p>
                      <p className="text-[10px] text-slate-500 leading-snug">
                        • Omni-Manage and the service center are not liable for user data loss. Back up devices regularly.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="bg-white p-1 rounded border border-slate-200 shrink-0">
                        <QRCodeCanvas
                          value={`TICKET: ${ticket.ticketNumber} | Device: ${ticket.deviceModel} | Due: Tk ${dueAmount} | Status: ${ticket.status}`}
                          size={56}
                        />
                      </div>
                      <div className="shrink-0 overflow-hidden">
                        <BarcodeCanvas value={String(ticket.ticketNumber)} width={1.2} height={26} />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-5 space-y-1 text-xs">
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Estimated Service Cost:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        ৳{Number(ticket.estimatedCost || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 text-emerald-700 font-semibold border-t border-slate-200">
                      <span>Advance Deposited:</span>
                      <span className="font-mono font-bold">
                        ৳{Number(ticket.advancePaid || 0).toLocaleString()}
                      </span>
                    </div>

                    {dueAmount > 0 ? (
                      <div className="flex justify-between py-1 text-rose-600 font-bold bg-rose-50 px-2 rounded border border-rose-200">
                        <span>Remaining Due Balance:</span>
                        <span className="font-mono text-sm">৳{dueAmount.toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between py-1 text-emerald-700 font-bold bg-emerald-50 px-2 rounded border border-emerald-200">
                        <span>Settlement Status:</span>
                        <span className="font-mono">PAID IN FULL (৳0 DUE)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. FOOTER & SIGNATURES */}
              <div className="print:break-inside-avoid">
                <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-200 text-center text-xs">
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
                      Customer Signature
                    </div>
                    <p className="text-[10px] text-slate-400">Device Received / Accepted</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
                      Service Technician / Authority
                    </div>
                    <p className="text-[10px] text-slate-400">Tested, Verified & Released</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 mt-3 border-t border-slate-100">
                  <p>
                    Omni-Manage ERP Repair Solutions • Generated on {new Date().toLocaleString('en-BD')}
                  </p>
                  <p>Official Service Job Sheet</p>
                </div>
              </div>
            </div>
          ) : (
            /* POS 80mm Thermal Receipt Format */
            <div
              ref={printRef}
              data-printable="true"
              id="printable-receipt"
              className="printable-invoice-container bg-white text-slate-900 p-4 w-[80mm] rounded-lg shadow-xl text-xs flex flex-col justify-between print:shadow-none print:p-2 print:w-full"
              style={{ fontFamily: 'monospace' }}
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <h2 className="font-bold text-sm uppercase">{companyInfo.name}</h2>
                <p className="text-[10px]">{companyInfo.address}</p>
                <p className="text-[10px]">Tel: {companyInfo.phone}</p>
                <div className="my-1.5 font-bold uppercase text-[11px] bg-slate-900 text-white py-0.5 rounded">
                  REPAIR JOB TICKET
                </div>
                <p className="font-bold text-xs">#{ticket.ticketNumber}</p>
                <p className="text-[10px]">{ticketDate.toLocaleDateString('en-BD')}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <p>
                  <strong>CUSTOMER:</strong> {ticket.customerName}
                </p>
                <p>
                  <strong>PHONE:</strong> {ticket.customerPhone}
                </p>
                <p>
                  <strong>DEVICE:</strong> {ticket.deviceModel}
                </p>
                {ticket.imeiOrSerial && (
                  <p>
                    <strong>IMEI:</strong> {ticket.imeiOrSerial}
                  </p>
                )}
                <p>
                  <strong>STATUS:</strong> {ticket.status}
                </p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px]">
                <p className="font-bold">FAULT:</p>
                <p>{ticket.issueDescription}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Est. Cost:</span>
                  <span className="font-bold">৳{Number(ticket.estimatedCost || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Advance:</span>
                  <span>৳{Number(ticket.advancePaid || 0).toLocaleString()}</span>
                </div>
                {dueAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Due:</span>
                    <span>৳{dueAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-6 pb-2 text-center text-[10px] space-y-4">
                <div className="border-t border-slate-400 pt-1">Customer Signature</div>
                <p className="text-[9px] text-slate-400">Please produce receipt upon collection</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// MODAL: COLLECT REPAIR DUE PAYMENT
// ----------------------------------------------------------------------
function CollectRepairDueModal({ ticket, onClose, onSuccess }) {
  const due = Math.max(0, (Number(ticket.estimatedCost) || 0) - (Number(ticket.advancePaid) || 0));
  const [amount, setAmount] = useState(due);
  const activeMethods = useActivePaymentMethods();
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (activeMethods.methods && activeMethods.methods.length > 0) {
      if (!activeMethods.methods.some((m) => m.id === paymentMethod)) {
        setPaymentMethod(activeMethods.methods[0].id);
      }
    }
  }, [activeMethods.methods, paymentMethod]);

  const mutation = useMutation({
    mutationFn: async (payload) =>
      api.post(`/repairs/${ticket._id || ticket.id}/collect-due`, payload),
    onSuccess: () => {
      toast.success(
        `Repair due collection of ৳${Number(amount).toLocaleString()} recorded successfully!`
      );
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to collect due payment');
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
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Collect Repair Due
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ticket: {ticket.ticketNumber} — {ticket.customerName || 'Customer'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span>Estimated Cost:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                ৳{(Number(ticket.estimatedCost) || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span>Advance Paid:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ৳{(Number(ticket.advancePaid) || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs pt-1.5 border-t border-slate-200 dark:border-slate-700/80">
              <span className="font-bold text-slate-800 dark:text-slate-200">Remaining Due:</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-base">
                ৳{due.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Collection Amount (৳) *
              </Label>
              <button
                type="button"
                onClick={() => setAmount(due)}
                className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Full Due (৳{due.toLocaleString()})
              </button>
            </div>
            <Input
              type="number"
              min="1"
              max={due > 0 ? due : undefined}
              required
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11 text-base font-mono font-bold rounded-xl bg-white dark:bg-[#1e293b]"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Payment Method *
            </Label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              {(activeMethods.methods || []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Notes (Optional)
            </Label>
            <Input
              placeholder="e.g. Due collected upon device delivery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 text-xs rounded-xl bg-white dark:bg-[#1e293b]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 px-5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || Number(amount) <= 0}
              className="h-11 px-6 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Confirm Collection (৳{Number(amount || 0).toLocaleString()})
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
