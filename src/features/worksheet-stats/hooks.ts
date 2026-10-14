import { useQuery } from '@tanstack/react-query';
import { worksheetStatsService } from '@/features/worksheet-stats/api/worksheetStatsService';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

export const useAssignmentStats = (id: string | undefined) =>
  useQuery({
    queryKey: qk.worksheetStats.assignment(id ?? ''),
    queryFn: () => worksheetStatsService.assignment(id!),
    enabled: !!id,
  });

export const useClassWorksheetOverview = (classId: string | undefined, params: QueryParams) =>
  useQuery({
    queryKey: qk.worksheetStats.classOverview(classId ?? '', params),
    queryFn: () => worksheetStatsService.classOverview(classId!, params),
    enabled: !!classId,
  });

export const useStudentWorksheetStats = (studentId: string | undefined) =>
  useQuery({
    queryKey: qk.worksheetStats.student(studentId ?? ''),
    queryFn: () => worksheetStatsService.student(studentId!),
    enabled: !!studentId,
  });
