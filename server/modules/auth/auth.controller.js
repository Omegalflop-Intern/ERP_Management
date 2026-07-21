import * as authService from './auth.service.js';
import * as mfaService from './mfa.service.js';
import { Session } from './session.model.js';
import { User } from '../user/user.model.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { logAction, logSecurityEvent } from '../../utils/auth/auditLog.js';
import { trackFailedLogin, clearFailedLogin } from '../../middleware/security.middleware.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
};

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
};

const setAccessCookie = (res, accessToken) => {
  res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
};

export const login = async (req, res, next) => {
  try {
    const { login, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    const user = await authService.findUserByLogin(login);
    if (!user) {
      const attempts = trackFailedLogin(req, login);
      logSecurityEvent({
        action: 'LOGIN_FAILED',
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || '',
        details: { login, reason: 'User not found', attempts },
        severity: 'low',
      });
      throw ApiError.unauthorized('Invalid credentials');
    }
    
    const isMatch = await authService.verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      const attempts = trackFailedLogin(req, login);
      logSecurityEvent({
        action: 'LOGIN_FAILED',
        userId: user._id,
        username: user.username,
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || '',
        details: { login, reason: 'Invalid password', attempts },
        severity: 'medium',
      });
      throw ApiError.unauthorized('Invalid credentials');
    }
    
    if (!user.isActive) {
      logSecurityEvent({
        action: 'LOGIN_FAILED',
        userId: user._id,
        username: user.username,
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || '',
        details: { login, reason: 'Account deactivated' },
        severity: 'medium',
      });
      throw ApiError.forbidden('Account is deactivated');
    }

    clearFailedLogin(login, ip);
    
    if (process.env.NODE_ENV === 'development') {
      const otpCode = authService.generateOTP();
      user.otpCode = otpCode;
      user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();
      const mailRes = await authService.sendOTP(user.email, otpCode, user.fullName || user.username);
      // NOTE: OTP preview only logged to server console — never sent to client
      if (mailRes?.previewUrl) {
        console.log(`[OTP-DEV] Nodemailer preview URL: ${mailRes.previewUrl}`);
      }
      logAction({ userId: user._id, username: user.username, action: 'LOGIN_OTP_SENT', module: 'auth', entityType: 'User', details: { login }, req });
      return ApiResponse.success(res, { email: user.email }, 'OTP sent to your email');
    }

    const { accessToken, refreshToken } = authService.issueTokens(user);
    logAction({ userId: user._id, username: user.username, action: 'LOGIN', module: 'auth', entityType: 'User', details: { login }, req });
    setRefreshCookie(res, refreshToken);
    setAccessCookie(res, accessToken);
    return ApiResponse.success(res, { token: accessToken, user: authService.sanitizeUser(user) }, 'Login successful');
  } catch (error) { next(error); }
};

