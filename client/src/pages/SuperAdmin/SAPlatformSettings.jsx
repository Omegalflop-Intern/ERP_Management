import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Globe,
  Share2,
  Save,
  RefreshCw,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  ShieldCheck,
  CreditCard,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

export default function SAPlatformSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    platformName: 'OmniManage ERP',
    platformPhone: '+880 1700-000000',
    platformWhatsApp: '+880 1700-000000',
    platformEmail: 'support@omnimanage.bd',
    platformAddress: 'Dhanmondi, Dhaka - 1209, Bangladesh',
    activationInstructions:
      'Thank you for registering your shop! Please contact our platform support team to verify your payment and activate your shop outlet.',
    bkashNumber: '01700000000',
    nagadNumber: '01700000000',
    platformSocials: {
      facebook: 'https://facebook.com/omnimanage',
      twitter: 'https://x.com/omnimanage',
      linkedin: 'https://linkedin.com/company/omnimanage',
      youtube: 'https://youtube.com/@omnimanage',
      instagram: 'https://instagram.com/omnimanage',
    },
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/public');
      if (res.data?.data) {
        const d = res.data.data;
        setForm((prev) => ({
          ...prev,
          platformName: d.platformName || prev.platformName,
          platformPhone: d.platformPhone || prev.platformPhone,
          platformWhatsApp: d.platformWhatsApp || prev.platformWhatsApp,
          platformEmail: d.platformEmail || prev.platformEmail,
          platformAddress: d.platformAddress || prev.platformAddress,
          activationInstructions: d.activationInstructions || prev.activationInstructions,
          bkashNumber: d.bkashNumber || prev.bkashNumber,
          nagadNumber: d.nagadNumber || prev.nagadNumber,
          platformSocials: {
            facebook: d.platformSocials?.facebook || prev.platformSocials.facebook,
            twitter: d.platformSocials?.twitter || prev.platformSocials.twitter,
            linkedin: d.platformSocials?.linkedin || prev.platformSocials.linkedin,
            youtube: d.platformSocials?.youtube || prev.platformSocials.youtube,
            instagram: d.platformSocials?.instagram || prev.platformSocials.instagram,
          },
        }));
      }
    } catch {
      toast.error('Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings/platform', form);
      if (res.data?.success) {
        toast.success('Platform Settings & Footer Social Links updated successfully!');
      } else {
        toast.error(res.data?.message || 'Update failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update platform settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center flex items-center justify-center gap-3 text-slate-400 font-bold">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
        Loading Platform Settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-500" />
            Platform & Footer Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage public platform contacts, shop activation support details, and landing page
            footer social media links.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Public Contact Info */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Phone className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            Support Contact Details (Landing Page & Shop Activation)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={form.platformName}
                onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Support Phone Number
              </label>
              <input
                type="text"
                value={form.platformPhone}
                onChange={(e) => setForm({ ...form, platformPhone: e.target.value })}
                placeholder="+880 1700-000000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Support Number
              </label>
              <input
                type="text"
                value={form.platformWhatsApp}
                onChange={(e) => setForm({ ...form, platformWhatsApp: e.target.value })}
                placeholder="+880 1700-000000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Support Email Address
              </label>
              <input
                type="email"
                value={form.platformEmail}
                onChange={(e) => setForm({ ...form, platformEmail: e.target.value })}
                placeholder="support@omnimanage.bd"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Office Address
              </label>
              <input
                type="text"
                value={form.platformAddress}
                onChange={(e) => setForm({ ...form, platformAddress: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Shop Activation Popup Instructions & Merchant Payments */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Shop Activation Modal Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Shop Activation Note / Instructions
              </label>
              <textarea
                rows={3}
                value={form.activationInstructions}
                onChange={(e) => setForm({ ...form, activationInstructions: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  bKash Merchant / Personal Number
                </label>
                <input
                  type="text"
                  value={form.bkashNumber}
                  onChange={(e) => setForm({ ...form, bkashNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nagad Merchant / Personal Number
                </label>
                <input
                  type="text"
                  value={form.nagadNumber}
                  onChange={(e) => setForm({ ...form, nagadNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Footer Social Links */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Share2 className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            Landing Page Footer Social Media Links
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5 text-blue-500" /> Facebook Page URL
              </label>
              <input
                type="url"
                value={form.platformSocials.facebook}
                onChange={(e) =>
                  setForm({
                    ...form,
                    platformSocials: { ...form.platformSocials, facebook: e.target.value },
                  })
                }
                placeholder="https://facebook.com/yourpage"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Twitter className="w-3.5 h-3.5 text-sky-400" /> Twitter / X Profile URL
              </label>
              <input
                type="url"
                value={form.platformSocials.twitter}
                onChange={(e) =>
                  setForm({
                    ...form,
                    platformSocials: { ...form.platformSocials, twitter: e.target.value },
                  })
                }
                placeholder="https://x.com/yourhandle"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn Company URL
              </label>
              <input
                type="url"
                value={form.platformSocials.linkedin}
                onChange={(e) =>
                  setForm({
                    ...form,
                    platformSocials: { ...form.platformSocials, linkedin: e.target.value },
                  })
                }
                placeholder="https://linkedin.com/company/yourcompany"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Channel URL
              </label>
              <input
                type="url"
                value={form.platformSocials.youtube}
                onChange={(e) =>
                  setForm({
                    ...form,
                    platformSocials: { ...form.platformSocials, youtube: e.target.value },
                  })
                }
                placeholder="https://youtube.com/@yourchannel"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram Profile URL
              </label>
              <input
                type="url"
                value={form.platformSocials.instagram}
                onChange={(e) =>
                  setForm({
                    ...form,
                    platformSocials: { ...form.platformSocials, instagram: e.target.value },
                  })
                }
                placeholder="https://instagram.com/yourprofile"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Platform & Social Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
