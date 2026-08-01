import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  Database,
  DollarSign,
  Download,
  FileText,
  Globe,
  Image as ImageIcon,
  Package,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  Upload,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import api, { getAssetUrl } from '../../lib/api';

const settingGroups = [
  {
    key: 'company',
    label: 'Company Settings',
    icon: Building2,
    keys: [
      'companyName',
      'companySlogan',
      'companyAddress',
      'companyPhone',
      'companyEmail',
      'binVat',
      'companyLogo',
    ],
  },
  {
    key: 'finance',
    label: 'Finance & Tax',
    icon: DollarSign,
    keys: ['currency', 'currencySymbol', 'defaultVatRate', 'taxEnabled'],
  },
  {
    key: 'inventory',
    label: 'Inventory',
    icon: Package,
    keys: ['lowStockThreshold', 'autoReorderEnabled'],
  },
  { key: 'warranty', label: 'Warranty', icon: SettingsIcon, keys: ['defaultWarrantyMonths'] },
  { key: 'invoice', label: 'Invoice', icon: FileText, keys: ['invoiceFooter'] },
  { key: 'system', label: 'System', icon: Globe, keys: ['timezone', 'dateFormat'] },
  { key: 'backup', label: 'Database Backup & Restore', icon: Database, keys: ['backupControl'] },
];

const fieldLabels = {
  companyName: 'Company Name',
  companySlogan: 'Company Tagline / Slogan',
  companyAddress: 'Company Address',
  companyPhone: 'Company Phone',
  companyEmail: 'Company Email',
  binVat: 'BIN / VAT Reg No',
  companyLogo: 'Company Logo',
  currency: 'Currency',
  currencySymbol: 'Currency Symbol',
  defaultVatRate: 'Default VAT Rate (%)',
  taxEnabled: 'Tax Enabled',
  lowStockThreshold: 'Low Stock Threshold',
  autoReorderEnabled: 'Auto Reorder',
  defaultWarrantyMonths: 'Default Warranty (Months)',
  invoiceFooter: 'Invoice Footer Text',
  timezone: 'Timezone',
  dateFormat: 'Date Format',
};

import PageHeader from '../../components/layout/PageHeader';

