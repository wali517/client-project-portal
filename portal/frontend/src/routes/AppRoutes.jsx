import { Navigate, Route, Routes } from 'react-router-dom';
import { ROLES } from '../constants/index.js';
import useAuth from '../hooks/useAuth.js';
import { homePathFor } from '../utils/permissions.js';

import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';

import Login from '../pages/auth/Login.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import ResetPassword from '../pages/auth/ResetPassword.jsx';

import AdminDashboard from '../pages/admin/Dashboard.jsx';
import AdminUsers from '../pages/admin/Users.jsx';
import AdminUserDetail from '../pages/admin/UserDetail.jsx';
import AdminRequests from '../pages/admin/Requests.jsx';
import AdminRequestDetail from '../pages/admin/RequestDetail.jsx';
import AdminProjects from '../pages/admin/Projects.jsx';
import AdminProjectDetail from '../pages/admin/ProjectDetail.jsx';
import AdminActivity from '../pages/admin/Activity.jsx';

import StaffDashboard from '../pages/staff/Dashboard.jsx';
import StaffProjects from '../pages/staff/Projects.jsx';
import StaffProjectDetail from '../pages/staff/ProjectDetail.jsx';

import ClientDashboard from '../pages/client/Dashboard.jsx';
import ClientRequests from '../pages/client/Requests.jsx';
import ClientNewRequest from '../pages/client/NewRequest.jsx';
import ClientRequestDetail from '../pages/client/RequestDetail.jsx';
import ClientProjects from '../pages/client/Projects.jsx';
import ClientProjectDetail from '../pages/client/ProjectDetail.jsx';

import NotFound from '../pages/NotFound.jsx';
import Unauthorized from '../pages/Unauthorized.jsx';

const HomeRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={homePathFor(user)} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<DashboardLayout />}>
        <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />
          <Route path="/admin/requests" element={<AdminRequests />} />
          <Route path="/admin/requests/:id" element={<AdminRequestDetail />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/projects/:id" element={<AdminProjectDetail />} />
          <Route path="/admin/activity" element={<AdminActivity />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={[ROLES.STAFF]} />}>
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/projects" element={<StaffProjects />} />
          <Route path="/staff/projects/:id" element={<StaffProjectDetail />} />
          <Route path="/staff/projects/:id/files" element={<StaffProjectDetail defaultTab="files" />} />
          <Route path="/staff/projects/:id/activity" element={<StaffProjectDetail defaultTab="activity" />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={[ROLES.CLIENT]} />}>
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/requests" element={<ClientRequests />} />
          <Route path="/client/requests/new" element={<ClientNewRequest />} />
          <Route path="/client/requests/:id" element={<ClientRequestDetail />} />
          <Route path="/client/projects" element={<ClientProjects />} />
          <Route path="/client/projects/:id" element={<ClientProjectDetail />} />
        </Route>

        <Route path="/unauthorized" element={<Navigate to="/" replace />} />
      </Route>
    </Route>

    <Route path="/" element={<HomeRedirect />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
