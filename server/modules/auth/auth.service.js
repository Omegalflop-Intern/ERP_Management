import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../user/user.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { sendOTPEmail } from '../../config/mailer.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/auth/generateToken.js';

export const findUserByLogin = async (login) => {
  const user = await User.findOne({
    $or: [
      { username: login },
      { email: login },
      { phone: login },
    ],
    isDeleted: false,
  }).select('+passwordHash').populate('role', 'name displayName permissions');
  return user;
};

export const verifyPassword = async (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};

export const issueTokens = (user) => {
  const payload = {
    userId: user._id,
    username: user.username,
    role: user.role?._id || user.role,
    roleName: user.roleName || user.role?.name || user.role,
  };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  return { accessToken, refreshToken };
};

export const sanitizeUser = (user) => {
  const roleData = user.role;
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    avatar: user.avatar,
    isActive: user.isActive,
    isVerified: user.isVerified,
    branchId: user.branchId,
    roleName: user.roleName || roleData?.name,
    roleDisplayName: roleData?.displayName,
    permissions: roleData?.permissions || [],
  };
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (email, otpCode, userName) => {
  return sendOTPEmail(email, otpCode, userName);
};

const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCKOUT_MINUTES = 15;

export const verifyOTP = async (email, otpCode) => {
  const user = await User.findOne({ email, isDeleted: false }).select('+otpCode +otpExpiresAt +otpAttempts +otpLockedUntil');
  if (!user) throw ApiError.notFound('User not found');

  if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.otpLockedUntil - new Date()) / 60000);
    throw ApiError.badRequest(`Account locked due to too many failed OTP attempts. Try again in ${minutesLeft} minutes`);
  }

  if (user.otpCode !== otpCode || user.otpExpiresAt < new Date()) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      user.otpLockedUntil = new Date(Date.now() + OTP_LOCKOUT_MINUTES * 60 * 1000);
      user.otpAttempts = 0;
    }
    await user.save();
    throw ApiError.badRequest('Invalid or expired OTP code');
  }

  user.otpCode = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  user.otpLockedUntil = null;
  await user.save();

  return user;
};

export const verifyEmail = async (email, otpCode) => {
  const user = await User.findOne({ email, isDeleted: false })
    .select('+otpCode +otpExpiresAt +otpAttempts +otpLockedUntil');
  if (!user) throw ApiError.notFound('User not found');

  if (user.isVerified) {
    throw ApiError.badRequest('Email is already verified');
  }

  if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.otpLockedUntil - new Date()) / 60000);
    throw ApiError.badRequest(`Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes`);
  }

  if (user.otpCode !== otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      user.otpLockedUntil = new Date(Date.now() + OTP_LOCKOUT_MINUTES * 60 * 1000);
      user.otpAttempts = 0;
    }
    await user.save();
    throw ApiError.badRequest('Invalid or expired OTP code');
  }

  user.isVerified = true;
  user.otpCode = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  user.otpLockedUntil = null;
  await user.save();

  return user;
};

export const resendVerificationOTP = async (email) => {
  const user = await User.findOne({ email, isDeleted: false })
    .select('+otpCode +otpExpiresAt +otpAttempts +otpLockedUntil');
  if (!user) throw ApiError.notFound('User not found');
  if (user.isVerified) throw ApiError.badRequest('Email is already verified');

  if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.otpLockedUntil - new Date()) / 60000);
    throw ApiError.badRequest(`Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes`);
  }

  const otpCode = generateOTP();
  user.otpCode = otpCode;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  user.otpAttempts = 0;
  await user.save();

  await sendOTP(user.email, otpCode, user.fullName || user.username);
  return { email: user.email };
};

export const refreshAccessToken = async (refreshToken) => {
  const { verifyToken: verify } = await import('../../utils/auth/generateToken.js');
  const decoded = verify(refreshToken);
  const user = await User.findOne({ _id: decoded.userId, isDeleted: false })
    .populate('role', 'name displayName permissions');
  if (!user) throw ApiError.unauthorized('User not found');

  const payload = {
    userId: user._id,
    username: user.username,
    role: user.role?._id || decoded.role,
    roleName: user.roleName || user.role?.name,
  };
  const accessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);
  return { accessToken, refreshToken: newRefreshToken };
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email, isDeleted: false });
  if (!user) throw ApiError.notFound('No account found with this email');

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetLink = `${clientUrl}/reset-password/${resetToken}`;

  try {
    const { sendPasswordResetEmail } = await import('../../config/mailer.js');
    await sendPasswordResetEmail(user.email, resetLink, user.fullName || user.username);
  } catch (err) {
    console.error('[ForgotPassword] Failed to send email:', err.message);
  }

  return { email };
};

export const resetPassword = async (token, newPassword) => {
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: resetTokenHash,
    passwordResetExpires: { $gt: new Date() },
    isDeleted: false,
  });

  if (!user) throw ApiError.badRequest('Invalid or expired reset token');

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return user;
};
