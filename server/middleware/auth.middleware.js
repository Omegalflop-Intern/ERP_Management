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
      token = req.query.token;
    }
    if (!token) throw ApiError.unauthorized('No token provided');

    const decoded = verifyToken(token);
    const userId = decoded.id || decoded.userId;

    const row = await db('users')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where({ 'users.id': userId, 'users.is_deleted': false, 'users.is_active': true })
      .select('users.*', 'roles.name as role_name_val', 'roles.permissions as role_perms_val')
      .first();

    if (!row) throw ApiError.unauthorized('User not found or deactivated');

    let permissions = row.role_perms_val;
    if (typeof permissions === 'string') {
      try { permissions = JSON.parse(permissions); } catch { permissions = []; }
    }

    req.user = {
      _id: String(row.id),
      id: row.id,
      userId: String(row.id),
      username: row.username,
      email: row.email,
      fullName: row.full_name || row.username,
      phone: row.phone || '',
      role: row.role_id,
      roleName: row.role_name_val || row.role_name || '',
      tenantId: row.tenant_id || null,
      permissions: Array.isArray(permissions) ? permissions : [],
    };

    next();
  } catch (error) {
    next(error);
  }
};
