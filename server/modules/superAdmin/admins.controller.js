import bcrypt from 'bcryptjs';
import { db } from '../../config/db.knex.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';
import { ApiError } from '../../utils/http/ApiError.js';

// GET /api/v1/super-admin/admins — list all platform-level admins
export const listSystemAdmins = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('users')
      .whereNull('tenant_id')
      .where({ is_deleted: false });

    if (search) {
      query = query.where((q) =>
        q
          .whereILike('username', `%${search}%`)
          .orWhereILike('full_name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
      );
    }

    const [{ total }] = await query.clone().count('id as total');
    const admins = await query
      .select('id', 'username', 'full_name', 'email', 'phone', 'avatar', 'is_active', 'is_verified', 'created_at', 'updated_at')
      .orderBy('created_at', 'asc')
      .limit(Number(limit))
      .offset(offset);

    res.json(
      new ApiResponse(true, 'System admins fetched', admins, {
        total: Number(total),
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(Number(total) / Number(limit)),
      })
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/super-admin/admins — create a new system admin
export const createSystemAdmin = async (req, res, next) => {
  try {
    const { username, email, phone, fullName, password } = req.body;

    if (!username || !email || !password) {
      throw new ApiError(400, 'username, email, and password are required');
    }

    const existing = await db('users')
      .where({ username })
      .orWhere({ email })
      .first();

    if (existing) {
      throw new ApiError(409, 'Username or email already in use');
    }

    let adminRole = await db('roles').where({ name: 'ADMIN', is_deleted: false }).first();
    if (!adminRole) throw new ApiError(500, 'ADMIN role not found. Run seed first.');

    const passwordHash = await bcrypt.hash(password, 10);

    const [id] = await db('users').insert({
      username,
      email,
      phone: phone || null,
      full_name: fullName || username,
      password_hash: passwordHash,
      role_id: adminRole.id,
      role_name: 'ADMIN',
      is_verified: true,
      is_active: true,
      tenant_id: null,
    });

    const created = await db('users')
      .where({ id })
      .select('id', 'username', 'full_name', 'email', 'phone', 'is_active', 'created_at')
      .first();

    res.status(201).json(new ApiResponse(true, 'System admin created', created));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/super-admin/admins/:id — update system admin info
export const updateSystemAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone } = req.body;

    const admin = await db('users').whereNull('tenant_id').where({ id, is_deleted: false }).first();
    if (!admin) throw new ApiError(404, 'System admin not found');

    // Prevent self-edit breaking things (allow basic info update)
    const updates = {};
    if (fullName) updates.full_name = fullName;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone;

    await db('users').where({ id }).update({ ...updates, updated_at: db.fn.now() });

    const updated = await db('users')
      .where({ id })
      .select('id', 'username', 'full_name', 'email', 'phone', 'is_active', 'updated_at')
      .first();

    res.json(new ApiResponse(true, 'System admin updated', updated));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/super-admin/admins/:id/toggle-active
export const toggleAdminActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id;

    if (Number(id) === Number(requesterId)) {
      throw new ApiError(400, 'You cannot deactivate your own account');
    }

    const admin = await db('users').whereNull('tenant_id').where({ id, is_deleted: false }).first();
    if (!admin) throw new ApiError(404, 'System admin not found');

    await db('users').where({ id }).update({ is_active: !admin.is_active });

    res.json(new ApiResponse(true, `Admin ${admin.is_active ? 'deactivated' : 'activated'}`, { id: Number(id), isActive: !admin.is_active }));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/super-admin/admins/:id — soft delete
export const deleteSystemAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id;

    if (Number(id) === Number(requesterId)) {
      throw new ApiError(400, 'You cannot delete your own account');
    }

    const admin = await db('users').whereNull('tenant_id').where({ id, is_deleted: false }).first();
    if (!admin) throw new ApiError(404, 'System admin not found');

    await db('users').where({ id }).update({ is_deleted: true, is_active: false });

    res.json(new ApiResponse(true, 'System admin removed'));
  } catch (err) {
    next(err);
  }
};
