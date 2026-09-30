import { Link } from 'react-router-dom';
import { MessageSquare, UserPlus, RefreshCw, FileText, Inbox, Bell, Folder } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import Avatar from '../ui/Avatar.jsx';
import useNotifications from '../../hooks/useNotifications.js';
import useAuth from '../../hooks/useAuth.js';
import { ROLES } from '../../constants/index.js';
import { relativeTime } from '../../utils/format.js';

const getNotificationIcon = (type = '') => {
  const t = String(type).toUpperCase();
  if (t.includes('MESSAGE')) return <MessageSquare className="h-4 w-4 text-blue-500" />;
  if (t.includes('STAFF') || t.includes('ASSIGNED')) return <UserPlus className="h-4 w-4 text-purple-500" />;
  if (t.includes('STATUS') || t.includes('WORK') || t.includes('PROGRESS'))
    return <RefreshCw className="h-4 w-4 text-emerald-500" />;
  if (t.includes('REVISION')) return <FileText className="h-4 w-4 text-amber-500" />;
  if (t.includes('REQUEST')) return <Inbox className="h-4 w-4 text-brand-500" />;
  if (t.includes('FILE')) return <Folder className="h-4 w-4 text-indigo-500" />;
  return <Bell className="h-4 w-4 text-ink-500" />;
};

const NotificationBox = ({ className = '' }) => {
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotifications();

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
    <div id="notification-box" className="scroll-mt-20">
      <Card className={className}>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink-900">Notification Box</span>
              {notifications.length > 0 && (
                <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                  {notifications.length} new
                </span>
              )}
            </div>
          }
        />
        <CardBody className="p-0">
          {notifications.length > 0 ? (
            <div className="divide-y divide-ink-100 max-h-[440px] overflow-y-auto">
              {notifications.map((n) => {
                const href = getTargetHref(n);
                const actorName = n.actor?.name || 'System';

                return (
                  <Link
                    key={n._id || n.id}
                    to={href}
                    onClick={() => {
                      markAsRead(n._id || n.id);
                    }}
                    className="flex items-start gap-3 p-3.5 transition-colors hover:bg-brand-50/60 block bg-brand-50/20"
                  >
                    <div className="relative mt-0.5 shrink-0">
                      <Avatar name={actorName} src={n.actor?.avatar} size="sm" />
                      <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm border border-ink-100">
                        {getNotificationIcon(n.type)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-bold text-ink-900 group-hover:text-brand-600">
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[11px] text-ink-400 font-medium">
                          {relativeTime(n.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed">{n.message}</p>
                      {n.fromLabel && <p className="text-[10px] font-medium text-brand-600">{n.fromLabel}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-ink-500 space-y-2">
              <Bell className="mx-auto h-8 w-8 text-ink-300" />
              <p className="text-xs font-medium text-ink-700">No new notifications</p>
              <p className="text-xs text-ink-400">Project and movement notifications will appear here.</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default NotificationBox;
