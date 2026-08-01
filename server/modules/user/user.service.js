import bcrypt from 'bcryptjs';
import { User } from './user.model.js';
import { Role } from '../role/role.model.js';
import { Employee } from '../employee/employee.model.js';
import { ApiError } from '../../utils/http/ApiError.js';
import { paginate, getPagination } from '../../utils/http/pagination.js';
import { escapeRegex } from '../../utils/system/helpers.js';
import { generateOTP, sendOTP } from '../auth/auth.service.js';

export const getAllUsers = async (page = 1, limit = 20, search = '') => {
  const query = { isDeleted: false };

  if (search) {
    const safeSearch = escapeRegex(search);
    query.$or = [
      { username: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
      { fullName: { $regex: safeSearch, $options: 'i' } },
      { phone: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(query);
  const users = await paginate(
    User.find(query).populate('role', 'name displayName permissions'),
    page, limit
  ).sort({ createdAt: -1 });

  return { users, pagination: getPagination(total, page, limit) };
};

export const getUserById = async (id) => {
  const user = await User.findOne({ _id: id, isDeleted: false }).populate('role', 'name displayName permissions');
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

export const createUser = async (data) => {
  if (data.phone && typeof data.phone === 'string' && !data.phone.trim()) {
    delete data.phone;
  }

  const existingUser = await User.findOne({
    $or: [{ username: data.username }, { email: data.email }],
    isDeleted: false,
  });

  if (existingUser) {
    if (existingUser.username === data.username) throw ApiError.conflict('Username already exists');
    if (existingUser.email === data.email) throw ApiError.conflict('Email already exists');
  }

  if (data.phone) {
    const existingPhone = await User.findOne({ phone: data.phone, isDeleted: false });
    if (existingPhone) throw ApiError.conflict('Phone number already exists');
  }

  const role = await Role.findOne({ _id: data.role, isDeleted: false });
  if (!role) throw ApiError.badRequest('Invalid role');

  const passwordHash = await bcrypt.hash(data.password, 10);
  const otpCode = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = await User.create({
    ...data,
    passwordHash,
    roleName: role.name,
    isVerified: false,
    otpCode,
    otpExpiresAt,
  });

  // Auto-create corresponding Employee profile if not exists
  try {
    const existingEmployee = await Employee.findOne({ user: user._id, isDeleted: false });
    if (!existingEmployee) {
      await Employee.create({
        user: user._id,
        employeeId: `EMP-${Math.floor(10000 + Math.random() * 90000)}`,
        name: user.fullName || user.username,
        phone: user.phone || '0000000000',
        email: user.email || '',
        designation: role.displayName || role.name || 'Staff',
        department: 'General',
        branch: user.branchId || 'Main',
        salary: 0,
        joiningDate: new Date(),
      });
    }
  } catch (empErr) {
    console.error(`[USER] Auto employee creation failed for user ${user._id}:`, empErr.message);
  }

  // Send verification OTP email to user's mail (non-blocking)
  sendOTP(user.email, otpCode, user.fullName || user.username).catch((err) => {
    console.error(`[USER] Failed to send verification OTP to ${user.email}:`, err.message);
  });

  const userObj = user.toObject();
  delete userObj.passwordHash;
  delete userObj.otpExpiresAt;
  return userObj;
};

export const updateUser = async (id, data) => {
  if (data.phone && typeof data.phone === 'string' && !data.phone.trim()) {
    data.phone = undefined;
  }

  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user) throw ApiError.notFound('User not found');

  if (data.username && data.username !== user.username) {
    const existing = await User.findOne({ username: data.username, isDeleted: false, _id: { $ne: id } });
    if (existing) throw ApiError.conflict('Username already exists');
  }

  if (data.email && data.email !== user.email) {
    const existing = await User.findOne({ email: data.email, isDeleted: false, _id: { $ne: id } });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  if (data.phone && data.phone !== user.phone) {
    const existing = await User.findOne({ phone: data.phone, isDeleted: false, _id: { $ne: id } });
    if (existing) throw ApiError.conflict('Phone number already exists');
  }

  if (data.role) {
    const role = await Role.findOne({ _id: data.role, isDeleted: false });
    if (!role) throw ApiError.badRequest('Invalid role');
    data.roleName = role.name;
  }

  const allowed = ['fullName', 'email', 'phone', 'username', 'role', 'roleName', 'isActive', 'branchId', 'commissionRate'];
  allowed.forEach(key => { if (data[key] !== undefined) user[key] = data[key]; });
  await user.save();

  // Sync corresponding Employee profile
  try {
    const roleObj = data.role ? await Role.findOne({ _id: data.role, isDeleted: false }) : null;
    await Employee.findOneAndUpdate(
      { user: user._id, isDeleted: false },
      {
        $set: {
          name: user.fullName || user.username,
          phone: user.phone || '0000000000',
          email: user.email || '',
          ...(roleObj ? { designation: roleObj.displayName || roleObj.name } : {}),
          ...(data.branchId ? { branch: data.branchId } : {}),
        },
      },
      { upsert: false }
    );
  } catch (empErr) {
    console.error(`[USER] Employee sync failed for user ${user._id}:`, empErr.message);
  }

  return user;
};

export const deleteUser = async (id) => {
  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user) throw ApiError.notFound('User not found');
  user.isDeleted = true;
  await user.save();
  return user;
};

export const toggleVerification = async (id) => {
  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user) throw ApiError.notFound('User not found');
  user.isVerified = !user.isVerified;
  await user.save();
  return user;
};

export const changePassword = async (id, currentPassword, newPassword) => {
  const user = await User.findOne({ _id: id, isDeleted: false }).select('+passwordHash');
  if (!user) throw ApiError.notFound('User not found');

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  return user;
};

export const getMyProfile = async (userId) => {
  const user = await User.findOne({ _id: userId, isDeleted: false })
    .populate('role', 'name displayName permissions')
    .lean();
  if (!user) throw ApiError.notFound('User not found');
  delete user.passwordHash;
  delete user.refreshToken;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.otpCode;
  delete user.otpExpiresAt;
  return user;
};

export const updateMyProfile = async (userId, data, file) => {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) throw ApiError.notFound('User not found');

  if (data.email && data.email !== user.email) {
    const existing = await User.findOne({ email: data.email, isDeleted: false, _id: { $ne: userId } });
    if (existing) throw ApiError.conflict('Email already exists');
  }
  if (data.phone && data.phone !== user.phone) {
    const existing = await User.findOne({ phone: data.phone, isDeleted: false, _id: { $ne: userId } });
    if (existing) throw ApiError.conflict('Phone number already exists');
  }
  if (data.username && data.username !== user.username) {
    const existing = await User.findOne({ username: data.username, isDeleted: false, _id: { $ne: userId } });
    if (existing) throw ApiError.conflict('Username already exists');
  }

  if (file) {
    data.avatar = `/uploads/avatars/${file.filename}`;
  }

  const allowed = ['fullName', 'email', 'phone', 'username', 'avatar'];
  allowed.forEach(key => { if (data[key] !== undefined) user[key] = data[key]; });
  await user.save();

  const updated = await User.findOne({ _id: userId, isDeleted: false })
    .populate('role', 'name displayName permissions')
    .lean();
  delete updated.passwordHash;
  delete updated.refreshToken;
  delete updated.passwordResetToken;
  delete updated.passwordResetExpires;
  delete updated.otpCode;
  delete updated.otpExpiresAt;
  return updated;
};
