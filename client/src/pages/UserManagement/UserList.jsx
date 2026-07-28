import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCog,
  Loader2,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { confirmDelete } from '../../lib/confirm';
import { useTheme } from '../../context/ThemeContext';

export default function UserList() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const queryClient = useQueryClient();
  const { styled } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const { data } = await api.get('/users', { params: { search, limit: 50 } });
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const toggleVerifyMutation = useMutation({
    mutationFn: async (id) => api.patch(`/users/${id}/toggle-verification`),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const users = data?.data || [];
  const inputCls = styled
    ? 'neu-input w-full px-3 py-2 rounded-lg text-sm'
    : 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500';
  const cardCls = styled
    ? 'neu-card rounded-2xl'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800';

  return (
    <div className="space-y-6">
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl ${styled ? 'neu-card' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'}`}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-red-600 dark:text-red-400" /> User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage system users and their roles
          </p>
        </div>
        <button
          onClick={() => {
            setEditUser(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 ${inputCls}`}
        />
      </div>

      <div className={`${cardCls} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b border-gray-200 dark:border-gray-800 ${styled ? '' : ''}`}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-red-500 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-sm">
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {u.fullName || u.username}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                        {u.role?.displayName || u.roleName || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${u.isActive ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {u.isVerified === false && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleVerifyMutation.mutate(u._id)}
                          title={u.isVerified === false ? 'Verify user' : 'Unverify user'}
                          className={`p-1.5 rounded-lg transition-colors ${u.isVerified === false ? 'hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 hover:text-green-700' : 'hover:bg-amber-100 dark:hover:bg-amber-900/20 text-amber-600 hover:text-amber-700'}`}
                        >
                          {u.isVerified === false ? (
                            <ShieldCheck className="w-4 h-4" />
                          ) : (
                            <ShieldOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setShowForm(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            confirmDelete(`Delete user "${u.name}"?`, () =>
                              deleteMutation.mutate(u._id)
                            )
                          }
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {showForm && (
        <UserFormModal
          user={editUser}
          onClose={() => {
            setShowForm(false);
            setEditUser(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditUser(null);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}
    </div>
  );
}

function UserFormModal({ user, onClose, onSuccess }) {
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    role: user?.role?._id || user?.role || '',
    fullName: user?.fullName || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { styled } = useTheme();

  const { data: roles } = useQuery({
    queryKey: ['roles-flat'],
    queryFn: async () => {
      const { data } = await api.get('/roles/flat');
      return data.data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (user) {
        const { password, ...rest } = data;
        return api.put(`/users/${user._id}`, rest);
      }
      return api.post('/users', data);
    },
    onSuccess: () => {
      toast.success(user ? 'User updated' : 'User created! Verification OTP sent to email.');
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const inputCls = styled
    ? 'neu-input w-full px-3 py-2 rounded-lg text-sm'
    : 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md ${styled ? 'neu-card rounded-2xl' : 'bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800'} shadow-xl`}
      >
        <div
          className={`px-6 py-4 flex items-center justify-between ${styled ? '' : 'border-b border-gray-200 dark:border-gray-800'}`}
        >
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            {user ? 'Edit User' : 'Create User'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
          className="p-6 space-y-3 text-sm"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Username *
              </label>
              <input
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Role *
              </label>
              <select
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputCls}
              >
                <option value="">Select role</option>
                {(roles || []).map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.displayName || r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Full Name
            </label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Phone
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`${inputCls} font-mono`}
            />
          </div>
          {!user && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`${inputCls} !pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {mutation.isPending ? 'Saving...' : user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
