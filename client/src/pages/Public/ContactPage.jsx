import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Globe2,
  Headphones,
  HelpCircle,
  Mail,
  MapPin,
  MessageSquare,
  PhoneCall,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api from '../../lib/api';

export default function ContactPage() {
  useDocumentTitle('Contact & Support - OmniManage Gadget ERP');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    shopName: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      toast.error('Please enter your name, phone number, and message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/contact', formData);
      if (res.data?.success) {
        toast.success('Thank you! Your inquiry has been received. An ERP specialist will call you shortly.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          shopName: '',
          subject: '',
          message: '',
        });
      } else {
        toast.error(res.data?.message || 'Failed to submit inquiry. Please try again.');
      }
    } catch {
      toast.error('Could not send message. Please verify your connection or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden font-sans">
      {/* ─── HERO HEADER ──────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 bg-gradient-to-b from-blue-50/50 via-transparent to-transparent dark:from-slate-900/40 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 text-xs font-bold">
            <Headphones className="w-3.5 h-3.5" />
            <span>Dedicated Support & Enterprise Onboarding</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            We’re Here to Help You{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Elevate Your Store
            </span>
          </h1>

          <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Have questions about IMEI tracking, data migration, or enterprise pricing? Reach out and our
            specialists will guide you through.
          </p>
        </div>
      </section>

      {/* ─── CONTACT MAIN GRID ────────────────────────────────────────────────── */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Direct Info Cards */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-blue-500" />
                <span>Call & WhatsApp</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Direct hotline for sales demos and priority technical support.
              </p>
              <div className="space-y-2 pt-2">
                <a
                  href="tel:+8801700000000"
                  className="block text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  +880 1700-000000 (Sales)
                </a>
                <a
                  href="tel:+8801800000000"
                  className="block text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  +880 1800-000000 (Tech Support)
                </a>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-500" />
                <span>Official Emails</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">General & Sales:</span>
                  <a
                    href="mailto:sales@omnimanage.app"
                    className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600"
                  >
                    sales@omnimanage.app
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block">Technical Support:</span>
                  <a
                    href="mailto:support@omnimanage.app"
                    className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600"
                  >
                    support@omnimanage.app
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <span>Headquarters & Labs</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Level 8, Tech Park Tower, Gulshan-2, Dhaka 1212, Bangladesh.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Open Sat - Thu: 9:00 AM - 9:00 PM</span>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="lg:col-span-2">
            <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Send Us a Direct Message
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Fill out the form below and an ERP consultant will respond within 2 business hours.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Tanvir Hossain"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. 01712345678"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. tanvir@gadgetshop.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-shop" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Shop / Business Name
                    </label>
                    <input
                      id="contact-shop"
                      type="text"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleChange}
                      placeholder="e.g. iGadget Care & Sales"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-subject" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Subject / Inquiry Type
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Request Demo for 4 Outlets or Data Migration"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    How can we help? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your store size, number of technicians, current POS problems, or any custom requirements..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {submitting ? (
                    <span>Transmitting Message...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry to ERP Team</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
