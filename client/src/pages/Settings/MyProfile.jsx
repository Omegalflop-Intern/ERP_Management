import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AtSign,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { MFASetupModal } from '../../components/auth/MFASetupModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api, { getAssetUrl } from '../../lib/api';

function PasswordInput({ value, onChange, inputCls }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        className={`${inputCls} !pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function MyProfile() {
  const { user: authUser, setUser } = useAuth();
  const { styled } = useTheme();
  const qc = useQueryClient();
  const fileRef = useRef(null);

  const { data: profileData } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const r = await api.get('/users/me');
      return r.data?.data;
    },
    enabled: !!authUser,
  });

  const user = profileData || authUser;

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    username: '',
  });
  const [formLoaded, setFormLoaded] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  React.useEffect(() => {
    if (user && !formLoaded) {
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || '',
      });
      setFormLoaded(true);
    }
  }, [user, formLoaded]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('fullName', form.fullName);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('username', form.username);
      if (avatarFile) fd.append('avatar', avatarFile);
      const r = await api.put('/users/me', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return r.data;
    },
    onSuccess: (data) => {
      toast.success('Profile updated successfully');
      if (data?.data) {
        const updated = data.data;
        setUser((prev) => {
          const base = prev && typeof prev === 'object' ? prev : {};
          const merged = {
            ...base,
            fullName: updated.fullName ?? base.fullName,
            email: updated.email ?? base.email,
            phone: updated.phone ?? base.phone,
            username: updated.username ?? base.username,
            avatar: updated.avatar ?? base.avatar,
            roleName: updated.roleName || updated.role?.name || base.roleName,
            roleDisplayName: updated.roleDisplayName || updated.role?.displayName || base.roleDisplayName,
            permissions: updated.role?.permissions || updated.permissions || base.permissions || [],
          };
          localStorage.setItem('user', JSON.stringify(merged));
          return merged;
        });
      }
      setAvatarFile(null);
      setAvatarPreview(null);
      qc.invalidateQueries({ queryKey: ['my-profile'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (pwForm.newPassword !== pwForm.confirmPassword) throw new Error('Passwords do not match');
      const r = await api.patch(`/users/${authUser._id || authUser.userId}/change-password`, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      return r.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPassword(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || err.message || 'Password change failed'),
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Max 15MB allowed');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const cardCls = styled
    ? 'neu-card'
    : 'bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800';
  const inputCls = styled
    ? 'neu-input w-full px-4 py-3 rounded-xl text-sm'
    : 'w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] outline-none';
  const btnPrimary = styled
    ? 'neu-btn px-6 py-3 bg-[#2563EB] text-white rounded-xl text-sm font-semibold flex items-center gap-2'
    : 'px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-xs';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <User className="w-6 h-6 text-[#2563EB] dark:text-blue-400" /> My Profile
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account settings</p>
      </div>

      {/* Avatar section */}
      <div className={`${cardCls} p-6`}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
              {avatarPreview || user?.avatar ? (
                <img
                  src={avatarPreview || getAssetUrl(user?.avatar)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 flex items-center justify-center text-3xl font-bold">
                  {user?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {user?.fullName || user?.username}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user?.roleDisplayName || user?.roleName}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Click avatar to change photo (max 15MB)
            </div>
          </div>
        </div>
      </div>

      {/* Profile info form */}
      <div className={`${cardCls} p-6 space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <User className="w-5 h-5 text-red-500" /> Personal Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Username
            </label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            <ShieldCheck className="w-3 h-3" /> {user?.roleDisplayName || user?.roleName || 'User'}
          </span>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className={btnPrimary}
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className={`${cardCls} p-6 space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Lock className="w-5 h-5 text-red-500" /> Change Password
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Current Password
            </label>
            <PasswordInput
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              inputCls={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              New Password
            </label>
            <PasswordInput
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              inputCls={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Confirm Password
            </label>
            <PasswordInput
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              inputCls={inputCls}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => passwordMutation.mutate()}
            disabled={passwordMutation.isPending || !pwForm.currentPassword || !pwForm.newPassword}
            className={`${btnPrimary} !bg-amber-600 hover:!bg-amber-700`}
          >
            {passwordMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication (2FA) Security Section */}
      <div
        className={`${cardCls} p-6 flex flex-col sm:flex-row items-center justify-between gap-4`}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Two-Factor Authentication (2FA)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.isMfaEnabled
                ? '2FA is active on your account.'
                : 'Add an extra layer of security using Authenticator app.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowMfaModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-colors whitespace-nowrap"
        >
          {user?.isMfaEnabled ? 'Manage 2FA' : 'Enable 2FA'}
        </button>
      </div>

      <MFASetupModal isOpen={showMfaModal} onClose={() => setShowMfaModal(false)} />
    </div>
  );
}
