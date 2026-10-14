import type { ComponentType } from 'react';
import type { Permission } from '@phonics/contracts';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { RequireAuth } from '@/app/guards/RequireAuth';
import { RequirePermission } from '@/app/guards/RequirePermission';
import { RequireRole } from '@/app/guards/RequireRole';
import { AppShell } from '@/app/layout/AppShell';
import { ROUTES } from '@/app/routes';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { FullscreenLoader } from '@/shared/ui/Loading';
import { NotFoundPage } from '@/shared/ui/NotFoundPage';

/** Route gate theo role: ADMIN mới vào được (menu cũng ẩn, nhưng gõ URL tay vẫn bị chặn) */
const adminOnly = (children: RouteObject[]): RouteObject => ({
  element: <RequireRole roles={['ADMIN']} />,
  children,
});

/** Route gate theo quyền (giáo viên bị thu hồi quyền vẫn bị chặn khi gõ URL) */
const withPermission = (permission: Permission, children: RouteObject[]): RouteObject => ({
  element: <RequirePermission permission={permission} />,
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
      // Trang in phiếu: ngoài AppShell (không sider / header), theme sáng cố định
      {
        path: 'print/worksheets/:id',
        lazy: page(() => import('@/features/worksheets/pages/WorksheetPrintPage')),
      },
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
          // Phiếu bài tập (giáo viên có quyền mặc định; admin luôn qua)
          withPermission('worksheets.manage', [
            { path: 'questions', lazy: page(() => import('@/features/questions/pages/QuestionsPage')) },
            {
              path: 'questions/new',
              lazy: page(() => import('@/features/questions/pages/QuestionEditorPage')),
            },
            {
              path: 'questions/:id',
              lazy: page(() => import('@/features/questions/pages/QuestionEditorPage')),
            },
            { path: 'worksheets', lazy: page(() => import('@/features/worksheets/pages/WorksheetsPage')) },
            {
              path: 'worksheets/new',
              lazy: page(() => import('@/features/worksheets/pages/WorksheetComposerPage')),
            },
            {
              path: 'worksheets/:id',
              lazy: page(() => import('@/features/worksheets/pages/WorksheetComposerPage')),
            },
            {
              path: 'worksheets/:id/preview',
              lazy: page(() => import('@/features/worksheets/pages/WorksheetPreviewPage')),
            },
          ]),
          { path: 'assignments', lazy: page(() => import('@/features/assignments/pages/AssignmentsPage')) },
          {
            path: 'assignments/:id',
            lazy: page(() => import('@/features/assignments/pages/AssignmentDetailPage')),
          },
          {
            path: 'assignments/:id/submissions/:submissionId',
            lazy: page(() => import('@/features/submissions/pages/GradingPage')),
          },
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
  { HydrateFallback: () => <FullscreenLoader />, children: routes },
]);
