import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { homePathFor } from "../utils/permissions.js";
const RoleRoute = ({ allowedRoles = [] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role))
    return <Navigate to={homePathFor(user)} replace />;
  return <Outlet />;
};

export default RoleRoute;
