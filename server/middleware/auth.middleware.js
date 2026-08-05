import { verifyToken } from '../utils/auth/generateToken.js';
import { User } from '../modules/user/user.model.js';
import { TempAdmin } from '../modules/tenant/tempAdmin.model.js';
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
    if (!token) {
      throw ApiError.unauthorized('No token provided');
    }
    const decoded = verifyToken(token);

    const user = await User.findOne({ _id: decoded.userId, isDeleted: false, isActive: true })
      .populate('role', 'name displayName permissions');
    if (!user) throw ApiError.unauthorized('User not found or deactivated');

    if (user.isTempAdmin) {
      const tempAdmin = await TempAdmin.findOne({ userId: user._id, status: 'ACTIVE' });
      if (!tempAdmin || tempAdmin.expiresAt < new Date()) {
        user.isActive = false;
        await user.save();
        if (tempAdmin) {
          tempAdmin.status = 'EXPIRED';
          await tempAdmin.save();
        }
        throw ApiError.forbidden('Temporary access has expired');
      }
    }

    req.user = {
      userId: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName || user.username,
      phone: user.phone || '',
      roleName: user.roleName || user.role?.name,
      role: user.role?._id || user.role,
      permissions: user.role?.permissions || [],
      tenantId: user.tenantId || null,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired'));
    }
    next(error);
  }
};
