import ApiError from '../utils/ApiError.js';
import { ROLES, roleHasPermission } from '../constants/index.js';

/** Grants access when the user's role holds every listed permission. */
export const authorize =
  (...permissions) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    const allowed = permissions.every((permission) => roleHasPermission(req.user.role, permission));
    if (!allowed) return next(ApiError.forbidden('You do not have permission to perform this action'));
    return next();
  };

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('You do not have access to this resource'));
    return next();
  };

export const requireAdmin = requireRole(ROLES.ADMIN);
export const requireStaff = requireRole(ROLES.STAFF);
export const requireClient = requireRole(ROLES.CLIENT);

export default authorize;
