import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateGameBody } from '@phonics/contracts';
import { gamesApi } from '@/features/games/api';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

/** Catalog public: tên / giá / bật-tắt (dùng ở tab Game của lớp, học sinh) */
export const useGameCatalog = () =>
  useQuery({
    queryKey: qk.games.catalog,
    queryFn: () => gamesApi.catalog(),
    select: (data) => data.items,
    staleTime: 5 * 60_000,
  });

export const useAdminGames = () =>
  useQuery({ queryKey: qk.games.admin, queryFn: () => gamesApi.adminList(), select: (data) => data.items });

export function useUpdateGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateGameBody }) => gamesApi.update(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.games.all }),
  });
}

export const useGameTimeline = (gameId: string, params: QueryParams) =>
  useQuery({
    queryKey: qk.stats.gameTimeline(gameId, params),
    queryFn: () => gamesApi.timeline(gameId, params),
  });

export const useGameByClass = (gameId: string, params: QueryParams) =>
  useQuery({
    queryKey: qk.stats.gameByClass(gameId, params),
    queryFn: () => gamesApi.byClass(gameId, params),
  });
