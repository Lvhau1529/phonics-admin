/**
 * Khoá cache TanStack Query. Quy ước: `[feature, 'list' | 'detail' | ..., params?]`.
 * Invalidate theo prefix: `qc.invalidateQueries({ queryKey: qk.classes.all })` xoá mọi query của lớp.
 */
import type { QueryParams } from '@/shared/api/client';

export const qk = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  stats: {
    all: ['stats'] as const,
    overview: ['stats', 'overview'] as const,
    classTimeline: (classId: string, params: QueryParams) =>
      ['stats', 'class', classId, 'timeline', params] as const,
    classTopStudents: (classId: string, params: QueryParams) =>
      ['stats', 'class', classId, 'top-students', params] as const,
    classGames: (classId: string, params: QueryParams) =>
      ['stats', 'class', classId, 'games', params] as const,
    gameTimeline: (gameId: string, params: QueryParams) =>
      ['stats', 'game', gameId, 'timeline', params] as const,
    gameByClass: (gameId: string, params: QueryParams) =>
      ['stats', 'game', gameId, 'by-class', params] as const,
  },
  teachers: {
    all: ['teachers'] as const,
    list: (params: QueryParams) => ['teachers', 'list', params] as const,
  },
  classes: {
    all: ['classes'] as const,
    list: (params: QueryParams) => ['classes', 'list', params] as const,
    detail: (id: string) => ['classes', 'detail', id] as const,
    students: (id: string, params: QueryParams) => ['classes', 'detail', id, 'students', params] as const,
    ranking: (id: string, params: QueryParams) => ['classes', 'detail', id, 'ranking', params] as const,
    points: (id: string, params: QueryParams) => ['classes', 'detail', id, 'points', params] as const,
  },
  students: {
    all: ['students'] as const,
    list: (params: QueryParams) => ['students', 'list', params] as const,
    detail: (id: string) => ['students', 'detail', id] as const,
    points: (id: string, params: QueryParams) => ['students', 'detail', id, 'points', params] as const,
    pointsByGame: (id: string, params: QueryParams) => ['students', 'detail', id, 'by-game', params] as const,
    gameResults: (id: string, params: QueryParams) => ['students', 'detail', id, 'results', params] as const,
    games: (id: string) => ['students', 'detail', id, 'games'] as const,
  },
  games: {
    all: ['games'] as const,
    catalog: ['games', 'catalog'] as const,
    admin: ['games', 'admin'] as const,
  },
  permissions: {
    all: ['permissions'] as const,
    catalog: ['permissions', 'catalog'] as const,
    groups: ['permissions', 'groups'] as const,
    /** Prefix mọi ma trận quyền theo user (invalidate khi nhóm đổi) */
    users: ['permissions', 'user'] as const,
    user: (userId: string) => ['permissions', 'user', userId] as const,
  },
  audit: {
    all: ['audit'] as const,
    list: (params: QueryParams) => ['audit', 'list', params] as const,
  },
} as const;