export default function SettingsPage() {
  const { styled } = useTheme();
  const qc = useQueryClient();
  const [activeGroup, setActiveGroup] = useState('company');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const r = await api.get('/settings');
      return r.data?.data || {};
    },
  });

  const [form, setForm] = useState({});

  React.useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (data) => api.put('/settings', data),
    onSuccess: () => {
      toast.success('Settings saved');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const logoMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success('Logo uploaded successfully');
      const logoUrl = res.data?.companyLogo;
      setForm((prev) => ({ ...prev, companyLogo: logoUrl }));
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to upload logo'),
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      logoMutation.mutate(file);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      toast.info('Preparing database backup file...');
      const res = await api.get('/settings/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `mobile_shop_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Database backup file downloaded!');
    } catch {
      toast.error('Failed to download database backup');
    }
  };

  const [backupNowLoading, setBackupNowLoading] = useState(false);
  const [lastServerBackup, setLastServerBackup] = useState(null);

  const handleBackupNow = async () => {
    try {
      setBackupNowLoading(true);
      const res = await api.post('/settings/backup/now');
      setLastServerBackup(res.data?.data?.filename);
      toast.success(`Backup saved to server: ${res.data?.data?.filename}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Backup failed');
    } finally {
      setBackupNowLoading(false);
    }
  };

  const handleRestoreFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        if (!backupData.collections) {
          toast.error('Invalid database backup JSON format');
          return;
        }
        if (
          !window.confirm(
            'WARNING: Restoring will overwrite current database records with backup data. Are you sure?'
          )
        ) {
          return;
        }
        toast.info('Restoring database...');
        const res = await api.post('/settings/restore', backupData);
        toast.success(res.data?.message || 'Database restored successfully!');
        qc.invalidateQueries();
      } catch (err) {
        toast.error('Failed to parse or restore backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const cardCls = styled
    ? 'neu-card'
    : 'glass-secondary rounded-xl border border-gray-200 dark:border-gray-800';
  const inputCls = styled
    ? 'neu-input w-full px-3 py-2.5 rounded-xl text-sm'
    : 'w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] outline-none';

  const activeGroupData = settingGroups.find((g) => g.key === activeGroup);

  return (
    <div className="space-y-6">
      <PageHeader
        title="System & Shop Settings"
        subtitle="Configure company details, receipt logo, VAT rates, currency formats, and database backup controls."
        icon={SettingsIcon}
        breadcrumbs={['System Administration', 'Settings']}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className={`${cardCls} p-4`}>
          <div className="space-y-1">
            {settingGroups.map((group) => (
              <button
                key={group.key}
                onClick={() => setActiveGroup(group.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeGroup === group.key ? 'bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                <group.icon className={`w-4 h-4 ${activeGroup === group.key ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-400'}`} />
                {group.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className={`${cardCls} p-6 lg:col-span-3`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {activeGroupData?.label}
          </h2>

          {activeGroup === 'backup' ? (
            <div className="space-y-6">
              {/* Schedule info */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
                    Weekly Auto-Backup Active
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">
                    The server automatically saves a backup to{' '}
                    <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">
                      server/backups/
                    </code>{' '}
                    once every 7 days. Up to 8 weekly backups are kept. Use the button below to
                    trigger one immediately.
                  </p>
                </div>
              </div>

              {/* Save to server now */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold">
                  <Save className="w-5 h-5 text-purple-600" /> Save Backup to Server Now
                </div>
                <p className="text-xs text-gray-500">
                  Saves a timestamped backup JSON file to{' '}
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">server/backups/</code>{' '}
                  immediately — same as the weekly auto-backup but triggered on demand.
                </p>
                {lastServerBackup && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Last saved: {lastServerBackup}
                  </p>
                )}
                <button
                  onClick={handleBackupNow}
                  disabled={backupNowLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all"
                >
                  <Save className="w-4 h-4" /> {backupNowLoading ? 'Saving...' : 'Backup Now'}
                </button>
              </div>

              {/* Download to browser */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold">
                  <Download className="w-5 h-5 text-emerald-600" /> Download Backup File
                </div>
                <p className="text-xs text-gray-500">
                  Download a complete JSON backup of all collections directly to your computer for
                  offline storage.
                </p>
                <button
                  onClick={handleDownloadBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all"
                >
                  <Download className="w-4 h-4" /> Download to Computer (.JSON)
                </button>
              </div>

              {/* Restore */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold">
                  <Upload className="w-5 h-5 text-red-600" /> Restore Database From Backup File
                </div>
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> Restoring will overwrite existing
                  collection documents with the backup file data.
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-bold text-xs rounded-lg cursor-pointer transition-all">
                  <Upload className="w-4 h-4" /> Select Backup JSON File to Restore
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : isLoading ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {activeGroupData?.keys.map((key) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {fieldLabels[key] || key}
                  </label>
                  {key === 'companyLogo' ? (
                    <div className="flex items-center gap-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/40">
                      {form.companyLogo ? (
                        <img
                          src={getAssetUrl(form.companyLogo)}
                          alt="Company Logo"
                          className="h-16 w-auto object-contain rounded border border-gray-200 dark:border-gray-700 bg-white p-1"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />{' '}
                          {logoMutation.isPending ? 'Uploading...' : 'Upload Logo Image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={logoMutation.isPending}
                          />
                        </label>
                        <p className="text-[11px] text-gray-500">
                          Supported formats: PNG, JPG, WEBP (Max 5MB). Saved to{' '}
                          <code className="text-red-600 font-mono">uploads/logos</code>.
                        </p>
                      </div>
                    </div>
                  ) : key === 'taxEnabled' || key === 'autoReorderEnabled' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {form[key] ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  ) : key === 'defaultVatRate' ||
                    key === 'lowStockThreshold' ||
                    key === 'defaultWarrantyMonths' ? (
                    <input
                      type="number"
                      value={form[key] || ''}
                      onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                      className={inputCls}
                    />
                  ) : key === 'invoiceFooter' ? (
                    <textarea
                      value={form[key] || ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className={inputCls}
                      rows={3}
                    />
                  ) : (
                    <input
                      value={form[key] || ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className={inputCls}
                    />
                  )}
                </div>
              ))}
              <button
                onClick={() => mutation.mutate(form)}
                disabled={mutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors mt-4 shadow-xs"
              >
                <Save className="w-4 h-4" /> {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
