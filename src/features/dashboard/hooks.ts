import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/features/dashboard/api/statsService';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

export const useOverviewStats = () =>
  useQuery({ queryKey: qk.stats.overview, queryFn: statsService.overview });

export const useClassTimeline = (classId: string | undefined, params: QueryParams) =>
  useQuery({
    queryKey: qk.stats.classTimeline(classId ?? '', params),
    queryFn: () => statsService.classTimeline(classId!, params),
    enabled: !!classId,
  });

export const useClassTopStudents = (classId: string | undefined, params: QueryParams) =>
  useQuery({
    queryKey: qk.stats.classTopStudents(classId ?? '', params),
    queryFn: () => statsService.classTopStudents(classId!, params),
    enabled: !!classId,
  });

export const useClassGameStats = (classId: string | undefined, params: QueryParams) =>
  useQuery({
    queryKey: qk.stats.classGames(classId ?? '', params),
    queryFn: () => statsService.classGames(classId!, params),
    enabled: !!classId,
  });
