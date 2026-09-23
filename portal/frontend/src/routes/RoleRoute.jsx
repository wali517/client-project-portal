import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { homePathFor } from '../utils/permissions.js';

/** Frontend convenience only - the API enforces the same rules. */
const RoleRoute = ({ allowedRoles = [] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />;
  return <Outlet />;
};

export default RoleRoute;
