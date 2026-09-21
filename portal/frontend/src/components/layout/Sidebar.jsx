import { NavLink } from 'react-router-dom';
import { navigationFor } from '../../constants/navigation.js';
import { ROLE_LABELS } from '../../constants/index.js';
import useAuth from '../../hooks/useAuth.js';
import cn from '../../utils/cn.js';
import Logo from './Logo.jsx';

const linkClasses = ({ isActive }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-600 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white'
  );

/** Desktop sidebar. On small screens MobileMenu renders the same links. */
const Sidebar = () => {
  const { user } = useAuth();
  const links = navigationFor(user?.role);

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-ink-900 lg:flex">
      <div className="px-5 py-5">
        <Logo variant="light" />
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Main">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClasses} end={true}>
            <link.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-ink-800 px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-ink-500">Signed in as</p>
        <p className="mt-0.5 truncate text-sm font-medium text-white">{user?.name}</p>
        <p className="text-xs text-ink-400">{ROLE_LABELS[user?.role]}</p>
      </div>
    </aside>
  );
};

export default Sidebar;
