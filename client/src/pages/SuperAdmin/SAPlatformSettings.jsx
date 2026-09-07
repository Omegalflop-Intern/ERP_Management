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
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-pulse">
        {/* Header Banner Skeleton */}
        <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0" />
            <div className="space-y-1.5">
              <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-64 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
        </div>

        {/* Form Cards Skeletons */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-4"
            >
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
                <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
                <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
            <Building2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Platform & Global Settings
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage platform branding, emergency contacts, merchant payment options, and footer socials
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl font-black uppercase tracking-wider text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50 hover:scale-[1.02]"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Public Contact Info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Support & Hotline Coordinates
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Platform Name
              </label>
              <input
                type="text"
                value={form.platformName}
                onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Support Phone Number
              </label>
              <input
                type="text"
                value={form.platformPhone}
                onChange={(e) => setForm({ ...form, platformPhone: e.target.value })}
                placeholder="+880 1700-000000"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                WhatsApp Hotline
              </label>
              <input
                type="text"
                value={form.platformWhatsApp}
                onChange={(e) => setForm({ ...form, platformWhatsApp: e.target.value })}
                placeholder="+880 1700-000000"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Support Email Address
              </label>
              <input
                type="email"
                value={form.platformEmail}
                onChange={(e) => setForm({ ...form, platformEmail: e.target.value })}
                placeholder="support@omnimanage.bd"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Office HQ Address
              </label>
              <input
                type="text"
                value={form.platformAddress}
                onChange={(e) => setForm({ ...form, platformAddress: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Shop Activation Popup Instructions & Merchant Payments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Shop Activation & Merchant Gateway Settings
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Shop Activation Note / Instructions
              </label>
              <textarea
                rows={3}
                value={form.activationInstructions}
                onChange={(e) => setForm({ ...form, activationInstructions: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  bKash Merchant / Personal Number
                </label>
                <input
                  type="text"
                  value={form.bkashNumber}
                  onChange={(e) => setForm({ ...form, bkashNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Nagad Merchant / Personal Number
                </label>
                <input
                  type="text"
                  value={form.nagadNumber}
                  onChange={(e) => setForm({ ...form, nagadNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Footer Social Links */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <Share2 className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Public Website & Social Media Channels
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
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
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
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
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
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
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
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
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
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
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-2xl font-black uppercase tracking-wider text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-600/25 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02]"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Platform & Social Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
