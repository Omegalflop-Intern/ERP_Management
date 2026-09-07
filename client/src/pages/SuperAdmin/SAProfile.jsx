import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Loader2,
  Camera,
  CheckCircle2,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import api, { getAssetUrl } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold mb-4 ${
        type === 'success'
          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <AlertCircle className="w-4 h-4" />
      )}
      {message}
    </div>
  );
}

export default function SAProfile() {
  const queryClient = useQueryClient();
  const { user: authUser, setUser } = useAuth();
  const [toast, setToast] = useState(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['super-admin-profile'],
    queryFn: async () => {
      const res = await api.get('/super-admin/profile');
      return res.data?.data || res.data;
    },
  });

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    username: '',
  });
  const [formInitialized, setFormInitialized] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  React.useEffect(() => {
    if (profile && !formInitialized) {
      setProfileForm({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        username: profile.username || '',
      });
      setFormInitialized(true);
    }
  }, [profile, formInitialized]);

  const profileMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await api.put('/super-admin/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      setToast({ message: 'Profile updated successfully!', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['super-admin-profile'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-layout-profile'] });
      if (setUser) setUser((prev) => ({ ...prev, ...data }));
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err) => {
      setToast({
        message: err.response?.data?.message || 'Failed to update profile',
        type: 'error',
      });
      setTimeout(() => setToast(null), 4000);
    },
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('fullName', profileForm.fullName);
    fd.append('email', profileForm.email);
    fd.append('phone', profileForm.phone);
    fd.append('username', profileForm.username);
    if (avatarFile) fd.append('avatar', avatarFile);
    profileMutation.mutate(fd);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwError, setPwError] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const passwordMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.patch('/super-admin/profile/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return res.data;
    },
    onSuccess: () => {
      setToast({ message: 'Password changed successfully!', type: 'success' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err) => {
      setPwError(err.response?.data?.message || 'Failed to change password');
      setTimeout(() => setPwError(''), 4000);
    },
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(pwForm.newPassword)) {
      setPwError('Password must contain at least one uppercase letter (A-Z)');
      return;
    }
    if (!/[a-z]/.test(pwForm.newPassword)) {
      setPwError('Password must contain at least one lowercase letter (a-z)');
      return;
    }
    if (!/[0-9]/.test(pwForm.newPassword)) {
      setPwError('Password must contain at least one number (0-9)');
      return;
    }
    passwordMutation.mutate(pwForm);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
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

        {/* Profile Card Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
        </div>

        {/* Password Card Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="space-y-3">
            <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
            <User className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Root Administrator Profile
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personal credentials, avatar image, and cryptographic security credentials
            </p>
          </div>
        </div>
      </div>

      <Toast message={toast?.message} type={toast?.type} />

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Personal Information
            </h2>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="p-6 md:p-8 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black overflow-hidden border-2 border-white dark:border-slate-700 shadow-lg">
                {avatarPreview || profile?.avatar || profile?.profilePhoto ? (
                  <img
                    src={avatarPreview || getAssetUrl(profile?.avatar || profile?.profilePhoto)}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (profileForm.fullName || profile?.username || '?')[0]?.toUpperCase()
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {profileForm.fullName || profile?.username}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-indigo-400" />
                Platform Administrator
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                placeholder="Enter your username"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {profileMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Password Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Change Root Password</h2>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="p-6 md:p-8 space-y-4">
          {pwError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4" />
              {pwError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showNewPw ? 'text' : 'password'}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                placeholder="Enter new password (min 8 chars)"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements Guidance */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>Password Requirements:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Min 8 characters', met: pwForm.newPassword.length >= 8 },
                { label: '1 uppercase letter (A-Z)', met: /[A-Z]/.test(pwForm.newPassword) },
                { label: '1 lowercase letter (a-z)', met: /[a-z]/.test(pwForm.newPassword) },
                { label: '1 number (0-9)', met: /[0-9]/.test(pwForm.newPassword) },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                    item.met
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.met ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showConfirmPw ? 'text' : 'password'}
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {passwordMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
