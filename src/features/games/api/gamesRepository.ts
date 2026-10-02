/**
 * Repository game: chỉ khai báo endpoint (đường dẫn `ENDPOINTS`, method, body, schema contracts) và trả DTO
 * đúng như BE. Không map / format ở đây — việc đó của `gamesService`.
 */
import {
  ENDPOINTS,
  GameAdminItem,
  GameByClassStats,
  GameCatalogItem,
  GameTimelineBucket,
  PublicGamesResponse,
  type UpdateGameBody,
} from '@phonics/contracts';
import { z } from 'zod';
import { request, type QueryParams } from '@/shared/api/client';

const AdminGamesResponse = z.object({ items: z.array(GameAdminItem) });

export const gamesRepository = {
  /** Catalog public (mọi role) — tên / giá / trạng thái */
  catalog: () => request(ENDPOINTS.public.games, { schema: PublicGamesResponse, auth: false }),
  /** ADMIN: catalog + số liệu tổng */
  adminList: () => request(ENDPOINTS.admin.games, { schema: AdminGamesResponse }),
  update: (id: string, body: UpdateGameBody) =>
    request(ENDPOINTS.admin.game(id), { method: 'PATCH', body, schema: GameCatalogItem }),
  timeline: (id: string, query: QueryParams) =>
    request(ENDPOINTS.stats.gameTimeline(id), { query, schema: z.array(GameTimelineBucket) }),
  byClass: (id: string, query: QueryParams) =>
    request(ENDPOINTS.stats.gameByClass(id), { query, schema: z.array(GameByClassStats) }),
};
