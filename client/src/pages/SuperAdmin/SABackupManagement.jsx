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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
            <Database className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Database Snapshots & Disaster Recovery
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated database snapshots, manual exports, full JSON dumps, and state restoration
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => triggerBackupMutation.mutate()}
            disabled={triggerBackupMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-blue-600/20 hover:scale-[1.02]"
          >
            {triggerBackupMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Trigger Backup Now</span>
          </button>

          <button
            onClick={handleDownloadInstantDump}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-sm border border-slate-700/50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-emerald-400" />
            )}
            <span>Download JSON Dump</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Snapshots
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform group-hover:scale-105">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {backups.length} Files
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Allocated Storage
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-105">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{totalMB} MB</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Last Snapshot
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-105">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div
            className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200 truncate"
            title={lastBackup}
          >
            {lastBackup}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              RDBMS Engine
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-transform group-hover:scale-105">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" /> MariaDB Active
          </div>
        </div>
      </div>

      {/* Restore Section */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
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
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
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
