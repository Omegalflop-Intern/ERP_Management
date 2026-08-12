import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  X,
  Phone,
  Mail,
  User,
  ChevronRight,
  Loader2,
  Check,
  ShieldCheck,
  Building,
  Trash2,
} from 'lucide-react';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

export default function SATickets() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [shopFilter, setShopFilter] = useState('');
  const [page, setPage] = useState(1);
  const [activeTicket, setActiveTicket] = useState(null);

  // Form State for update status
  const [updateStatus, setUpdateStatus] = useState('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updateError, setUpdateError] = useState('');

  // Fetch shops for filter dropdown
  const { data: shopsData } = useQuery({
    queryKey: ['sa-shops-list'],
    queryFn: async () => {
      const res = await api.get('/tenants');
      return res.data?.data || res.data || [];
    },
  });
  const shops = Array.isArray(shopsData) ? shopsData : [];

  // Fetch tickets for Super Admin
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['sa-tickets', page, statusFilter, priorityFilter, shopFilter, search],
    queryFn: async () => {
      const res = await api.get('/tickets/admin/all', {
        params: {
          page,
          limit: 15,
          status: statusFilter,
          priority: priorityFilter,
          tenantId: shopFilter || undefined,
          search,
        },
      });
      return res.data;
    },
    placeholderData: (prev) => prev,
  });

  const tickets = responseData?.data || [];
  const pagination = responseData?.pagination || {};

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status, resolutionNotes }) => {
      const res = await api.patch(`/tickets/${id}/status`, { status, resolutionNotes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sa-tickets']);
      setActiveTicket(null);
      setUpdateError('');
    },
    onError: (err) => {
      setUpdateError(err.response?.data?.message || 'Failed to update ticket status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/tickets/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sa-tickets']);
      setActiveTicket(null);
    },
  });

  const handleOpenReview = (t) => {
    setActiveTicket(t);
    setUpdateStatus(t.status === 'OPEN' ? 'RESOLVED' : t.status);
    setResolutionNotes(t.resolutionNotes || '');
    setUpdateError('');
  };

  const handleSaveStatus = (e) => {
    e.preventDefault();
    if (!activeTicket) return;
    statusMutation.mutate({
      id: activeTicket.id,
      status: updateStatus,
      resolutionNotes,
    });
  };

  const totalCount = pagination.total || tickets.length;
  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'URGENT':
        return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'HIGH':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'OPEN':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'CLOSED':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/20">
            <LifeBuoy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Shop Support Tickets</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Central helpdesk to review shop assistance requests, contact shop owners, and mark issues as resolved.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Tickets</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Open</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{openCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">In Progress</p>
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{inProgressCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Resolved</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{resolvedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ticket #, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <select
              value={shopFilter}
              onChange={(e) => {
                setShopFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Shops / Tenants</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.subdomain || 'shop'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-xs text-slate-500 mt-2">Loading shop tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <LifeBuoy className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No support tickets found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No support tickets match the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Shop / Tenant</th>
                  <th className="py-3 px-4">Ticket #</th>
                  <th className="py-3 px-4">Subject & Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {t.shopName || `Shop #${t.tenantId}`}
                          </div>
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                            {t.shopSubdomain ? `${t.shopSubdomain}.erp` : 'main'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {t.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{t.subject}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.category}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(t.status)}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenReview(t)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                            t.status === 'OPEN'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          Review & Resolve
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => confirmDelete('Delete Ticket?', () => deleteMutation.mutate(t.id), 'Are you sure you want to delete this ticket?')}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete ticket"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REVIEW & RESOLVE MODAL */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {activeTicket.shopName || `Shop #${activeTicket.tenantId}`}
                  </span>
                  <span className="text-xs text-blue-600 font-mono font-semibold">
                    ({activeTicket.shopSubdomain || 'main'})
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono font-bold text-slate-500 text-xs">{activeTicket.ticketNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(activeTicket.status)}`}>
                    {activeTicket.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(activeTicket.priority)}`}>
                    {activeTicket.priority} Priority
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {updateError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl">
                  {updateError}
                </div>
              )}

              {/* Ticket Subject & Meta */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Subject</span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{activeTicket.subject}</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block">Category:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{activeTicket.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Submitted By:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {activeTicket.createdByName || 'Shop Staff'} ({activeTicket.createdByEmail || 'N/A'})
                    </span>
                  </div>
                  {activeTicket.contactPhone && (
                    <div>
                      <span className="text-slate-400 block">Contact Phone:</span>
                      <a href={`tel:${activeTicket.contactPhone}`} className="font-bold text-blue-600 hover:underline">
                        {activeTicket.contactPhone}
                      </a>
                    </div>
                  )}
                  {activeTicket.contactEmail && (
                    <div>
                      <span className="text-slate-400 block">Contact Email:</span>
                      <a href={`mailto:${activeTicket.contactEmail}`} className="font-bold text-blue-600 hover:underline">
                        {activeTicket.contactEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Problem Description */}
              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                  Issue Description
                </label>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {activeTicket.description}
                </div>
              </div>

              {/* Status Selector */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Update Ticket Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="OPEN">OPEN (Under Review)</option>
                    <option value="IN_PROGRESS">IN PROGRESS (Working on fix)</option>
                    <option value="RESOLVED">RESOLVED (Issue Solved)</option>
                    <option value="CLOSED">CLOSED (Completed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resolution Notes / Response to Shop
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide resolution details or contact instructions for the shop owner/staff..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => confirmDelete('Delete Ticket?', () => deleteMutation.mutate(activeTicket.id), 'Are you sure you want to delete this ticket?')}
                  className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTicket(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={statusMutation.isLoading}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {statusMutation.isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Save & Update Status
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
