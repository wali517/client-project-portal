import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth.js';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notificationApi.js';
import { getDashboard } from '../api/dashboardApi.js';
import { ACTIVITY_LABELS, ROLES } from '../constants/index.js';

export const NotificationContext = createContext(null);

const humanize = (val = '') =>
  String(val)
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const describeChange = (entry) => {
  const { previousValue, newValue } = entry;
  if (previousValue?.status && newValue?.status) {
    return `${humanize(previousValue.status)} → ${humanize(newValue.status)}`;
  }
  if (newValue?.progress !== undefined && previousValue?.progress !== undefined) {
    return `${previousValue.progress}% → ${newValue.progress}%`;
  }
  if (newValue?.fileName) return newValue.fileName;
  if (newValue?.staff) return newValue.staff;
  if (newValue?.reason) return newValue.reason;
  if (newValue?.note) return newValue.note;
  if (newValue?.preview) return newValue.preview;
  return null;
};

const isProjectMovementType = (type = '') => {
  const t = String(type).toUpperCase();
  if (t.includes('LOGIN') || t.includes('LOGOUT') || t.includes('AUTH') || t.includes('USER_')) {
    return false;
  }
  return (
    t.includes('MESSAGE') ||
    t.includes('STAFF') ||
    t.includes('ASSIGN') ||
    t.includes('STATUS') ||
    t.includes('WORK') ||
    t.includes('REVISION') ||
    t.includes('REQUEST') ||
    t.includes('PROJECT') ||
    t.includes('FILE') ||
    t.includes('APPROV') ||
    t.includes('REJECT')
  );
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const isPollingRef = useRef(false);
  const knownIdsRef = useRef(null);
  const isEndpointMissingRef = useRef(false);
  const isRateLimitedRef = useRef(false);
  const lastSignatureRef = useRef('');

  const getTargetHref = useCallback(
    (n) => {
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
    },
    [user]
  );

  const fetchLatest = useCallback(async () => {
    if (!user?._id || isRateLimitedRef.current) return;
    try {
      let rawItems = [];

      if (!isEndpointMissingRef.current) {
        try {
          const response = await listNotifications({ limit: 40 });
          const payload = response?.data;
          if (payload) {
            rawItems = payload.items || [];
          }
        } catch (err) {
          if (err?.response?.status === 404) {
            isEndpointMissingRef.current = true;
          } else if (err?.response?.status === 429) {
            isRateLimitedRef.current = true;
            setTimeout(() => { isRateLimitedRef.current = false; }, 15000);
            return;
          } else {
            throw err;
          }
        }
      }

      // If backend notification endpoint returned 404, fallback to /dashboard activity logs
      if (isEndpointMissingRef.current) {
        try {
          const dashRes = await getDashboard();
          const activityList = dashRes?.data?.activity || [];
          rawItems = activityList.map((act) => {
            const actorName = act.user?.name || 'Someone';
            const actionText = ACTIVITY_LABELS[act.action] || humanize(act.action);
            const title = `${actorName} ${actionText}`;
            const changeText = describeChange(act);
            const messageText = changeText || act.project?.title || act.request?.title || humanize(act.action);

            return {
              _id: act._id || act.id,
              actor: act.user,
              type: act.action,
              title,
              message: messageText,
              project: act.project,
              request: act.request,
              isRead: false,
              createdAt: act.createdAt,
            };
          });
        } catch (err) {
          if (err?.response?.status === 429) {
            isRateLimitedRef.current = true;
            setTimeout(() => { isRateLimitedRef.current = false; }, 15000);
            return;
          }
        }
      }

      // 1. Filter ONLY for project & request movements (No login/logout logs)
      const projectOnlyItems = rawItems.filter((item) => isProjectMovementType(item.type));

      // 2. Active notifications are unseen/unread items
      const unreadItems = projectOnlyItems.filter((item) => !item.isRead);
      const unread = unreadItems.length;
      const unreadMsgCount = unreadItems.filter((i) =>
        String(i.type).toUpperCase().includes('MESSAGE')
      ).length;

      // 3. Stability check: Only update state if notification list signature has actually changed
      const currentSignature = unreadItems.map((i) => String(i._id || i.id)).join(',');
      if (lastSignatureRef.current !== currentSignature) {
        lastSignatureRef.current = currentSignature;
        setNotifications(unreadItems);
        setUnreadCount(unread);
        setUnreadMessagesCount(unreadMsgCount);
      }

      const currentIds = new Set(unreadItems.map((item) => String(item._id || item.id)));

      if (knownIdsRef.current === null) {
        knownIdsRef.current = currentIds;
        return;
      }

      // Toast alerts for newly arrived unseen notifications
      unreadItems.forEach((n) => {
        const id = String(n._id || n.id);
        if (!knownIdsRef.current.has(id)) {
          knownIdsRef.current.add(id);

          let icon = '🔔';
          if (n.type === 'MESSAGE' || n.type === 'MESSAGE_SENT') icon = '💬';
          else if (n.type?.includes('STAFF') || n.type?.includes('ASSIGNED')) icon = '👤';
          else if (n.type?.includes('STATUS') || n.type?.includes('WORK')) icon = '🔄';
          else if (n.type?.includes('REVISION')) icon = '📝';
          else if (n.type?.includes('REQUEST')) icon = '📥';
          else if (n.type?.includes('FILE')) icon = '📁';

          toast(
            (t) => (
              <div
                className="cursor-pointer space-y-1"
                onClick={() => {
                  toast.dismiss(t.id);
                  const href = getTargetHref(n);
                  if (href) navigate(href);
                }}
              >
                <p className="font-semibold text-sm text-ink-900">{n.title}</p>
                <p className="text-xs text-ink-600 line-clamp-2">{n.message}</p>
              </div>
            ),
            {
              icon,
              duration: 5000,
              id: `notif-${id}`,
            }
          );
        }
      });
    } catch (err) {
      if (err?.response?.status === 429) {
        isRateLimitedRef.current = true;
        setTimeout(() => { isRateLimitedRef.current = false; }, 15000);
      }
    }
  }, [user, navigate, getTargetHref]);

  useEffect(() => {
    if (!user?._id) {
      setNotifications([]);
      setUnreadCount(0);
      setUnreadMessagesCount(0);
      knownIdsRef.current = null;
      lastSignatureRef.current = '';
      return;
    }

    setIsLoading(true);
    fetchLatest().finally(() => setIsLoading(false));

    const interval = setInterval(async () => {
      if (document.hidden || isPollingRef.current || isRateLimitedRef.current) return;
      isPollingRef.current = true;
      try {
        await fetchLatest();
      } finally {
        isPollingRef.current = false;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, fetchLatest]);

  const markAsRead = useCallback(async (id) => {
    try {
      if (!isEndpointMissingRef.current) {
        await markNotificationRead(id);
      }
    } catch {
      // ignore network error
    } finally {
      // Instantly clear/remove the notification from the list once seen
      setNotifications((prev) => prev.filter((item) => String(item._id || item.id) !== String(id)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      lastSignatureRef.current = '';
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      if (!isEndpointMissingRef.current) {
        await markAllNotificationsRead();
      }
    } catch {
      // ignore network error
    } finally {
      setNotifications([]);
      setUnreadCount(0);
      setUnreadMessagesCount(0);
      lastSignatureRef.current = '';
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        unreadMessagesCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refetchNotifications: fetchLatest,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
