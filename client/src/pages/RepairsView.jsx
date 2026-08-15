import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
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
import React, { useMemo, useRef, useState } from 'react';
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
import api from '../lib/api';
import { confirmDelete } from '../lib/confirm';

const STATUSES = ['ALL', 'RECEIVED', 'INSPECTING', 'AWAITING_PARTS', 'REPAIRED', 'DELIVERED', 'CANCELLED'];

const statusConfig = {
  RECEIVED: {
    label: 'Received',
    color: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: Clock,
  },
  INSPECTING: {
    label: 'Inspecting',
    color: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: Wrench,
  },
  AWAITING_PARTS: {
    label: 'Awaiting Parts',
    color: 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    icon: AlertCircle,
  },
  REPAIRED: {
    label: 'Repaired (Ready)',
    color: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    icon: Check,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
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

  const { data: repairsData, isLoading, refetch } = useQuery({
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
    const active = repairs.filter((r) => ['RECEIVED', 'INSPECTING', 'AWAITING_PARTS'].includes(r.status)).length;
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
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tickets</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1.5 font-mono">
            {summary.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">{summary.active} currently in workshop</div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
            <Wrench className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Progress</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5 font-mono">
            {summary.active}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1 font-medium">Inspecting / Parts waiting</div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Repaired & Ready</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
            {summary.ready}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1 font-medium">Ready for customer pickup</div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service Billing Value</div>
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
            const dueAmount = Math.max(0, (Number(ticket.estimatedCost) || 0) - (Number(ticket.advancePaid) || 0));

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
                      onChange={(e) => updateStatusMutation.mutate({ id: ticket._id || ticket.id, status: e.target.value })}
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
                      <div className={`text-xs font-mono font-bold ${dueAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        ৳{dueAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                    Tech: <strong className="text-slate-600 dark:text-slate-300">{ticket.technicianName || 'Unassigned'}</strong>
                  </div>

                  <div className="flex items-center gap-1">
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

      {/* ── 3. VIEW & PRINT REPAIR RECEIPT MODAL ── */}
      {viewTicket && (
        <ViewRepairModal
          ticket={viewTicket}
          onClose={() => setViewTicket(null)}
          onStatusChange={(status) => {
            updateStatusMutation.mutate({ id: viewTicket._id || viewTicket.id, status });
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
  const [isQuickCustomer, setIsQuickCustomer] = useState(customers.length === 0 || !isEdit);

  const [form, setForm] = useState({
    customerName: initialData?.customerName || '',
    customerPhone: initialData?.customerPhone || '',
    customerEmail: initialData?.customerEmail || '',
    deviceModel: initialData?.deviceModel || '',
    imeiOrSerial: initialData?.imeiOrSerial || '',
    issueDescription: initialData?.issueDescription || '',
    estimatedCost: initialData?.estimatedCost ? String(initialData.estimatedCost) : '',
    advancePaid: initialData?.advancePaid ? String(initialData.advancePaid) : '',
    technicianName: initialData?.technicianName || (users[0]?.name || 'In-House Technician'),
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
      toast.success(isEdit ? 'Repair ticket updated!' : `Ticket ${ticket.ticketNumber} created successfully!`);
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save ticket');
    },
  });

  const handleCustomerSelect = (custId) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => String(c._id || c.id) === String(custId));
    if (found) {
      setForm((prev) => ({
        ...prev,
        customerName: found.name || '',
        customerPhone: found.phone || '',
        customerEmail: found.email || '',
      }));
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
      <DialogContent className="sm:max-w-2xl w-[94vw] max-h-[90vh] overflow-y-auto rounded-3xl p-0 border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#0f172a]">
        <div className="p-5 px-6 pr-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isEdit ? `Edit Repair Ticket #${initialData?.ticketNumber}` : 'Log New Repair Ticket'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Register customer device, link customer database, assign staff technician and set pricing.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Information (Linked with Customers Database) */}
          <div className="bg-slate-50/80 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Customer Details (Linked to CRM) *
              </span>
              {customers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsQuickCustomer(!isQuickCustomer)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-semibold"
                >
                  {isQuickCustomer ? 'Select Existing Customer' : '+ Type New Customer Details'}
                </button>
              )}
            </div>

            {!isQuickCustomer && customers.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-500">Pick from Existing Customer Directory</Label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-blue-500"
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
                <Label className="text-[11px] font-semibold">Customer Name *</Label>
                <Input
                  required
                  placeholder="e.g. Tanvir Hasan"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="h-9 text-xs rounded-xl mt-1 bg-white dark:bg-[#1e293b]"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">Phone Number *</Label>
                <Input
                  required
                  placeholder="e.g. 01712345678"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="h-9 text-xs rounded-xl mt-1 bg-white dark:bg-[#1e293b]"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">Email Address (Optional)</Label>
                <Input
                  type="email"
                  placeholder="customer@email.com"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  className="h-9 text-xs rounded-xl mt-1 bg-white dark:bg-[#1e293b]"
                />
              </div>
            </div>
          </div>

          {/* Device Details */}
          <div className="bg-slate-50/80 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" /> Device & Issue Details *
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-semibold">Device Model / Brand *</Label>
                <Input
                  required
                  placeholder="e.g. iPhone 13 Pro 128GB, Samsung S22"
                  value={form.deviceModel}
                  onChange={(e) => setForm({ ...form, deviceModel: e.target.value })}
                  className="h-9 text-xs rounded-xl mt-1 bg-white dark:bg-[#1e293b]"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">IMEI / Serial Number (Optional)</Label>
                <div className="relative mt-1">
                  <Input
                    placeholder="Type or select IMEI..."
                    value={form.imeiOrSerial}
                    onChange={(e) => setForm({ ...form, imeiOrSerial: e.target.value })}
                    className="h-9 text-xs rounded-xl font-mono bg-white dark:bg-[#1e293b]"
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
              <Label className="text-[11px] font-semibold">Problem / Issue Description *</Label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Display glass cracked, touch working, battery draining fast..."
                value={form.issueDescription}
                onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
                className="w-full mt-1 p-2.5 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Pricing & Technician Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50/80 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-600" /> Pricing & Advance
              </span>
              <div>
                <Label className="text-[11px] font-semibold">Estimated Repair Cost (৳)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.estimatedCost}
                  onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
                  className="h-9 text-xs font-mono font-bold rounded-xl mt-1 bg-white dark:bg-[#1e293b]"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">Advance Amount Paid (৳)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.advancePaid}
                  onChange={(e) => setForm({ ...form, advancePaid: e.target.value })}
                  className="h-9 text-xs font-mono font-bold text-emerald-600 rounded-xl mt-1 bg-white dark:bg-[#1e293b]"
                />
              </div>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" /> Technician & Status
              </span>

              {/* Technician Dropdown from Users & Staff */}
              <div>
                <Label className="text-[11px] font-semibold">Assigned Technician (Staff)</Label>
                <select
                  value={form.isCustomTech ? 'custom' : form.technicianName}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setForm({ ...form, isCustomTech: true, technicianName: '' });
                    } else {
                      setForm({ ...form, isCustomTech: false, technicianName: e.target.value });
                    }
                  }}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
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
                    className="h-8 text-xs rounded-xl mt-1.5 bg-white dark:bg-[#1e293b]"
                  />
                )}
              </div>

              <div>
                <Label className="text-[11px] font-semibold">Repair Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none"
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

          <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold gap-1.5 px-5"
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
function ViewRepairModal({ ticket, onClose, onStatusChange }) {
  const printRef = useRef(null);
  const dueAmount = Math.max(0, (Number(ticket.estimatedCost) || 0) - (Number(ticket.advancePaid) || 0));

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl w-[94vw] max-h-[90vh] overflow-y-auto rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#0f172a]">
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3 pr-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Repair Sheet #{ticket.ticketNumber}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Logged on {new Date(ticket.createdAt).toLocaleString('en-BD')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Printable Card Area */}
        <div ref={printRef} className="space-y-4 pt-2 text-xs">
          {/* Customer & Device Box */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Customer:</span>
              <strong className="text-slate-900 dark:text-slate-100 font-bold">{ticket.customerName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Phone:</span>
              <strong className="font-mono text-slate-900 dark:text-slate-100">{ticket.customerPhone}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200/60 dark:border-slate-800 pt-2">
              <span className="text-slate-400 font-medium">Device Model:</span>
              <strong className="text-slate-900 dark:text-slate-100">{ticket.deviceModel}</strong>
            </div>
            {ticket.imeiOrSerial && (
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">IMEI / Serial:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{ticket.imeiOrSerial}</span>
              </div>
            )}
          </div>

          {/* Fault Symptoms */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Fault Symptoms / Work Required</div>
            <p className="text-slate-800 dark:text-slate-200 font-medium">{ticket.issueDescription}</p>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span>Estimated Cost:</span>
              <strong className="font-mono font-bold">৳{Number(ticket.estimatedCost || 0).toLocaleString()}</strong>
            </div>
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Advance Paid:</span>
              <span className="font-mono font-bold">৳{Number(ticket.advancePaid || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className={dueAmount > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}>
                Remaining Due:
              </span>
              <span className={`font-mono ${dueAmount > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>
                ৳{dueAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Status Quick Bar */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold">Current Status:</span>
            <select
              value={ticket.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="text-xs font-bold px-3 py-1 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 focus:outline-none"
            >
              <option value="RECEIVED">Received</option>
              <option value="INSPECTING">Inspecting</option>
              <option value="AWAITING_PARTS">Awaiting Parts</option>
              <option value="REPAIRED">Repaired</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl text-xs gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print Job Sheet
          </Button>
          <Button type="button" onClick={onClose} size="sm" className="rounded-xl text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
