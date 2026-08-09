import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Smartphone,
  User,
  Mail,
  Phone,
  Lock,
  Upload,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import PasswordInput from '../../components/ui/PasswordInput';

export default function RegisterShop() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    shopName: '',
    ownerName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    nidNumber: '',
    tradeLicenseNumber: '',
  });

  const [files, setFiles] = useState({
    logo: null,
    nidFront: null,
    nidBack: null,
    tradeLicenseFile: null,
    tinCertificate: null,
  });

  const handleFileChange = (e, key) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File size exceeds 15MB limit');
        return;
      }
      setFiles((prev) => ({ ...prev, [key]: file }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Create Tenant Account
      const res = await api.post('/tenants', {
        shopName: form.shopName,
        ownerName: form.ownerName,
        username: form.username,
        email: form.email,
        phone: form.phone,
        nidNumber: form.nidNumber,
        tradeLicenseNumber: form.tradeLicenseNumber,
        password: form.password,
      });

      const tenantId = res.data?.data?._id;

      // Upload Shop Logo if provided
      if (tenantId && files.logo) {
        const logoFd = new FormData();
        logoFd.append('logo', files.logo);
        await api.post(`/tenants/${tenantId}/logo-upload`, logoFd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Upload KYC Documents if files provided
      if (tenantId && (files.nidFront || files.tradeLicenseFile)) {
        const fd = new FormData();
        if (files.nidFront) fd.append('nidFront', files.nidFront);
        if (files.nidBack) fd.append('nidBack', files.nidBack);
        if (files.tradeLicenseFile) fd.append('tradeLicenseFile', files.tradeLicenseFile);
        if (files.tinCertificate) fd.append('tinCertificate', files.tinCertificate);

        await api.post(`/tenants/${tenantId}/kyc-upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success('Registration successful! Please verify your email OTP.');
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute w-[500px] h-[500px] -top-40 -left-40 rounded-full blur-[120px] bg-blue-500/10 animate-drift pointer-events-none" />
      <div
        className="absolute w-[400px] h-[400px] -bottom-32 -right-32 rounded-full blur-[100px] bg-cyan-500/8 animate-drift pointer-events-none"
        style={{ animationDelay: '3s' }}
      />
      <div className="w-full max-w-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.1] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 backdrop-blur-[36px] saturate-[1.9] relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/25 to-cyan-500/10 border border-blue-400/30 flex items-center justify-center mx-auto text-[#2563EB] backdrop-blur-xl shadow-lg shadow-blue-500/10">
            <Smartphone className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Register Your Mobile Shop</h1>
          <p className="text-xs text-slate-400">
            Onboard your shop to the Enterprise Mobile Shop ERP SaaS Platform
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 text-xs font-semibold text-slate-400">
          <span className={step >= 1 ? 'text-[#2563EB] font-bold' : ''}>1. Shop Info</span>
          <span className={step >= 2 ? 'text-[#2563EB] font-bold' : ''}>2. Owner & NID</span>
          <span className={step >= 3 ? 'text-[#2563EB] font-bold' : ''}>
            3. Trade License & KYC
          </span>
        </div>

        {/* Form Wizard */}
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          {/* Step 1: Shop Info */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  Mobile Shop Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={form.shopName}
                    onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                    placeholder="e.g. Rahim Telecom & Mobile Sales"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  Shop Logo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'logo')}
                    className="flex-1 text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600/90 file:backdrop-blur-md file:text-white file:font-semibold file:text-xs"
                  />
                  {files.logo && (
                    <img
                      src={URL.createObjectURL(files.logo)}
                      alt="Logo preview"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-600"
                    />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Your shop logo will appear on receipts and invoices
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!form.shopName) {
                      toast.error('Please enter Mobile Shop Name');
                      return;
                    }
                    setStep(2);
                  }}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-1.5"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Owner Info & NID */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">
                    Owner Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    placeholder="Abdur Rahim"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="owner@rahimtelecom.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Username *</label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        username: e.target.value.toLowerCase().replace(/\s+/g, ''),
                      })
                    }
                    placeholder="e.g. rahim_owner"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01700000000"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">
                    National ID (NID) Number
                  </label>
                  <input
                    type="text"
                    value={form.nidNumber}
                    onChange={(e) => setForm({ ...form, nidNumber: e.target.value })}
                    placeholder="NID 10/17 digit number"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">NID Front Image</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'nidFront')}
                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600/90 file:backdrop-blur-md file:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">NID Back Image</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'nidBack')}
                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600/90 file:backdrop-blur-md file:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-semibold rounded-xl flex items-center gap-1.5 backdrop-blur-md transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!form.ownerName || !form.email || !form.phone) {
                      toast.error('Please enter Owner Name, Email, and Phone');
                      return;
                    }
                    setStep(3);
                  }}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-1.5"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Trade License & Password */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  Trade License Number
                </label>
                <input
                  type="text"
                  value={form.tradeLicenseNumber}
                  onChange={(e) => setForm({ ...form, tradeLicenseNumber: e.target.value })}
                  placeholder="e.g. TRAD/DNCC/012345/2026"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">
                    Trade License Scanned Document
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'tradeLicenseFile')}
                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600/90 file:backdrop-blur-md file:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">
                    TIN / BIN Certificate Document
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'tinCertificate')}
                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600/90 file:backdrop-blur-md file:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Password *</label>
                  <PasswordInput
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 8 characters"
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">
                    Confirm Password *
                  </label>
                  <PasswordInput
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-semibold rounded-xl flex items-center gap-1.5 backdrop-blur-md transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.password}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-blue-500/20 backdrop-blur-md transition-all"
                >
                  Complete Registration & Verify OTP
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="text-center pt-2 border-t border-slate-700/60 text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-[#2563EB] hover:underline font-semibold">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
