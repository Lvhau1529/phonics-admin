import type { Role } from '@phonics/contracts';
import { ROUTES } from '@/app/routes';
import { t } from '@/shared/i18n/vi';

export interface MenuEntry {
  key: string;
  path: string;
  label: string;
  /** Tên icon (map sang component trong AppShell để file này không phụ thuộc React) */
  icon: 'dashboard' | 'teacher' | 'class' | 'student' | 'game' | 'points' | 'permission' | 'audit' | 'report';
  /** Không khai báo = mọi role đã đăng nhập (ADMIN / TEACHER) */
  roles?: readonly Role[];
}

/** Menu trái theo thứ tự hiển thị; lọc theo role ở AppShell (router cũng chặn lại bằng RequireRole) */
export const MENU: readonly MenuEntry[] = [
  { key: 'dashboard', path: ROUTES.dashboard, label: t.nav.dashboard, icon: 'dashboard' },
  { key: 'teachers', path: ROUTES.teachers, label: t.nav.teachers, icon: 'teacher', roles: ['ADMIN'] },
  { key: 'classes', path: ROUTES.classes, label: t.nav.classes, icon: 'class' },
  { key: 'students', path: ROUTES.students, label: t.nav.students, icon: 'student' },
  { key: 'points', path: ROUTES.points, label: t.nav.points, icon: 'points' },
  { key: 'games', path: ROUTES.games, label: t.nav.games, icon: 'game', roles: ['ADMIN'] },
  { key: 'reports', path: ROUTES.reports, label: t.nav.reports, icon: 'report' },
  {
    key: 'permissions',
    path: ROUTES.permissions,
    label: t.nav.permissions,
    icon: 'permission',
    roles: ['ADMIN'],
  },
  { key: 'audit', path: ROUTES.audit, label: t.nav.audit, icon: 'audit', roles: ['ADMIN'] },
];

export const menuForRole = (role: Role | null): MenuEntry[] =>
  MENU.filter((entry) => !entry.roles || (role !== null && entry.roles.includes(role)));

/** Key menu đang chọn theo pathname (`/classes/abc` → classes) */
export function activeMenuKey(pathname: string): string | undefined {
  if (pathname === '/') return 'dashboard';
  const first = `/${pathname.split('/')[1]}`;
  return MENU.find((entry) => entry.path === first)?.key;
}
