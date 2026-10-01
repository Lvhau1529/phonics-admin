import type { ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { RequireAuth } from '@/app/guards/RequireAuth';
import { RequireRole } from '@/app/guards/RequireRole';
import { AppShell } from '@/app/layout/AppShell';
import { ROUTES } from '@/app/routes';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { CenteredLoader } from '@/shared/ui/LottieLoader';
import { NotFoundPage } from '@/shared/ui/NotFoundPage';

/** Route gate theo role: ADMIN mới vào được (menu cũng ẩn, nhưng gõ URL tay vẫn bị chặn) */
const adminOnly = (children: RouteObject[]): RouteObject => ({
  element: <RequireRole roles={['ADMIN']} />,
  children,
});

/** Trang tải lười (code-split theo feature) */
const page = (load: () => Promise<{ default: ComponentType }>): RouteObject['lazy'] => ({
  Component: async () => (await load()).default,
});

export const routes: RouteObject[] = [
  { path: ROUTES.login, element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, lazy: page(() => import('@/features/dashboard/pages/DashboardPage')) },
          { path: 'classes', lazy: page(() => import('@/features/classes/pages/ClassesPage')) },
          { path: 'classes/:id', lazy: page(() => import('@/features/classes/pages/ClassDetailPage')) },
          { path: 'students', lazy: page(() => import('@/features/students/pages/StudentsPage')) },
          { path: 'students/:id', lazy: page(() => import('@/features/students/pages/StudentDetailPage')) },
          { path: 'points', lazy: page(() => import('@/features/points/pages/PointsPage')) },
          { path: 'reports', lazy: page(() => import('@/features/reports/pages/ReportsPage')) },
          { path: 'profile', lazy: page(() => import('@/features/profile/pages/ProfilePage')) },
          adminOnly([
            { path: 'teachers', lazy: page(() => import('@/features/teachers/pages/TeachersPage')) },
            { path: 'games', lazy: page(() => import('@/features/games/pages/GamesPage')) },
            { path: 'games/:id', lazy: page(() => import('@/features/games/pages/GameDetailPage')) },
            { path: 'permissions', lazy: page(() => import('@/features/permissions/pages/PermissionsPage')) },
            { path: 'audit', lazy: page(() => import('@/features/audit/pages/AuditPage')) },
          ]),
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];

/** Route gốc không path chỉ để khai báo HydrateFallback (trang con tải lazy — React Router cần fallback lúc render đầu) */
export const router = createBrowserRouter([
  { HydrateFallback: () => <CenteredLoader minHeight="100vh" />, children: routes },
]);
