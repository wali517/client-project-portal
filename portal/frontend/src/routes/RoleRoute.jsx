import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

/** Frontend convenience only - the API enforces the same rules. */
const RoleRoute = ({ allowedRoles = [] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

export default RoleRoute;
