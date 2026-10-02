import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateGameBody } from '@phonics/contracts';
import { gamesService } from '@/features/games/api/gamesService';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

/** Catalog public: tên / giá / bật-tắt (dùng ở tab Game của lớp, học sinh) */
export const useGameCatalog = () =>
  useQuery({
    queryKey: qk.games.catalog,
    queryFn: () => gamesService.catalog(),
    staleTime: 5 * 60_000,
  });

export const useAdminGames = () =>
  useQuery({ queryKey: qk.games.admin, queryFn: () => gamesService.adminList() });

export function useUpdateGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateGameBody }) => gamesService.update(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.games.all }),
  });
}

export const useGameTimeline = (gameId: string, params: QueryParams) =>
  useQuery({
    queryKey: qk.stats.gameTimeline(gameId, params),
    queryFn: () => gamesService.timeline(gameId, params),
  });

export const useGameByClass = (gameId: string, params: QueryParams) =>
  useQuery({
    queryKey: qk.stats.gameByClass(gameId, params),
    queryFn: () => gamesService.byClass(gameId, params),
  });
