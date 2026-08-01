import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  Wrench,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import PageHeader from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/badge';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

const STATUSES = [
  'ALL',
  'Available',
  'Reserved',
  'Sold',
  'Returned',
  'Defective',
  'Sent for Repair',
  'Display Unit',
];

const STATUS_BADGE_VARIANTS = {
  Available: 'success',
  Sold: 'secondary',
  Reserved: 'warning',
  Returned: 'warning',
  Defective: 'destructive',
  'Sent for Repair': 'destructive',
  'Display Unit': 'default',
};

export default function IMEITracker() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [scanInput, setScanInput] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showCameraScan, setShowCameraScan] = useState(false);
  const [viewPassport, setViewPassport] = useState(null);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const scanInputRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['imei', search, status],
    queryFn: async () => {
      const res = await api.get('/inventory', { params: { search, status, limit: 50 } });
      return res.data;
    },
  });

  const units = data?.data || [];

  const importMutation = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/inventory/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
    onSuccess: (res) => {
      toast.success(`Imported: ${res.created} created, ${res.skipped} skipped`);
      queryClient.invalidateQueries(['imei']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Import failed'),
  });

  // Handle instant IMEI barcode scanner submit
  const handleQuickScanSubmit = async (e) => {
    if (e) e.preventDefault();
    const queryTerm = scanInput.trim();
    if (!queryTerm) return;

    try {
      // Fetch full IMEI lifecycle passport directly
      const res = await api.get(`/inventory/passport/${queryTerm}`);
      if (res.data?.data) {
        setViewPassport(res.data.data);
        toast.success(`IMEI Passport Loaded: ${queryTerm}`);
        setScanInput('');
        return;
      }
    } catch {
      // Fallback: search in units array or search API
      const match = units.find(
        (u) => u.imeiOrSerial?.toLowerCase() === queryTerm.toLowerCase()
      );
      if (match) {
        setViewPassport(match);
        toast.success(`IMEI Found: ${queryTerm}`);
        setScanInput('');
        return;
      }
      toast.error(`IMEI or Serial "${queryTerm}" not found in inventory.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="IMEI Tracker & Unit Passports"
        subtitle="Scan and track every device by 15-digit IMEI or serial number — complete lifecycle history from inward to sale & warranty."
        icon={Smartphone}
        breadcrumbs={['Inventory', 'IMEI Tracker']}
        actions={
          <>
            <button
              onClick={() => setShowCameraScan(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs transition-all border border-slate-200 dark:border-slate-700 btn-hover-lift"
            >
              <Camera className="w-4 h-4 text-[#2563EB]" /> Camera Scanner
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs transition-all shadow-xs btn-hover-lift"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              {importMutation.isPending ? 'Importing...' : 'Import Excel / CSV'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importMutation.mutate(f);
                e.target.value = '';
              }}
            />

            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl text-xs transition-all shadow-xs btn-hover-lift"
            >
              <ArrowDown className="w-4 h-4" /> Stock Inward (Add IMEI)
            </button>
          </>
        }
      />

      {/* Instant IMEI Barcode Gun / Camera Scanner Bar */}
      <div className="glass-secondary rounded-[20px] p-4 border border-blue-200/60 dark:border-blue-900/40">
        <form onSubmit={handleQuickScanSubmit} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2563EB]" />
            <input
              ref={scanInputRef}
              type="text"
              placeholder="⚡ Fast Scanner: Scan 15-digit IMEI or press Enter to lookup unit passport..."
              value={scanInput}
              onChange={(e) => {
                const val = e.target.value;
                setScanInput(val);
                if (val.trim().length === 15) {
                  setTimeout(() => handleQuickScanSubmit(), 100);
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-slate-900/90 border border-blue-300/80 dark:border-blue-800/60 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 shrink-0 btn-hover-lift"
          >
            <Search className="w-4 h-4" /> Lookup Passport
          </button>
        </form>
      </div>

      {/* Filter and Table Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by IMEI, product name, brand, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full sm:w-48 px-3.5 py-2.5 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-[#2563EB]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Unit Statuses' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* IMEI Table Container */}
      <div className="glass-light rounded-[20px] overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800">
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  IMEI / Serial Number
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Product & Brand
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Specs / Color
                </th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Cost (৳)
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Selling (৳)
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 w-24 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      icon={Smartphone}
                      title="No IMEI Inventory Units Found"
                      description="Click below to add a new device IMEI or import bulk serial numbers using an Excel / CSV spreadsheet."
                      actionLabel="Inward New IMEI Unit"
                      onAction={() => setShowAdd(true)}
                    />
                  </td>
                </tr>
              ) : (
                units.map((u) => (
                  <tr
                    key={u._id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#2563EB] dark:text-blue-400">
                      {u.imeiOrSerial}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-900 dark:text-slate-100 font-semibold">
                      {u.productId?.name || 'Item'}
                      <div className="text-[10px] text-slate-500 font-normal">
                        {u.productId?.brand} &bull; {u.productId?.model || 'Std'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                      {u.color || u.productId?.color || '-'}{' '}
                      {u.ram || u.storage ? `(${u.ram || ''} ${u.storage || ''})` : ''}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={STATUS_BADGE_VARIANTS[u.status] || 'secondary'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                      ৳{(u.purchasePrice || u.productId?.costPrice || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      ৳{(u.productId?.sellingPrice || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={async () => {
                            try {
                              const res = await api.get(`/inventory/passport/${u.imeiOrSerial}`);
                              setViewPassport(res.data?.data || u);
                            } catch {
                              setViewPassport(u);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-all"
                          title="View Unit Passport"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Camera Barcode Scanner Modal */}
      {showCameraScan && <CameraScannerModal onClose={() => setShowCameraScan(false)} onScan={(scannedImei) => {
        setScanInput(scannedImei);
        setShowCameraScan(false);
        handleQuickScanSubmit();
      }} />}

      {/* View Unit Passport Modal */}
      {viewPassport && (
        <IMEIPassportModal passport={viewPassport} onClose={() => setViewPassport(null)} />
      )}
    </div>
  );
}

function CameraScannerModal({ onClose, onScan }) {
  const videoRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let stream = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      })
      .catch(() => {
        setErrorMsg('Camera permission denied or camera unavailable on this device.');
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-primary w-full max-w-md rounded-[24px] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#2563EB]" /> Live Camera Scanner
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg ? (
          <div className="p-4 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
            {errorMsg}
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-[#2563EB]">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-2 border-dashed border-white/60 rounded-xl m-6 pointer-events-none animate-pulse" />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}

function IMEIPassportModal({ passport, onClose }) {
  if (!passport) return null;
  const p = passport;
  const unit = p.unit || p;
  const timeline = p.timeline || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-primary w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2563EB]" /> IMEI Unit Passport
            </h3>
            <p className="text-xs font-mono text-[#2563EB] dark:text-blue-400 font-bold mt-0.5">
              IMEI: {unit.imeiOrSerial}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Product Overview Box */}
          <div className="glass-secondary rounded-xl p-4 space-y-2 border border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {unit.productId?.name || 'Device'}
                </h4>
                <p className="text-xs text-slate-500">
                  {unit.productId?.brand} &bull; {unit.productId?.category}
                </p>
              </div>
              <Badge variant={STATUS_BADGE_VARIANTS[unit.status] || 'secondary'}>
                {unit.status}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-xs border-t border-slate-200/60 dark:border-slate-800/60">
              <div>
                <span className="text-slate-400">Color:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{unit.color || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400">RAM/Storage:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {unit.ram || ''} {unit.storage || ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Purchase Cost:</span>{' '}
                <span className="font-mono font-bold text-emerald-600">৳{(unit.purchasePrice || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Unit Lifecycle Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#2563EB]" /> Device Lifecycle History
            </h4>

            {timeline.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 text-center glass-light rounded-xl">
                Unit recorded in inventory stock on {new Date(unit.createdAt || Date.now()).toLocaleDateString('en-BD')}
              </div>
            ) : (
              <div className="space-y-2">
                {timeline.map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-slate-100 uppercase">
                          {evt.event}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(evt.timestamp).toLocaleDateString('en-BD')}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">{evt.details || `Invoice #${evt.invoiceNumber || '-'}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
