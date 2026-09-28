import { useNavigate, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications.js';
import useAuth from '../../hooks/useAuth.js';
import { ROLES } from '../../constants/index.js';

const NotificationDropdown = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBellClick = () => {
    const rolePrefix =
      user?.role === ROLES.ADMIN ? '/admin' : user?.role === ROLES.STAFF ? '/staff' : '/client';

    if (location.pathname === rolePrefix || location.pathname === `${rolePrefix}/`) {
      const el = document.getElementById('notification-box');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(rolePrefix);
      setTimeout(() => {
        const el = document.getElementById('notification-box');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBellClick}
      className="relative rounded-lg p-2 text-ink-600 hover:bg-ink-100 hover:text-ink-900 transition-colors"
      aria-label="View Notification Box"
      title="View Notification Box"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-sm">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationDropdown;
