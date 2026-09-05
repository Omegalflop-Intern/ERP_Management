import {
  ArrowUp,
  Boxes,
  Code2,
  Facebook,
  FileCheck2,
  FileText,
  Github,
  Globe,
  Heart,
  HelpCircle,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Twitter,
  Wrench,
  Youtube,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function PublicFooter() {
  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'OmniManage ERP',
    platformPhone: '+880 1700-000000',
    platformWhatsApp: '+880 1700-000000',
    platformEmail: 'support@omnimanage.bd',
    platformAddress: 'Dhanmondi, Dhaka - 1209, Bangladesh',
    platformSocials: {
      facebook: 'https://facebook.com/omnimanage',
      twitter: 'https://x.com/omnimanage',
      linkedin: 'https://linkedin.com/company/omnimanage',
      youtube: 'https://youtube.com/@omnimanage',
      instagram: 'https://instagram.com/omnimanage',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/public');
        if (res.data?.data) {
          setPlatformSettings((prev) => ({
            ...prev,
            ...res.data.data,
            platformSocials: {
              ...prev.platformSocials,
              ...(res.data.data.platformSocials || {}),
            },
          }));
        }
      } catch {
        // Fallback defaults retained
      }
    };
    fetchSettings();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socials = platformSettings.platformSocials || {};

  return (
    <footer className="relative bg-slate-950 text-slate-300 border-t border-slate-800/80 overflow-hidden font-sans">
      {/* Subtle background ambient glows */}
      <div className="absolute -top-32 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* Col 1: Brand Info & Company Contacts */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3 group inline-block">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black text-white tracking-tight">
                    {platformSettings.platformName || 'OmniManage'}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                    ERP
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">Gadget & Retail Suite</span>
              </div>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              The next-generation enterprise resource planning platform engineered specifically for
              smartphone retailers, repair labs, and electronics distributors.
            </p>

            {/* Official Company Contact Details */}
            <div className="space-y-1.5 text-xs text-slate-400 pt-1">
              {platformSettings.platformPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <a href={`tel:${platformSettings.platformPhone}`} className="hover:text-white transition-colors">
                    {platformSettings.platformPhone}
                  </a>
                </div>
              )}
              {platformSettings.platformEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a href={`mailto:${platformSettings.platformEmail}`} className="hover:text-white transition-colors">
                    {platformSettings.platformEmail}
                  </a>
                </div>
              )}
              {platformSettings.platformAddress && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{platformSettings.platformAddress}</span>
                </div>
              )}
            </div>

            {/* Official Platform Social Channels */}
            <div className="pt-2 flex items-center gap-2.5">
              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors"
                  aria-label="Facebook - OmniManage"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {socials.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors"
                  aria-label="Twitter/X - OmniManage"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors"
                  aria-label="LinkedIn - OmniManage"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {socials.youtube && (
                <a
                  href={socials.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                  aria-label="YouTube - OmniManage"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-pink-500 transition-colors"
                  aria-label="Instagram - OmniManage"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: ERP Modules */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">ERP Modules</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/#modules" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>IMEI & Serial Tracker</span>
                </Link>
              </li>
              <li>
                <Link to="/#modules" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                  <span>POS & Barcode Billing</span>
                </Link>
              </li>
              <li>
                <Link to="/#modules" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hardware Repairs & Servicing</span>
                </Link>
              </li>
              <li>
                <Link to="/#modules" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-purple-400" />
                  <span>Inventory & Stock Sync</span>
                </Link>
              </li>
              <li>
                <Link to="/#modules" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Double-Entry Accounting</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Developers & Creator */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">Engineering & Architecture</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/developer" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Architect: Salah Uddin Kader</span>
                </Link>
              </li>
              <li>
                <a
                  href="/api-docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Swagger OpenAPI Spec</span>
                </a>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  System Architecture
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Technical Consulting
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Policies */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">Trust & Legal</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-white transition-colors">
                  Refund & Cancellation
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About OmniManage
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Sales & Help
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} OmniManage ERP Solutions. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              Engineered with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> by{' '}
              <a
                href="https://salahuddin.codes"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-slate-200 hover:text-blue-400 underline decoration-blue-500/60 transition-colors"
              >
                Salah Uddin Kader
              </a>{' '}
              for gadget & electronics businesses
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
