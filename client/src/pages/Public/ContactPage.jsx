import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Headphones,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import api from '../../lib/api';

export default function ContactPage() {
  useDocumentTitle('Contact Us - OmniManage Support & Sales');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    shopName: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      toast.error('Please fill in Name, Phone, and your Message');
      return;
    }

    setLoading(true);
    try {
      await api.post('/contact', formData);
      setSubmitted(true);
      toast.success('Your message has been sent! Our team will contact you shortly.');
      setFormData({ name: '', phone: '', email: '', shopName: '', message: '' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to send message. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-black selection:text-yellow-300">
      {/* ─── TOP NAVBAR ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-4 border-black px-4 sm:px-8 py-3.5 shadow-[0_4px_0_0_#000]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-yellow-300 border-2 border-black rounded-xl flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_0px_#000]">
              ⚡
            </div>
            <div>
              <span className="font-black text-xl tracking-tight uppercase dark:text-white">OmniManage</span>
              <span className="block text-[10px] font-bold tracking-widest text-slate-500 uppercase -mt-1">
                Support & Inquiries
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-bold">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
              Home
            </Link>
            <Link to="/about" className="hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
              About
            </Link>
            <Link to="/pricing" className="hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
              Pricing
            </Link>
            <Link to="/developer" className="hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
              Developer
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="font-bold text-xs uppercase bg-white dark:bg-slate-800 text-black dark:text-white border-2 border-black px-4 py-2 rounded-xl shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 border-b-4 border-black bg-cyan-300 text-black text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-black text-white px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> We’re Here to Help
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            Get in Touch with Our Team
          </h1>
          <p className="font-bold text-sm sm:text-base max-w-xl mx-auto text-slate-900">
            Have questions about gadget ERP onboarding, multi-branch migration, or custom hardware integrations? Reach out to us.
          </p>
        </div>
      </section>

      {/* ─── CONTACT SECTION & FORM ────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto py-12 sm:py-16 px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] space-y-6">
              <h2 className="text-2xl font-black uppercase dark:text-white">Contact Information</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-300 border-2 border-black rounded-xl flex items-center justify-center flex-shrink-0 text-black">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Official Support Email</div>
                    <a
                      href="mailto:support@respawnalley.com"
                      className="font-black text-sm text-blue-600 dark:text-yellow-400 hover:underline"
                    >
                      support@respawnalley.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-lime-400 border-2 border-black rounded-xl flex items-center justify-center flex-shrink-0 text-black">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Sales & Phone Hotline</div>
                    <a
                      href="tel:+8801700000000"
                      className="font-black text-sm text-slate-900 dark:text-white"
                    >
                      +880 1700-000000 / +880 1800-000000
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-pink-400 border-2 border-black rounded-xl flex items-center justify-center flex-shrink-0 text-black">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Support Hours</div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      Saturday – Thursday: 9:00 AM – 9:00 PM (GMT+6)
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-yellow-300 border-2 border-black rounded-xl flex items-center justify-center flex-shrink-0 text-black">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Office Location</div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      Dhaka & Chattogram Tech Hub, Bangladesh
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-300 p-6 border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black">
              <div className="flex items-center gap-2 font-black text-base uppercase">
                <Headphones className="w-5 h-5" /> Fast Onboarding Support
              </div>
              <p className="text-xs font-bold mt-2 leading-relaxed">
                Need on-site training for your cashiers and repair technicians? Our dedicated engineers are available for deployment assistance.
              </p>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_#000] space-y-6">
              <div>
                <h2 className="text-2xl font-black uppercase dark:text-white">Send Us a Direct Message</h2>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                  Fill out the form below and we will respond via phone/email within a few hours.
                </p>
              </div>

              {submitted ? (
                <div className="bg-lime-100 dark:bg-lime-950/50 border-2 border-lime-500 text-lime-800 dark:text-lime-200 p-6 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-lime-600 dark:text-lime-400 mx-auto" />
                  <h3 className="font-black text-lg">Thank You!</h3>
                  <p className="text-sm font-medium">
                    Your inquiry has been logged in our system. A solution specialist will contact you shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-2 font-bold text-xs uppercase bg-black text-white px-4 py-2 rounded-xl"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Tanvir Ahmed"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-black rounded-xl text-sm font-medium focus:outline-none focus:bg-amber-50 dark:focus:bg-slate-700 transition-all shadow-[2px_2px_0px_0px_#000]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. 01712345678"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-black rounded-xl text-sm font-medium focus:outline-none focus:bg-amber-50 dark:focus:bg-slate-700 transition-all shadow-[2px_2px_0px_0px_#000]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@company.com"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-black rounded-xl text-sm font-medium focus:outline-none focus:bg-amber-50 dark:focus:bg-slate-700 transition-all shadow-[2px_2px_0px_0px_#000]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Shop / Business Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.shopName}
                        onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                        placeholder="e.g. Gadget Planet & Care"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-black rounded-xl text-sm font-medium focus:outline-none focus:bg-amber-50 dark:focus:bg-slate-700 transition-all shadow-[2px_2px_0px_0px_#000]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Message / Requirements *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your branches, POS needs, or any questions..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-black rounded-xl text-sm font-medium focus:outline-none focus:bg-amber-50 dark:focus:bg-slate-700 transition-all shadow-[2px_2px_0px_0px_#000]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 font-black text-sm uppercase bg-yellow-300 hover:bg-yellow-400 text-black border-3 border-black py-3.5 rounded-xl shadow-[4px_4px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      'Sending Message...'
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Send Inquiry Now
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ─── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 sm:px-8 bg-black text-white border-t-4 border-black">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold">
          <div>&copy; {new Date().getFullYear()} OmniManage ERP Inc. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-yellow-400 transition-colors">About</Link>
            <Link to="/terms" className="hover:text-yellow-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-yellow-400 transition-colors">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-yellow-400 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
