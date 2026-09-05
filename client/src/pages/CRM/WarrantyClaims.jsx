import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  Printer,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import WarrantyClaimSlipModal from '../../components/crm/WarrantyClaimSlipModal';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  approved: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  rejected: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  completed: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
};

export default function WarrantyClaims() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewClaim, setViewClaim] = useState(null);
  const [printClaim, setPrintClaim] = useState(null);
  const { styled } = useTheme();
  const queryClient = useQueryClient();

  const { data: empData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { limit: 200 } });
      return res.data?.data || [];
    },
  });

  const { data: imeiData } = useQuery({
    queryKey: ['imei-list-warranty'],
    queryFn: async () => {
      const res = await api.get('/inventory', { params: { limit: 200, status: 'Sold' } });
      return res.data?.data || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['warranty-claims', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/warranties', {
        params: { search, status: statusFilter, limit: 100 },
      });
      return res.data;
    },
  });

  const claims = data?.data || [];
  const customers = empData || [];
  const imeis = imeiData || [];
  const totalCount = claims.length;
  const pending = claims.filter((c) => c.status === 'pending').length;
  const approved = claims.filter((c) => c.status === 'approved').length;
  const completed = claims.filter((c) => c.status === 'completed').length;
  const rejected = claims.filter((c) => c.status === 'rejected').length;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, resolution }) =>
      api.put(`/warranties/${id}`, { status, resolution }),
    onSuccess: (_, vars) => {
      toast.success(`Claim status updated to ${vars.status.toUpperCase()}`);
      queryClient.invalidateQueries(['warranty-claims']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update claim'),
  });

  const cardClass = styled
    ? 'neu-card p-3 sm:p-4 cursor-pointer transition-all'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 cursor-pointer hover:border-[#2563EB]/40 transition-all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Warranty Claims</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track, approve, print tokens, and resolve customer warranty claims in 1-click
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg text-sm transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" /> New Claim
        </button>
      </div>

      {/* Top Filter & Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Pending Review',
            key: 'pending',
            value: pending,
            icon: Clock,
            color: 'text-amber-600 dark:text-amber-400',
            activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
          },
          {
            label: 'Approved (In Service)',
            key: 'approved',
            value: approved,
            icon: RefreshCw,
            color: 'text-blue-600 dark:text-blue-400',
            activeBorder: 'border-blue-500 ring-2 ring-blue-500/20',
          },
          {
            label: 'Completed',
            key: 'completed',
            value: completed,
            icon: CheckCircle,
            color: 'text-emerald-600 dark:text-emerald-400',
            activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
          },
          {
            label: 'Rejected',
            key: 'rejected',
            value: rejected,
            icon: XCircle,
            color: 'text-rose-600 dark:text-rose-400',
            activeBorder: 'border-rose-500 ring-2 ring-rose-500/20',
          },
        ].map((s) => {
          const isSelected = statusFilter === s.key;
          return (
            <div
              key={s.label}
              onClick={() => setStatusFilter(isSelected ? '' : s.key)}
              className={`${cardClass} ${isSelected ? s.activeBorder : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                  {s.label}
                </span>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-baseline justify-between">
                <span>
                  {isLoading ? (
                    <div className="h-7 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  ) : (
                    s.value
                  )}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-bold text-[#2563EB] dark:text-blue-400 uppercase">
                    Filtering
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[240px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer name, phone, invoice, IMEI, product..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">All Statuses ({totalCount})</option>
              <option value="pending">Pending Review ({pending})</option>
              <option value="approved">Approved / In-Service ({approved})</option>
              <option value="completed">Completed ({completed})</option>
              <option value="rejected">Rejected ({rejected})</option>
            </select>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter('')}
                className="px-2.5 py-2 text-xs font-semibold text-gray-500 hover:text-red-500 bg-gray-100 dark:bg-gray-800 rounded-lg"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left bg-gray-50/70 dark:bg-gray-900/50">
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Customer
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Product / Device
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                  Invoice
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  Claim Type
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                  Issue / Defect
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-right">
                  Quick Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                    No warranty claims found
                  </td>
                </tr>
              ) : (
                claims.map((cl) => {
                  const pName = cl.notes?.startsWith('Item:')
                    ? cl.notes.replace(/^Item:\s*/i, '')
                    : cl.notes?.startsWith('Sold via')
                      ? cl.notes.split('—')[0]
                      : cl.imei?.productId?.name || 'Device / Accessory';
                  const invNum =
                    cl.invoiceRef?.invoiceNumber || cl.notes?.match(/INV-[\w-]+/)?.[0] || '—';

                  return (
                    <tr
                      key={cl._id}
                      className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                          {cl.customer?.name || 'Customer'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {cl.customer?.phone || 'No phone'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                          {pName}
                        </div>
                        <div className="mt-0.5">
                          {cl.imei?.imeiOrSerial ? (
                            <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                              IMEI: {cl.imei.imeiOrSerial}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-sans font-semibold">
                              Non-IMEI Item
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {invNum}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="px-2 py-0.5 text-xs rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                          {cl.claimType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell max-w-[200px] truncate text-xs">
                        {cl.description}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-bold capitalize inline-flex items-center gap-1 ${STATUS_COLORS[cl.status] || ''}`}
                        >
                          {cl.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {cl.status === 'pending' && <Clock className="w-3 h-3" />}
                          {cl.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 1-Click Inline Status Triggers */}
                          {cl.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: cl._id,
                                    status: 'approved',
                                    resolution: 'Approved for warranty service',
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="px-2 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-xs"
                                title="1-Click Approve"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: cl._id,
                                    status: 'rejected',
                                    resolution: 'Warranty void or out of scope',
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="px-2 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all shadow-xs"
                                title="1-Click Reject"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {cl.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: cl._id,
                                  status: 'completed',
                                  resolution: 'Warranty service completed',
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-xs"
                              title="Mark Completed"
                            >
                              Complete
                            </button>
                          )}

                          {/* Print Token button */}
                          <button
                            type="button"
                            onClick={() => setPrintClaim(cl)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 transition-colors"
                            title="Print Warranty Claim Slip Token"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* View details / Edit modal */}
                          <button
                            type="button"
                            onClick={() => setViewClaim(cl)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600 border border-gray-200 dark:border-gray-700 transition-colors"
                            title="View Full Claim Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

      {showForm && (
        <WarrantyClaimModal
          customers={customers}
          imeis={imeis}
          onClose={() => setShowForm(false)}
        />
      )}
      {viewClaim && (
        <ClaimDetailModal
          claim={viewClaim}
          onPrint={() => {
            const current = viewClaim;
            setViewClaim(null);
            setPrintClaim(current);
          }}
          onClose={() => setViewClaim(null)}
        />
      )}
      {printClaim && (
        <WarrantyClaimSlipModal claim={printClaim} onClose={() => setPrintClaim(null)} />
      )}
    </div>
  );
}

function WarrantyClaimModal({ customers, imeis, onClose }) {
  const queryClient = useQueryClient();
  const [hasImei, setHasImei] = useState(true);
  const [selectedItemKey, setSelectedItemKey] = useState('');
  const [form, setForm] = useState({
    customer: '',
    imei: '',
    productName: '',
    invoiceRef: '',
    claimType: 'repair',
    description: '',
    notes: '',
  });

  // Query customer's actual purchased items (Retail & Wholesale orders)
  const { data: customerItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['customer-purchased-items', form.customer],
    queryFn: async () => {
      if (!form.customer) return [];
      try {
        const res = await api.get(`/warranties/customer/${form.customer}/purchased-items`);
        return res.data?.data || [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(form.customer),
  });

  const handleSelectCustomer = (customerId) => {
    setSelectedItemKey('');
    setForm({
      ...form,
      customer: customerId,
      imei: '',
      productName: '',
      invoiceRef: '',
    });
  };

  const handleSelectPurchasedItem = (item) => {
    setSelectedItemKey(item.id);
    if (item.hasImei && item.imeiId) {
      setHasImei(true);
      setForm((prev) => ({
        ...prev,
        imei: String(item.imeiId),
        productName: item.productName,
        invoiceRef: item.invoiceId ? String(item.invoiceId) : '',
        notes: `Sold via ${item.invoiceNumber} (${item.saleType}) — ${item.imeiOrSerial}`,
      }));
    } else {
      setHasImei(false);
      setForm((prev) => ({
        ...prev,
        imei: '',
        productName: item.productName + (item.imeiOrSerial ? ` [${item.imeiOrSerial}]` : ''),
        invoiceRef: item.invoiceId ? String(item.invoiceId) : '',
        notes: `Sold via ${item.invoiceNumber} (${item.saleType})`,
      }));
    }

    if (!item.isWarrantyValid && !item.isRefunded) {
      toast.warning(
        `Note: The warranty for this product expired on ${new Date(item.warrantyExpiryDate).toLocaleDateString()}. Claim will be logged as out-of-warranty / chargeable repair.`
      );
    } else if (item.isRefunded) {
      toast.error('This product was already refunded/settled in a previous claim.');
    } else {
      toast.success(`Selected ${item.productName} (${item.daysRemaining} days warranty left)`);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        customer: data.customer,
        claimType: data.claimType,
        description: data.description,
        notes: data.notes || (data.productName ? `Item: ${data.productName}` : undefined),
      };
      if (hasImei && data.imei) {
        payload.imei = data.imei;
      }
      if (data.invoiceRef) {
        payload.invoiceRef = data.invoiceRef;
      }
      return api.post('/warranties', payload);
    },
    onSuccess: () => {
      toast.success('Warranty claim created successfully');
      queryClient.invalidateQueries(['warranty-claims']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create claim'),
  });

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Log Warranty Claim
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Wholesale & Retail warranty tracking with auto-selected customer products and expiry
              check.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (hasImei && !form.imei && !form.productName.trim()) {
              toast.error('Please select an IMEI or choose a purchased product');
              return;
            }
            if (!hasImei && !form.productName.trim()) {
              toast.error('Please specify the product name / model');
              return;
            }
            mutation.mutate(form);
          }}
          className="p-5 space-y-4 text-xs text-slate-900 dark:text-slate-100 overflow-y-auto flex-1"
        >
          {/* Step 1: Customer Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Select Customer *
            </label>
            <select
              required
              value={form.customer}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="w-full h-10 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 shadow-xs"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.phone || 'No phone'})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Customer Purchased Products Auto-Loaded (Wholesale & Retail) */}
          {form.customer && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Customer Purchase History ({customerItems.length} Products Found)
                </span>
                {loadingItems && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />}
              </div>

              {loadingItems ? (
                <div className="py-4 text-center text-slate-400 font-medium text-xs">
                  Loading customer invoices & items...
                </div>
              ) : customerItems.length === 0 ? (
                <div className="p-3 text-center bg-white dark:bg-[#1e293b] rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                  No completed purchases found for this customer. You can enter details manually
                  below.
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {customerItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectPurchasedItem(item)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 text-xs ${
                        selectedItemKey === item.id
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-600'
                          : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#1e293b] hover:border-slate-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                          {item.productName}
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {item.invoiceNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          {item.imeiOrSerial && (
                            <span className="font-mono text-blue-600 dark:text-blue-400">
                              IMEI: {item.imeiOrSerial}
                            </span>
                          )}
                          <span>Sold: {new Date(item.purchaseDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {item.isRefunded ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400">
                            Refunded
                          </span>
                        ) : item.isWarrantyValid ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                            {item.daysRemaining}d warranty
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Product Type Toggle & Inputs */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Item Identification
              </span>
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setHasImei(true)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                    hasImei
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  With IMEI
                </button>
                <button
                  type="button"
                  onClick={() => setHasImei(false)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                    !hasImei
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Non-IMEI Item
                </button>
              </div>
            </div>

            {hasImei ? (
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  IMEI / Serial Unit *
                </label>
                <select
                  value={form.imei}
                  onChange={(e) => setForm({ ...form, imei: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-600 shadow-xs"
                >
                  <option value="">-- Choose or Auto-Selected IMEI --</option>
                  {imeis.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.imeiOrSerial} — {u.productId?.name || 'Device'}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Product / Accessory Name & Model *
                </label>
                <input
                  type="text"
                  required={!hasImei}
                  placeholder="e.g. Logitech G102 Mouse, Anker 20W Charger, Remax Cable"
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Claim Resolution Type *
            </label>
            <select
              required
              value={form.claimType}
              onChange={(e) => setForm({ ...form, claimType: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-600 shadow-xs capitalize"
            >
              <option value="repair">Repair Service</option>
              <option value="replacement">Direct Replacement</option>
              <option value="refund">Refund Claim (Returns Ledger)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Issue / Defect Description *
            </label>
            <textarea
              required
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2.5 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 shadow-xs"
              placeholder="Describe what is wrong with the device / product..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Invoice Reference & Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Provided with original box & invoice"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 shadow-xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {mutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Submit Warranty Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClaimDetailModal({ claim: cl, onClose, onPrint }) {
  const queryClient = useQueryClient();
  const [resolution, setResolution] = useState(cl.resolution || '');

  const updateMutation = useMutation({
    mutationFn: async (data) => api.put(`/warranties/${cl._id}`, data),
    onSuccess: () => {
      toast.success('Claim updated');
      queryClient.invalidateQueries(['warranty-claims']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Claim Details</h2>
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Print Token
            </button>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Customer</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {cl.customer?.name} {cl.customer?.phone ? `(${cl.customer.phone})` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Product / Item</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {cl.notes?.replace(/^Item:\s*/i, '') ||
                  cl.imei?.productId?.name ||
                  'Device / Accessory'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Invoice Ref</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {cl.invoiceRef?.invoiceNumber || cl.notes?.match(/INV-[\w-]+/)?.[0] || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-medium">IMEI / Serial</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {cl.imei?.imeiOrSerial || 'Non-IMEI Item'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Claim Type</span>
              <span className="capitalize font-bold text-slate-900 dark:text-slate-100">
                {cl.claimType}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Status</span>
              <span
                className={`px-2.5 py-0.5 text-xs rounded-full font-bold capitalize ${STATUS_COLORS[cl.status]}`}
              >
                {cl.status}
              </span>
            </div>
            <div className="pt-1">
              <span className="text-slate-500 font-medium block mb-0.5">Issue Description</span>
              <p className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                {cl.description}
              </p>
            </div>
            {cl.resolution && (
              <div className="pt-1">
                <span className="text-slate-500 font-medium block mb-0.5">Resolution</span>
                <p className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 font-medium">
                  {cl.resolution}
                </p>
              </div>
            )}
          </div>

          {cl.status === 'pending' && (
            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Resolution Note
                </label>
                <textarea
                  rows={2}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateMutation.mutate({ status: 'approved', resolution })}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg text-sm transition-all"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateMutation.mutate({ status: 'rejected', resolution })}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-sm transition-all"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {cl.status === 'approved' && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() =>
                  updateMutation.mutate({
                    status: 'completed',
                    resolution: resolution || 'Completed',
                  })
                }
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all"
              >
                Mark Completed
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
