import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { navigationFor } from '../../constants/navigation.js';
import { ROLE_LABELS } from '../../constants/index.js';
import useAuth from '../../hooks/useAuth.js';
import cn from '../../utils/cn.js';
import Logo from './Logo.jsx';

const MobileMenu = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const links = navigationFor(user?.role);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-ink-900/50" onClick={onClose} role="presentation" />
      <div className="animate-slide-in relative flex h-full w-72 max-w-[85%] flex-col bg-ink-900">
        <div className="flex items-center justify-between px-5 py-5">
          <Logo variant="light" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-300 hover:bg-ink-800"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Main">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              end={true}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium',
                  isActive ? 'bg-brand-600 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white'
                )
              }
            >
              <link.icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink-800 px-5 py-4">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="text-xs text-ink-400">{ROLE_LABELS[user?.role]}</p>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
