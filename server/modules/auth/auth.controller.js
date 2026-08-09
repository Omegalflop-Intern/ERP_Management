import * as authService from './auth.service.js';
import * as mfaService from './mfa.service.js';
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
    const tenantId = req.tenantContext?.tenantId || req.user?.tenantId || null;
    
    const user = await authService.findUserByLogin(login, tenantId);
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

    if (!user.isVerified) {
      const otpCode = authService.generateOTP();
      user.otpCode = otpCode;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      const mailRes = await authService.sendOTP(user.email, otpCode, user.fullName || user.username);
      if (mailRes?.previewUrl) {
        console.log(`[OTP-DEV] Nodemailer preview URL: ${mailRes.previewUrl}`);
      }
      logAction({ userId: user._id, username: user.username, action: 'LOGIN_OTP_SENT', module: 'auth', entityType: 'User', details: { login }, req });
      return ApiResponse.success(res, { requiresOtp: true, email: user.email }, 'OTP sent to your email');
    }

    const { accessToken, refreshToken } = authService.issueTokens(user);
    logAction({ userId: user._id, username: user.username, action: 'LOGIN', module: 'auth', entityType: 'User', details: { login }, req });
    setRefreshCookie(res, refreshToken);
    setAccessCookie(res, accessToken);
    return ApiResponse.success(res, { token: accessToken, user: await authService.sanitizeUser(user) }, 'Login successful');
  } catch (error) { next(error); }
};

export const loginDirect = async (req, res, next) => {
  try {
    const { login, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const tenantId = req.tenantContext?.tenantId || req.user?.tenantId || null;
    
    const user = await authService.findUserByLogin(login, tenantId);
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

    // Check tenant status — block PAUSED and PENDING_KYC tenants from logging in
    if (user.tenantId) {
      const { getTenantById } = await import('../tenant/tenant.service.js');
      const tenant = await getTenantById(user.tenantId).catch(() => null);
      if (tenant) {
        if (tenant.status === 'PAUSED') {
          logSecurityEvent({
            action: 'LOGIN_BLOCKED',
            userId: user._id,
            username: user.username,
            ipAddress: ip,
            userAgent: req.headers['user-agent'] || '',
            details: { login, reason: 'Tenant account suspended', tenantId: user.tenantId },
            severity: 'medium',
          });
          throw ApiError.forbidden('Your shop account has been suspended. Please contact billing support.');
        }
        if (tenant.status === 'PENDING_KYC') {
          logSecurityEvent({
            action: 'LOGIN_BLOCKED',
            userId: user._id,
            username: user.username,
            ipAddress: ip,
            userAgent: req.headers['user-agent'] || '',
            details: { login, reason: 'Tenant pending KYC verification', tenantId: user.tenantId },
            severity: 'low',
          });
          throw ApiError.forbidden('Your shop account is pending KYC verification. Please wait for administrator approval.');
        }
      }
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
      const otpCode = authService.generateOTP();
      user.otpCode = otpCode;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      const mailRes = await authService.sendOTP(user.email, otpCode, user.fullName || user.username);
      if (mailRes?.previewUrl) {
        console.log(`[OTP-DEV] Nodemailer preview URL: ${mailRes.previewUrl}`);
      }
      return ApiResponse.success(res, {
        requiresOtp: true,
        email: user.email,
      }, 'OTP sent to your email. Please verify to continue.');
    }

    clearFailedLogin(login, ip);
    const { accessToken, refreshToken } = authService.issueTokens(user);
    logAction({ userId: user._id, username: user.username, action: 'LOGIN', module: 'auth', entityType: 'User', details: { login }, req });
    setRefreshCookie(res, refreshToken);
    setAccessCookie(res, accessToken);
    return ApiResponse.success(res, { token: accessToken, user: await authService.sanitizeUser(user) }, 'Login successful');
  } catch (error) { next(error); }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;
    const tenantId = req.tenantContext?.tenantId || req.user?.tenantId || null;
    const user = await authService.verifyOTP(email, otpCode, tenantId);
    const { accessToken, refreshToken } = authService.issueTokens(user);
    logAction({ userId: user._id, username: user.username, action: 'OTP_VERIFIED', module: 'auth', entityType: 'User', details: { email }, req });
    setRefreshCookie(res, refreshToken);
    setAccessCookie(res, accessToken);
    return ApiResponse.success(res, { token: accessToken, user: await authService.sanitizeUser(user) }, 'Verification successful');
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
    const tenantId = req.tenantContext?.tenantId || req.user?.tenantId || null;
    const user = await authService.findUserByLogin(req.user.username, tenantId);
    if (!user) throw ApiError.unauthorized('User not found');
    return ApiResponse.success(res, { user: await authService.sanitizeUser(user) }, 'User profile');
  } catch (error) { next(error); }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const tenantId = req.tenantContext?.tenantId || req.user?.tenantId || null;
    const result = await authService.forgotPassword(email, tenantId);
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
    const tenantId = req.tenantContext?.tenantId || req.user?.tenantId || null;
    const user = await authService.verifyEmail(email, otpCode, tenantId);
    const { accessToken, refreshToken } = authService.issueTokens(user);
    logAction({ userId: user._id, username: user.username, action: 'EMAIL_VERIFIED', module: 'auth', entityType: 'User', details: { email }, req });
    setRefreshCookie(res, refreshToken);
    setAccessCookie(res, accessToken);
    return ApiResponse.success(res, { token: accessToken, user: await authService.sanitizeUser(user) }, 'Email verified successfully');
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
      await authService.invalidateSession(refreshToken);
    }
    res.clearCookie('refreshToken', cookieOpts);
    res.clearCookie('accessToken', cookieOpts);
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) { next(error); }
};

export const setupMFA = async (req, res, next) => {
  try {
    const username = req.user?.username || 'user';
    const { secret, otpauthUrl } = mfaService.generateMfaSecret(username);
    const backupCodes = mfaService.generateBackupCodes(8);
    logAction({ userId: req.user.id || req.user._id, username, action: 'MFA_SETUP_INITIATED', module: 'auth', req });
    return ApiResponse.success(res, { secret, otpauthUrl, backupCodes }, 'MFA setup initiated');
  } catch (error) { next(error); }
};

export const verifyMFA = async (req, res, next) => {
  try {
    const { token, secret } = req.body;
    if (!secret) throw ApiError.badRequest('MFA secret required');
    const isValid = mfaService.verifyTOTP(secret, token);
    if (!isValid) throw ApiError.badRequest('Invalid MFA code');
    logAction({ userId: req.user.id || req.user._id, username: req.user.username, action: 'MFA_ENABLED', module: 'auth', req });
    return ApiResponse.success(res, null, '2FA enabled successfully');
  } catch (error) { next(error); }
};

export const listSessions = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const sessions = await authService.listUserSessions(userId);
    return ApiResponse.success(res, { sessions }, 'Active sessions retrieved');
  } catch (error) { next(error); }
};

export const logoutAllSessions = async (req, res, next) => {
  try {
    const targetUserId = req.body.userId || req.user.id || req.user._id;
    await authService.invalidateAllUserSessions(targetUserId);
    logAction({ userId: req.user.id || req.user._id, username: req.user.username, action: 'LOGOUT_ALL_SESSIONS', module: 'auth', details: { targetUserId }, req });
    return ApiResponse.success(res, null, 'All active sessions terminated');
  } catch (error) { next(error); }
};

