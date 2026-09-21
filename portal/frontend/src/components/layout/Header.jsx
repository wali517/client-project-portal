import { useState } from 'react';
import { Menu, LogOut, ChevronDown, KeyRound } from 'lucide-react';
import useAuth from '../../hooks/useAuth.js';
import Avatar from '../ui/Avatar.jsx';
import Logo from './Logo.jsx';
import ChangePasswordModal from '../auth/ChangePasswordModal.jsx';
import { ROLE_LABELS } from '../../constants/index.js';

const Header = ({ onOpenMenu }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-ink-100 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="lg:hidden">
            <Logo />
          </span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink-100"
            aria-haspopup="menu"
            aria-expanded={isOpen}
          >
            <Avatar name={user?.name} src={user?.avatar} size="sm" />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium text-ink-900">{user?.name}</span>
              <span className="block text-xs text-ink-500">{ROLE_LABELS[user?.role]}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-ink-500" aria-hidden="true" />
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} role="presentation" />
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card"
              >
                <div className="border-b border-ink-100 px-4 py-3">
                  <p className="truncate text-sm font-medium text-ink-900">{user?.name}</p>
                  <p className="truncate text-xs text-ink-500">{user?.email}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    setIsPasswordModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-ink-50"
                >
                  <KeyRound className="h-4 w-4 text-ink-500" aria-hidden="true" />
                  Change password
                </button>
                <div className="border-t border-ink-100" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
};

export default Header;
