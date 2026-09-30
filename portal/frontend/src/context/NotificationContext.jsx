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
  if (t.includes('LOGIN') || t.includes('LOGOUT') || t.includes('AUTH') || t.includes('USER_LOG')) {
    return false;
  }
  return true;
};

const VISIBLE_POLL_MS = 2000;
const HIDDEN_POLL_MS = 10000;

const STAFF_ONLY_TYPES = ['STAFF_ASSIGNED', 'STAFF_UNASSIGNED', 'PROJECT_ASSIGNED', 'WORK_SUBMITTED'];

const isVisibleToViewer = (item, viewerRole) => {
  if (viewerRole === ROLES.ADMIN) return true;
  const otherRole = viewerRole === ROLES.STAFF ? ROLES.CLIENT : ROLES.STAFF;
  if (item.actor?.role === otherRole) return false;
  if (String(item.type).toUpperCase() === 'MESSAGE' && item.channel === otherRole) return false;
  if (viewerRole === ROLES.CLIENT && STAFF_ONLY_TYPES.includes(String(item.type).toUpperCase())) return false;
  return true;
};

const presentForViewer = (item, viewerRole) => {
  if (viewerRole === ROLES.ADMIN) {
    const who = item.actor?.name;
    const role = item.actor?.role ? humanize(item.actor.role) : '';
    return { ...item, fromLabel: who ? `${role ? `${role}: ` : ''}${who}` : 'System' };
  }
  return {
    ...item,
    actor: { name: 'Admin', role: ROLES.ADMIN },
    fromLabel: 'From Admin',
  };
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
          const items =
            response?.data?.items ||
            response?.data ||
            response?.items ||
            (Array.isArray(response) ? response : []);
          rawItems = Array.isArray(items) ? items : items?.items || [];
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

      if (isEndpointMissingRef.current) {
        try {
          const dashRes = await getDashboard();
          const activityList = dashRes?.data?.activity || [];
          rawItems = activityList.map((act) => {
            const actorName = user.role === ROLES.ADMIN ? act.user?.name || 'Someone' : 'Admin';
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

      const projectOnlyItems = rawItems
        .filter((item) => isProjectMovementType(item.type))
        .filter((item) => isVisibleToViewer(item, user.role))
        .map((item) => presentForViewer(item, user.role));

      const unreadItems = projectOnlyItems.filter((item) => !item.isRead);
      const unread = unreadItems.length;
      const unreadMsgCount = unreadItems.filter((i) =>
        String(i.type).toUpperCase().includes('MESSAGE')
      ).length;

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
              duration: 1000,
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

    let timer = null;
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      if (!isPollingRef.current && !isRateLimitedRef.current) {
        isPollingRef.current = true;
        try {
          await fetchLatest();
        } finally {
          isPollingRef.current = false;
        }
      }
      if (!stopped) timer = setTimeout(poll, document.hidden ? HIDDEN_POLL_MS : VISIBLE_POLL_MS);
    };

    const pollNow = () => {
      if (document.hidden) return;
      clearTimeout(timer);
      poll();
    };

    timer = setTimeout(poll, VISIBLE_POLL_MS);
    document.addEventListener('visibilitychange', pollNow);
    window.addEventListener('focus', pollNow);
    window.addEventListener('online', pollNow);

    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', pollNow);
      window.removeEventListener('focus', pollNow);
      window.removeEventListener('online', pollNow);
    };
  }, [user, fetchLatest]);

  const markAsRead = useCallback(async (id) => {
    try {
      if (!isEndpointMissingRef.current) {
        await markNotificationRead(id);
      }
    } catch {

    } finally {

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