export const loginDirect = async (req, res, next) => {
  try {
    const { login, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    const user = await authService.findUserByLogin(login);
    if (!user) {
      const attempts = trackFailedLogin(req, login);
      logSecurityEvent({
        action: 'LOGIN_FAILED',
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || '',
        details: { login, reason: 'User not found', attempts },
        severity: 'low',
      });
      throw ApiError.unauthorized('Invalid credentials');
    }
    
    const isMatch = await authService.verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      const attempts = trackFailedLogin(req, login);
      logSecurityEvent({
        action: 'LOGIN_FAILED',
        userId: user._id,
        username: user.username,
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || '',
        details: { login, reason: 'Invalid password', attempts },
        severity: 'medium',
      });
      throw ApiError.unauthorized('Invalid credentials');
    }
    
    if (!user.isActive) {
      logSecurityEvent({
        action: 'LOGIN_FAILED',
        userId: user._id,
        username: user.username,
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || '',
        details: { login, reason: 'Account deactivated' },
        severity: 'medium',
      });
      throw ApiError.forbidden('Account is deactivated');
    }

    if (!user.isVerified) {
      logSecurityEvent({
        action: 'LOGIN_BLOCKED',
        userId: user._id,
        username: user.username,
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || '',
        details: { login, reason: 'Email not verified' },
        severity: 'low',
      });
      return ApiResponse.success(res, {
        requiresVerification: true,
        email: user.email,
      }, 'Please verify your email before logging in');
    }

    clearFailedLogin(login, ip);
    const { accessToken, refreshToken } = authService.issueTokens(user);
    logAction({ userId: user._id, username: user.username, action: 'LOGIN', module: 'auth', entityType: 'User', details: { login }, req });
    setRefreshCookie(res, refreshToken);
    setAccessCookie(res, accessToken);
    return ApiResponse.success(res, { token: accessToken, user: authService.sanitizeUser(user) }, 'Login successful');
  } catch (error) { next(error); }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;
    const user = await authService.verifyOTP(email, otpCode);
    const { accessToken, refreshToken } = authService.issueTokens(user);
    logAction({ userId: user._id, username: user.username, action: 'OTP_VERIFIED', module: 'auth', entityType: 'User', details: { email }, req });
    setRefreshCookie(res, refreshToken);
    setAccessCookie(res, accessToken);
    return ApiResponse.success(res, { token: accessToken, user: authService.sanitizeUser(user) }, 'Verification successful');
  } catch (error) { next(error); }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    if (!token) throw ApiError.unauthorized('No refresh token provided');
    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(token);
    setRefreshCookie(res, newRefreshToken);
    setAccessCookie(res, accessToken);
    return ApiResponse.success(res, { token: accessToken }, 'Token refreshed');
  } catch (error) { next(ApiError.unauthorized('Invalid or expired refresh token')); }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.findUserByLogin(req.user.username);
    if (!user) throw ApiError.unauthorized('User not found');
    return ApiResponse.success(res, { user: authService.sanitizeUser(user) }, 'User profile');
  } catch (error) { next(error); }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    logAction({ userId: null, username: null, action: 'FORGOT_PASSWORD', module: 'auth', entityType: 'User', details: { email }, req });
    return ApiResponse.success(res, { email: result.email }, 'Password reset link sent');
  } catch (error) { next(error); }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    logAction({ userId: null, username: null, action: 'RESET_PASSWORD', module: 'auth', entityType: 'User', req });
    return ApiResponse.success(res, null, 'Password reset successful');
  } catch (error) { next(error); }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;
    const user = await authService.verifyEmail(email, otpCode);
    const { accessToken, refreshToken } = authService.issueTokens(user);
    logAction({ userId: user._id, username: user.username, action: 'EMAIL_VERIFIED', module: 'auth', entityType: 'User', details: { email }, req });
    setRefreshCookie(res, refreshToken);
    setAccessCookie(res, accessToken);
    return ApiResponse.success(res, { token: accessToken, user: authService.sanitizeUser(user) }, 'Email verified successfully');
  } catch (error) { next(error); }
};

export const resendVerificationOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resendVerificationOTP(email);
    logAction({ userId: null, username: null, action: 'RESEND_VERIFICATION_OTP', module: 'auth', entityType: 'User', details: { email }, req });
    return ApiResponse.success(res, { email: result.email }, 'Verification OTP sent to your email');
  } catch (error) { next(error); }
};

export const logout = async (req, res, next) => {
  try {
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (refreshToken) {
      await Session.updateOne({ refreshToken }, { isValid: false });
    }
    res.clearCookie('refreshToken', cookieOpts);
    res.clearCookie('accessToken', cookieOpts);
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) { next(error); }
};

export const setupMFA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw ApiError.notFound('User not found');
    const { secret, otpauthUrl } = mfaService.generateMfaSecret(user.username);
    const backupCodes = mfaService.generateBackupCodes(8);
    user.mfaSecret = secret;
    user.mfaBackupCodes = backupCodes;
    await user.save();
    logAction({ userId: user._id, username: user.username, action: 'MFA_SETUP_INITIATED', module: 'auth', req });
    return ApiResponse.success(res, { secret, otpauthUrl, backupCodes }, 'MFA setup initiated');
  } catch (error) { next(error); }
};

export const verifyMFA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id).select('+mfaSecret +mfaBackupCodes');
    if (!user || !user.mfaSecret) throw ApiError.badRequest('MFA is not initiated');
    const isValid = mfaService.verifyTOTP(user.mfaSecret, token);
    if (!isValid) throw ApiError.badRequest('Invalid MFA code');
    user.isMfaEnabled = true;
    await user.save();
    logAction({ userId: user._id, username: user.username, action: 'MFA_ENABLED', module: 'auth', req });
    return ApiResponse.success(res, null, '2FA enabled successfully');
  } catch (error) { next(error); }
};

export const listSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ userId: req.user._id, isValid: true })
      .sort({ createdAt: -1 })
      .limit(20);
    return ApiResponse.success(res, { sessions }, 'Active sessions retrieved');
  } catch (error) { next(error); }
};

export const logoutAllSessions = async (req, res, next) => {
  try {
    const targetUserId = req.body.userId || req.user._id;
    await Session.updateMany({ userId: targetUserId, isValid: true }, { isValid: false });
    logAction({ userId: req.user._id, username: req.user.username, action: 'LOGOUT_ALL_SESSIONS', module: 'auth', details: { targetUserId }, req });
    return ApiResponse.success(res, null, 'All active sessions terminated');
  } catch (error) { next(error); }
};

