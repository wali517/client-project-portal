import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageSquare, UserPlus, RefreshCw, FileText, Inbox, Folder } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications.js';
import useAuth from '../../hooks/useAuth.js';
import Avatar from '../ui/Avatar.jsx';
import { ROLES } from '../../constants/index.js';
import { relativeTime } from '../../utils/format.js';

const getNotificationIcon = (type = '') => {
  const t = String(type).toUpperCase();
  if (t.includes('MESSAGE')) return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />;
  if (t.includes('STAFF') || t.includes('ASSIGNED')) return <UserPlus className="h-3.5 w-3.5 text-purple-500" />;
  if (t.includes('STATUS') || t.includes('WORK') || t.includes('PROGRESS'))
    return <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />;
  if (t.includes('REVISION')) return <FileText className="h-3.5 w-3.5 text-amber-500" />;
  if (t.includes('REQUEST')) return <Inbox className="h-3.5 w-3.5 text-brand-500" />;
  if (t.includes('FILE')) return <Folder className="h-3.5 w-3.5 text-indigo-500" />;
  return <Bell className="h-3.5 w-3.5 text-ink-500" />;
};

const NotificationDropdown = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getTargetHref = (n) => {
    const rolePrefix =
      user?.role === ROLES.ADMIN ? '/admin' : user?.role === ROLES.STAFF ? '/staff' : '/client';
    const roleDash =
      user?.role === ROLES.ADMIN ? '/admin/dashboard' : user?.role === ROLES.STAFF ? '/staff/dashboard' : '/client/dashboard';

    if (n.project) {
      const projId = typeof n.project === 'object' ? n.project._id || n.project.id : n.project;
      return `${rolePrefix}/projects/${projId}`;
    }
    if (n.request) {
      const reqId = typeof n.request === 'object' ? n.request._id || n.request.id : n.request;
      return `${rolePrefix}/requests/${reqId}`;
    }
    return roleDash;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-lg p-2 text-ink-600 hover:bg-ink-100 hover:text-ink-900 transition-colors"
        aria-label="Notification Box"
        title="Notification Box"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} role="presentation" />
          <div className="absolute right-0 z-30 mt-2 w-80 sm:w-96 rounded-xl border border-ink-100 bg-white shadow-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 bg-white">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink-900">Notification Box</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-ink-100">
              {notifications.length > 0 ? (
                notifications.map((n) => {
                  const href = getTargetHref(n);
                  const actorName = n.actor?.name || 'System';

                  return (
                    <Link
                      key={n._id || n.id}
                      to={href}
                      onClick={() => {
                        setIsOpen(false);
                        markAsRead(n._id || n.id);
                      }}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-brand-50/60 block bg-brand-50/20"
                    >
                      <div className="relative mt-0.5 shrink-0">
                        <Avatar name={actorName} src={n.actor?.avatar} size="xs" />
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm border border-ink-100">
                          {getNotificationIcon(n.type)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-bold text-ink-900">{n.title}</p>
                          <span className="shrink-0 text-[10px] text-ink-400 font-medium">
                            {relativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-ink-600 line-clamp-2">{n.message}</p>
                        {n.fromLabel && <p className="text-[10px] font-medium text-brand-600">{n.fromLabel}</p>}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-ink-500 space-y-1">
                  <Bell className="mx-auto h-6 w-6 text-ink-300 mb-1" />
                  <p className="font-semibold text-ink-700">No new notifications</p>
                  <p className="text-[11px] text-ink-400">Project movements will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
