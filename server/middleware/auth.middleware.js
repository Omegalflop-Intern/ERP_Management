import { db } from '../config/db.knex.js';
import { verifyToken } from '../utils/auth/generateToken.js';
import { ApiError } from '../utils/http/ApiError.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.query?.token) {
      // SSE EventSource cannot set headers — query string is the only auth method
      token = req.query.token;
    }
    if (!token) throw ApiError.unauthorized('No token provided');

    const decoded = verifyToken(token);
    const userId = decoded.id || decoded.userId;

    const row = await db('users')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .leftJoin('tenants', 'users.tenant_id', 'tenants.id')
      .where({ 'users.id': userId, 'users.is_deleted': false, 'users.is_active': true })
      .select(
        'users.*',
        'roles.name as role_name_val',
        'roles.permissions as role_perms_val',
        'tenants.status as tenant_status',
        'tenants.is_deleted as tenant_is_deleted'
      )
      .first();

    if (!row) throw ApiError.unauthorized('User not found or deactivated');

    const isSuperAdmin = !row.tenant_id && (row.role_name_val || row.role_name || '').toUpperCase() === 'ADMIN';

    if (row.tenant_id && !isSuperAdmin) {
      if (Boolean(row.tenant_is_deleted) || (row.tenant_status && row.tenant_status !== 'ACTIVE')) {
        throw ApiError.forbidden(`Shop account is ${row.tenant_status === 'SUSPENDED' ? 'suspended' : 'deleted or inactive'}. Access denied.`);
      }
    }

    let permissions = row.role_perms_val;
    if (typeof permissions === 'string') {
      try { permissions = JSON.parse(permissions); } catch { permissions = []; }
    }

    const roleName = row.role_name_val || row.role_name || '';

    req.user = {
      _id: String(row.id),
      id: row.id,
      userId: String(row.id),
      username: row.username,
      email: row.email,
      fullName: row.full_name || row.username,
      phone: row.phone || '',
      role: row.role_id,
      roleName,
      isSuperAdmin,
      tenantId: row.tenant_id || null,
      permissions: Array.isArray(permissions) ? permissions : [],
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) return next();

    const decoded = verifyToken(token);
    const userId = decoded.id || decoded.userId;
    if (!userId) return next();

    const row = await db('users')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where({ 'users.id': userId, 'users.is_deleted': false, 'users.is_active': true })
      .select('users.*', 'roles.name as role_name_val')
      .first();

    if (row) {
      const isSuperAdmin = !row.tenant_id && (row.role_name_val || row.role_name || '').toUpperCase() === 'ADMIN';
      req.user = {
        _id: String(row.id),
        id: row.id,
        username: row.username,
        roleName: row.role_name_val || row.role_name || '',
        isSuperAdmin,
        tenantId: row.tenant_id || null,
      };
    }
  } catch {}
  next();
};

