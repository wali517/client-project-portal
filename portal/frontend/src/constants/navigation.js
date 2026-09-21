import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  Users,
  History,
  FilePlus2,
} from 'lucide-react';
import { ROLES } from './index.js';

export const NAVIGATION = {
  [ROLES.ADMIN]: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/requests', label: 'Requests', icon: Inbox },
    { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
    { to: '/admin/users', label: 'People', icon: Users },
    { to: '/admin/activity', label: 'Activity', icon: History },
  ],
  [ROLES.STAFF]: [
    { to: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/staff/projects', label: 'My projects', icon: FolderKanban },
  ],
  [ROLES.CLIENT]: [
    { to: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/client/requests/new', label: 'New request', icon: FilePlus2 },
    { to: '/client/requests', label: 'My requests', icon: Inbox },
    { to: '/client/projects', label: 'My projects', icon: FolderKanban },
  ],
};

export const navigationFor = (role) => NAVIGATION[role] || [];
