import { Outlet } from 'react-router-dom';
import Logo from '../components/layout/Logo.jsx';

const AuthLayout = () => (
  <div className="flex min-h-screen flex-col lg:flex-row">
    <div className="hidden flex-1 flex-col justify-between bg-ink-900 px-10 py-12 lg:flex">
      <Logo variant="light" />
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold text-white">
          Requests in, projects out, everything tracked in between.
        </h1>
        <p className="mt-4 text-ink-300">
          Clients submit work, admins review and assign it, staff deliver it, and every status change is recorded on
          the project timeline.
        </p>
      </div>
      <p className="text-xs text-ink-500">Client &amp; Project Management Portal</p>
    </div>

    <div className="flex flex-1 items-center justify-center bg-white px-4 py-10 sm:px-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        <Outlet />
      </div>
    </div>
  </div>
);

export default AuthLayout;
