/**
 * Service game: gọi `gamesRepository` rồi đổi DTO → model (`GameModel`, `GameAdminModel`).
 * Số liệu biểu đồ (timeline, theo lớp) giữ DTO. Kèm hook React Query; component gọi thẳng service.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateGameBody } from '@phonics/contracts';
import { gamesRepository } from '@/features/games/api/gamesRepository';
import { GameAdminModel } from '@/features/games/models/GameAdminModel';
import { GameModel } from '@/features/games/models/GameModel';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

const api = {
  catalog: async () => (await gamesRepository.catalog()).items.map((g) => new GameModel(g)),
  adminList: async () => (await gamesRepository.adminList()).items.map((g) => new GameAdminModel(g)),
  update: async (id: string, body: UpdateGameBody) => new GameModel(await gamesRepository.update(id, body)),
  timeline: (id: string, query: QueryParams) => gamesRepository.timeline(id, query),
  byClass: (id: string, query: QueryParams) => gamesRepository.byClass(id, query),
};

export const GamesService = {
  ...api,

  /** Catalog public: tên / giá / bật-tắt (dùng ở tab Game của lớp, học sinh) */
  useCatalog: () =>
    useQuery({
      queryKey: qk.games.catalog,
      queryFn: () => api.catalog(),
      staleTime: 5 * 60_000,
    }),

  useAdminList: () => useQuery({ queryKey: qk.games.admin, queryFn: () => api.adminList() }),

  useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateGameBody }) => api.update(id, body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: qk.games.all }),
    });
  },

  useTimeline: (gameId: string, params: QueryParams) =>
    useQuery({
      queryKey: qk.stats.gameTimeline(gameId, params),
      queryFn: () => api.timeline(gameId, params),
    }),

  useByClass: (gameId: string, params: QueryParams) =>
    useQuery({
      queryKey: qk.stats.gameByClass(gameId, params),
      queryFn: () => api.byClass(gameId, params),
    }),
};
