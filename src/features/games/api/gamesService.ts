/**
 * Service game: gọi `gamesRepository` rồi đổi DTO → model (`GameModel`, `GameAdminModel`).
 * Số liệu biểu đồ (timeline, theo lớp) giữ DTO. Hook / component chỉ gọi service.
 */
import type { UpdateGameBody } from '@phonics/contracts';
import { gamesRepository } from '@/features/games/api/gamesRepository';
import { GameAdminModel } from '@/features/games/models/GameAdminModel';
import { GameModel } from '@/features/games/models/GameModel';
import type { QueryParams } from '@/shared/api/client';

export const gamesService = {
  catalog: async () => (await gamesRepository.catalog()).items.map((g) => new GameModel(g)),
  adminList: async () => (await gamesRepository.adminList()).items.map((g) => new GameAdminModel(g)),
  update: async (id: string, body: UpdateGameBody) => new GameModel(await gamesRepository.update(id, body)),
  timeline: (id: string, query: QueryParams) => gamesRepository.timeline(id, query),
  byClass: (id: string, query: QueryParams) => gamesRepository.byClass(id, query),
};
