import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, FolderOpen, Loader2, Plus, Search, Tags, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { confirmDelete } from '../../lib/confirm';

export default function Categories() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('CATEGORY');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const queryClient = useQueryClient();
  const { styled } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['catalog', activeTab, search],
    queryFn: async () => {
      const { data } = await api.get('/catalog', { params: { type: activeTab, search } });
      return data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/catalog/${id}`),
    onSuccess: () => {
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const items = data || [];

  const tabs = [
    { key: 'CATEGORY', label: 'Categories', count: items.length },
    { key: 'BRAND', label: 'Brands', count: items.length },
  ];

  return (
    <div className="space-y-6">
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl ${styled ? 'neu-card' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'}`}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Tags className="w-6 h-6 text-red-600 dark:text-red-400" /> Categories & Brands
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage product categories and brand names
          </p>
        </div>
        <button
          onClick={() => {
            setEditItem(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#2563EB]/20"
        >
          <Plus className="w-4 h-4" /> Add {activeTab === 'CATEGORY' ? 'Category' : 'Brand'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSearch('');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-[#2563EB] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={`Search ${activeTab === 'CATEGORY' ? 'categories' : 'brands'}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#2563EB] ${styled ? 'neu-input rounded-lg' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100'}`}
        />
      </div>

      {/* Items Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : items.length === 0 ? (
        <div
          className={`text-center py-16 ${styled ? 'neu-card rounded-2xl' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl'}`}
        >
          <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No {activeTab === 'CATEGORY' ? 'categories' : 'brands'} found
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Add" to create one</p>
        </div>
      ) : (
        <div
          className={`overflow-hidden ${styled ? 'neu-card rounded-2xl' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl'}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                          <Tags className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${item.type === 'CATEGORY' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}
                      >
                        {item.type === 'CATEGORY' ? 'Category' : 'Brand'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setShowForm(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            confirmDelete(`Delete "${item.name}"?`, () =>
                              deleteMutation.mutate(item._id)
                            )
                          }
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600 transition-colors"
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
        </div>
      )}

      {showForm && (
        <CatalogFormModal
          item={editItem}
          type={activeTab}
          onClose={() => {
            setShowForm(false);
            setEditItem(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditItem(null);
            queryClient.invalidateQueries({ queryKey: ['catalog'] });
          }}
        />
      )}
    </div>
  );
}

function CatalogFormModal({ item, type, onClose, onSuccess }) {
  const [name, setName] = useState(item?.name || '');
  const { styled } = useTheme();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (item) return api.put(`/catalog/${item._id}`, data);
      return api.post('/catalog', { ...data, type });
    },
    onSuccess: () => {
      toast.success(item ? 'Updated' : 'Created');
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const inputCls = styled
    ? 'neu-input w-full px-3 py-2 rounded-lg text-sm'
    : 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 text-sm';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-sm ${styled ? 'neu-card rounded-2xl' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl'} shadow-xl`}
      >
        <div
          className={`px-6 py-4 flex items-center justify-between ${styled ? '' : 'border-b border-gray-200 dark:border-gray-800'}`}
        >
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            {item ? 'Edit' : 'Add'} {type === 'CATEGORY' ? 'Category' : 'Brand'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({ name });
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className={inputCls}
            />
          </div>
          <div className="flex gap-3">
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
              {mutation.isPending ? 'Saving...' : item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
