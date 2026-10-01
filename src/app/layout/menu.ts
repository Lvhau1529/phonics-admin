import type { Role } from '@phonics/contracts';
import { ROUTES } from '@/app/routes';
import type { Dict } from '@/shared/i18n';

export interface MenuEntry {
  key: string;
  path: string;
  /** Khoá trong `t.nav` — dịch lúc render để đổi ngôn ngữ không cần nạp lại module */
  labelKey: keyof Dict['nav'];
  /** Tên icon (map sang component trong AppShell để file này không phụ thuộc React) */
  icon: 'dashboard' | 'teacher' | 'class' | 'student' | 'game' | 'points' | 'permission' | 'audit' | 'report';
  /** Không khai báo = mọi role đã đăng nhập (ADMIN / TEACHER) */
  roles?: readonly Role[];
}

/** Menu trái theo thứ tự hiển thị; lọc theo role ở AppShell (router cũng chặn lại bằng RequireRole) */
export const MENU: readonly MenuEntry[] = [
  { key: 'dashboard', path: ROUTES.dashboard, labelKey: 'dashboard', icon: 'dashboard' },
  { key: 'teachers', path: ROUTES.teachers, labelKey: 'teachers', icon: 'teacher', roles: ['ADMIN'] },
  { key: 'classes', path: ROUTES.classes, labelKey: 'classes', icon: 'class' },
  { key: 'students', path: ROUTES.students, labelKey: 'students', icon: 'student' },
  { key: 'points', path: ROUTES.points, labelKey: 'points', icon: 'points' },
  { key: 'games', path: ROUTES.games, labelKey: 'games', icon: 'game', roles: ['ADMIN'] },
  { key: 'reports', path: ROUTES.reports, labelKey: 'reports', icon: 'report' },
  {
    key: 'permissions',
    path: ROUTES.permissions,
    labelKey: 'permissions',
    icon: 'permission',
    roles: ['ADMIN'],
  },
  { key: 'audit', path: ROUTES.audit, labelKey: 'audit', icon: 'audit', roles: ['ADMIN'] },
];

export const menuForRole = (role: Role | null): MenuEntry[] =>
  MENU.filter((entry) => !entry.roles || (role !== null && entry.roles.includes(role)));

/** Key menu đang chọn theo pathname (`/classes/abc` → classes) */
export function activeMenuKey(pathname: string): string | undefined {
  if (pathname === '/') return 'dashboard';
  const first = `/${pathname.split('/')[1]}`;
  return MENU.find((entry) => entry.path === first)?.key;
}
