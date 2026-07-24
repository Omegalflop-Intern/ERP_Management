import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Edit, Trash2, Loader2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

const PERMISSION_GROUPS = {
  'Dashboard': ['dashboard:view'],
  'Sales': ['sales:view', 'sales:create', 'sales:delete'],
  'Products': ['products:view', 'products:create', 'products:edit', 'products:delete'],
  'Categories': ['categories:view', 'categories:manage'],
  'Inventory': ['inventory:view', 'inventory:manage'],
  'Stock': ['stock:view', 'stock:transfer'],
  'Customers': ['customers:view', 'customers:manage'],
  'Suppliers': ['suppliers:view', 'suppliers:manage'],
  'Purchases': ['purchases:view', 'purchases:manage'],
  'Accounting': ['accounting:view', 'accounting:manage'],
  'Employees': ['employees:view', 'employees:manage'],
  'Attendance': ['attendance:view', 'attendance:manage'],
  'Leaves': ['leaves:view', 'leaves:manage'],
  'Payroll': ['payroll:view', 'payroll:manage'],
  'Repairs': ['repairs:view', 'repairs:manage'],
  'Warranties': ['warranties:view', 'warranties:manage'],
  'Wholesale': ['wholesale:view', 'wholesale:manage'],
  'Reports': ['reports:view'],
  'Users': ['users:view', 'users:manage'],
  'Roles': ['roles:view', 'roles:manage'],
  'Branches': ['branches:view', 'branches:manage'],
  'Settings': ['settings:view', 'settings:manage'],
};

export default function RoleManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const queryClient = useQueryClient();
  const { styled } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get('/roles');
      return data.data || [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/roles/${id}`),
    onSuccess: () => { toast.success('Role deleted'); queryClient.invalidateQueries({ queryKey: ['roles'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Cannot delete'),
  });

  const roles = data || [];

  return (
    <div className="space-y-6">
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl ${styled ? 'neu-card' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600 dark:text-red-400" /> Role Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create roles and assign page access permissions</p>
        </div>
        <button onClick={() => { setEditRole(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-700/20">
          <Plus className="w-4 h-4" /> New Role
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role._id} className={`p-5 rounded-2xl space-y-3 ${styled ? 'neu-card' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role.isSystem ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-gray-100">{role.displayName || role.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{role.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditRole(role); setShowForm(true); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  {!role.isSystem && (
                    <button onClick={() => confirmDelete(`Delete "${role.name}" role?`, () => deleteMutation.mutate(role._id))}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {role.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{role.description}</p>
              )}

              <div className="flex flex-wrap gap-1">
                {role.permissions?.slice(0, 8).map((p) => (
                  <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {p.split(':')[1]}
                  </span>
                ))}
                {role.permissions?.length > 8 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                    +{role.permissions.length - 8} more
                  </span>
                )}
              </div>

              {role.isSystem && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  System Role
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RoleFormModal
          role={editRole}
          onClose={() => { setShowForm(false); setEditRole(null); }}
          onSuccess={() => { setShowForm(false); setEditRole(null); queryClient.invalidateQueries({ queryKey: ['roles'] }); }}
        />
      )}
    </div>
  );
}

function RoleFormModal({ role, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: role?.name || '',
    displayName: role?.displayName || '',
    description: role?.description || '',
    permissions: role?.permissions || [],
  });
  const { styled } = useTheme();

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (role) return api.put(`/roles/${role._id}`, data);
      return api.post('/roles', data);
    },
    onSuccess: () => { toast.success(role ? 'Role updated' : 'Role created'); onSuccess(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const togglePermission = (perm) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const toggleGroup = (perms) => {
    const allSelected = perms.every(p => form.permissions.includes(p));
    setForm(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !perms.includes(p))
        : [...new Set([...prev.permissions, ...perms])],
    }));
  };

  const inputCls = styled
    ? 'neu-input w-full px-3 py-2 rounded-lg text-sm'
    : 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 text-sm';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto ${styled ? 'neu-card rounded-2xl' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl'} shadow-xl`}>
        <div className={`px-6 py-4 flex items-center justify-between sticky top-0 z-10 ${styled ? '' : 'border-b border-gray-200 dark:border-gray-800'}`}>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">{role ? 'Edit Role' : 'Create New Role'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Role Name *</label>
              <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value.toUpperCase()})} disabled={!!role}
                className={`${inputCls} ${role ? 'opacity-60' : ''}`} placeholder="e.g. SUPERVISOR" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Display Name *</label>
              <input required value={form.displayName} onChange={(e) => setForm({...form, displayName: e.target.value})}
                className={inputCls} placeholder="e.g. Supervisor" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Description</label>
            <input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
              className={inputCls} placeholder="What can this role do?" />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Permissions ({form.permissions.length} selected)</label>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
                const count = perms.filter(p => form.permissions.includes(p)).length;
                const allSelected = count === perms.length;
                const someSelected = count > 0 && !allSelected;
                return (
                  <div key={group} className={`p-3 rounded-xl ${styled ? 'neu-card-sm' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => toggleGroup(perms)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${allSelected ? 'bg-red-600 border-red-600' : someSelected ? 'bg-red-600/30 border-red-600' : 'border-gray-300 dark:border-gray-600'}`}>
                          {(allSelected || someSelected) && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{group}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">{count}/{perms.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 ml-7">
                      {perms.map((p) => {
                        const action = p.split(':')[1];
                        const selected = form.permissions.includes(p);
                        return (
                          <button key={p} type="button" onClick={() => togglePermission(p)}
                            className={`text-[11px] px-2 py-1 rounded-lg font-medium transition-all ${selected ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                            {action}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors">
              {mutation.isPending ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
