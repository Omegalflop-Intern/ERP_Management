import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileJson,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { format } from 'date-fns';

export default function SABackupManagement() {
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);

  // Fetch list of server backups
  const {
    data: backups = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['sa-server-backups'],
    queryFn: async () => {
      const res = await api.get('/settings/backup/list');
      return res.data?.data || [];
    },
  });

  // Manual Backup Mutation
  const triggerBackupMutation = useMutation({
    mutationFn: async () => api.post('/settings/backup/now'),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'New database backup created successfully');
      queryClient.invalidateQueries({ queryKey: ['sa-server-backups'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create backup'),
  });

  // Export instant JSON file to browser
  const handleDownloadInstantDump = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/settings/backup');
      const jsonStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omnimanage_full_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Instant database JSON dump downloaded successfully');
    } catch (e) {
      toast.error('Failed to export instant database backup');
    } finally {
      setIsExporting(false);
    }
  };

  // Restore database from uploaded JSON file
  const handleRestoreFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      setRestoreFile({ name: file.name, data: jsonData });
    } catch (err) {
      toast.error('Invalid JSON backup file. Please select a valid ERP dump file.');
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreFile?.data) return;
    setIsRestoring(true);
    try {
      const res = await api.post('/settings/restore', restoreFile.data);
      toast.success(res.data?.message || 'Database restored successfully!');
      setRestoreFile(null);
      queryClient.invalidateQueries();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to restore database from backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const totalBytes = backups.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const lastBackup = backups[0]?.createdAt
    ? format(new Date(backups[0].createdAt), 'PPpp')
    : 'No backups yet';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Database className="w-7 h-7 text-[#2563EB]" /> System Database Backups
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage automated snapshots, trigger manual backups, download full dumps, and restore
            system state.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => triggerBackupMutation.mutate()}
            disabled={triggerBackupMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
          >
            {triggerBackupMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Trigger Backup Now
          </button>

          <button
            onClick={handleDownloadInstantDump}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-md border border-slate-700/50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-emerald-400" />
            )}
            Download Dump (JSON)
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Backups
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB]">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {backups.length} Snapshots
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Backup Storage
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{totalMB} MB</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Last Backup Date
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div
            className="mt-3 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate"
            title={lastBackup}
          >
            {lastBackup}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Database Engine
            </span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> MariaDB / MySQL Active
          </div>
        </div>
      </div>

      {/* Restore Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Restore Database from
          Backup
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Upload a previously exported ERP JSON snapshot file to restore system entities and tenant
          tables.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-all border border-slate-300 dark:border-slate-700">
            <FileJson className="w-4 h-4 text-amber-500" />
            Select Backup File (.json)
            <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
          </label>

          {restoreFile && (
            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/40 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                {restoreFile.name}
              </span>
              <button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                {isRestoring ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Confirm Restore
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backup Files Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" /> Server Backup Snapshots ({backups.length}
            )
          </h3>
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-[#2563EB]" />
          </div>
        ) : backups.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            No server backups found. Click "Trigger Backup Now" to create your first snapshot.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Backup Filename</th>
                  <th className="px-6 py-3.5">File Size</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {backups.map((b) => (
                  <tr
                    key={b.filename}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {b.filename}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {b.sizeFormatted}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                      {format(new Date(b.createdAt), 'PPpp')}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={handleDownloadInstantDump}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-[#2563EB] rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
