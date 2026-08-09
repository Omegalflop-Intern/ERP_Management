import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

export default function SAContacts() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contact/manage');
      if (res.data?.success) {
        setMessages(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load contact inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleMarkStatus = async (id, status) => {
    try {
      const res = await api.patch(`/contact/manage/${id}/status`, { status });
      if (res.data?.success) {
        toast.success(`Message marked as ${status}`);
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
        if (selectedMsg?.id === id) {
          setSelectedMsg((prev) => ({ ...prev, status }));
        }
      }
    } catch (err) {
      toast.error('Failed to update message status');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-orange-500" />
            Website Contact Inquiries
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Inquiries submitted by prospective shop owners from the OmniManage website.
          </p>
        </div>
        <button
          onClick={fetchContacts}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Inquiries
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 max-h-[700px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading inquiries...</div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No contact inquiries received yet.
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => setSelectedMsg(msg)}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                  selectedMsg?.id === msg.id
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {msg.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      msg.status === 'READ'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                    }`}
                  >
                    {msg.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {msg.phone}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {msg.message}
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  {new Date(msg.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Message Detail View */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          {selectedMsg ? (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedMsg.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Received on {new Date(selectedMsg.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkStatus(selectedMsg.id, 'READ')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
                  >
                    Mark as Read
                  </button>
                  <button
                    onClick={() => handleMarkStatus(selectedMsg.id, 'REPLIED')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-all"
                  >
                    Mark as Replied
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Phone
                  </span>
                  <a
                    href={`tel:${selectedMsg.phone}`}
                    className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    {selectedMsg.phone}
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Email
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedMsg.email || 'N/A'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Shop Name
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedMsg.shopName || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase">Message Content</h3>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedMsg.message}
                </div>
              </div>
            </>
          ) : (
            <div className="py-24 text-center space-y-3">
              <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Select an inquiry from the left list to view full details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
