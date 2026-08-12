import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCog, Plus, Search, MoreVertical, Edit2, Trash2,
  PowerOff, Power, ShieldCheck, Shield, Mail, Phone,
  CheckCircle2, XCircle, User, Eye, EyeOff, Loader2
} from 'lucide-react';
import api from '@/lib/api';
import { confirmDelete } from '@/lib/confirm';
import { toast } from 'sonner';
import { format } from 'date-fns';

const fetchAdmins = async ({ queryKey }) => {
  const [, { search, page }] = queryKey;
  const res = await api.get('/super-admin/admins', { params: { search, page, limit: 20 } });
  return res.data;
};

const Avatar = ({ name, size = 'md' }) => {
  const initials = (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const sz = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sz} ${color} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
};

const Badge = ({ active }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'}`}>
    {active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {active ? 'Active' : 'Inactive'}
  </span>
);

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const InputField = ({ label, icon: Icon, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
      <input
        className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
        {...props}
      />
    </div>
  </div>
);

export default function SASystemAdmins() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', phone: '', fullName: '', password: '' });
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['sa-admins', { search, page }],
    queryFn: fetchAdmins,
    placeholderData: (prev) => prev,
  });

  const admins = data?.data || [];
  const pagination = data?.pagination || {};

  const invalidate = () => qc.invalidateQueries({ queryKey: ['sa-admins'] });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/super-admin/admins', body),
    onSuccess: () => { toast.success('System admin created!'); setCreateOpen(false); setForm({ username: '', email: '', phone: '', fullName: '', password: '' }); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to create admin'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/super-admin/admins/${id}`, body),
    onSuccess: () => { toast.success('Admin updated!'); setEditOpen(null); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to update'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/super-admin/admins/${id}/toggle-active`),
    onSuccess: (_, id) => { toast.success('Status toggled'); invalidate(); setMenuOpen(null); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Cannot change own status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/super-admin/admins/${id}`),
    onSuccess: () => { toast.success('Admin removed'); invalidate(); setMenuOpen(null); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Cannot delete own account'),
  });

  const openEdit = (admin) => {
    setEditForm({ fullName: admin.full_name || '', email: admin.email || '', phone: admin.phone || '' });
    setEditOpen(admin);
    setMenuOpen(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCog className="w-5 h-5 text-blue-500" />
            System Admins
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Platform-level administrators with full access
          </p>
        </div>
        <button
          id="create-admin-btn"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 hover:shadow-blue-600/30"
        >
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id="admin-search"
          type="text"
          placeholder="Search by name, email or username..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder:text-slate-400 transition-all"
        />
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
            <Shield className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No system admins found</p>
            <p className="text-xs mt-1">Run the seed script or create one above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left text-xs font-bold text-slate-500 dark:text-slate-400 px-5 py-3.5">Admin</th>
                  <th className="text-left text-xs font-bold text-slate-500 dark:text-slate-400 px-4 py-3.5 hidden md:table-cell">Contact</th>
                  <th className="text-left text-xs font-bold text-slate-500 dark:text-slate-400 px-4 py-3.5 hidden sm:table-cell">Status</th>
                  <th className="text-left text-xs font-bold text-slate-500 dark:text-slate-400 px-4 py-3.5 hidden lg:table-cell">Created</th>
                  <th className="text-right text-xs font-bold text-slate-500 dark:text-slate-400 px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {admins.map((admin) => (
                  <tr key={admin._id || admin.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={admin.fullName || admin.full_name || admin.username} />
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{admin.fullName || admin.full_name || admin.username}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                            @{admin.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {admin.email}
                        </div>
                        {admin.phone && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {admin.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <Badge active={admin.isActive ?? admin.is_active} />
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {admin.created_at ? format(new Date(admin.created_at), 'MMM d, yyyy') : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(admin)}
                          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Admin Info"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate(admin.id)}
                          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title={admin.is_active ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {admin.is_active ? (
                            <PowerOff className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Power className="w-4 h-4 text-emerald-500" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            confirmDelete(
                              `Remove "${admin.username}"?`,
                              () => deleteMutation.mutate(admin.id),
                              'Are you sure you want to remove this system admin?'
                            )
                          }
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Remove System Admin"
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {pagination.total} admins total
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${p === page ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add System Admin">
        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ username: form.username, email: form.email, phone: form.phone, fullName: form.fullName, password: form.password }); }}
          className="space-y-4"
        >
          <InputField id="create-fullname" label="Full Name" icon={User} placeholder="John Doe" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <InputField id="create-username" label="Username *" icon={ShieldCheck} placeholder="adminuser" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <InputField id="create-email" label="Email *" icon={Mail} type="email" placeholder="admin@platform.com" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <InputField id="create-phone" label="Phone" icon={Phone} placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password *</label>
            <div className="relative">
              <input
                id="create-password"
                type={showPass ? 'text' : 'password'}
                placeholder="Min 8 characters"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-3 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Cancel
            </button>
            <button
              id="create-admin-submit"
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Admin
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editOpen} onClose={() => setEditOpen(null)} title={`Edit — @${editOpen?.username}`}>
        <form
          onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: editOpen.id, body: editForm }); }}
          className="space-y-4"
        >
          <InputField id="edit-fullname" label="Full Name" icon={User} placeholder="Full name" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
          <InputField id="edit-email" label="Email" icon={Mail} type="email" placeholder="Email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <InputField id="edit-phone" label="Phone" icon={Phone} placeholder="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditOpen(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Cancel
            </button>
            <button
              id="edit-admin-submit"
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
