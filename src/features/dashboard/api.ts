import {
  ClassGameStats,
  ENDPOINTS,
  OverviewStats,
  PointsTimelineBucket,
  TopStudent,
} from '@phonics/contracts';
import { z } from 'zod';
import { request, type QueryParams } from '@/shared/api/client';

export const statsApi = {
  overview: () => request(ENDPOINTS.stats.overview, { schema: OverviewStats }),
  classTimeline: (classId: string, query: QueryParams) =>
    request(ENDPOINTS.stats.classPointsTimeline(classId), { query, schema: z.array(PointsTimelineBucket) }),
  classTopStudents: (classId: string, query: QueryParams) =>
    request(ENDPOINTS.stats.classTopStudents(classId), { query, schema: z.array(TopStudent) }),
  classGames: (classId: string, query: QueryParams) =>
    request(ENDPOINTS.stats.classGames(classId), { query, schema: z.array(ClassGameStats) }),
};
