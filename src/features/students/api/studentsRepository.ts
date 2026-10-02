/**
 * Repository học sinh: chỉ khai báo endpoint (đường dẫn `ENDPOINTS`, method, body, schema contracts) và trả DTO
 * đúng như BE. Không map / format ở đây — việc đó của `studentsService`.
 */
import {
  ENDPOINTS,
  GameResultView,
  paginated,
  PointEntryView,
  PointsByGame,
  StudentDetail,
  StudentGamesResponse,
  StudentGameStatus,
  StudentSummary,
  type MoveClassBody,
  type ResetPasswordBody,
  type SetStudentGameUnlockBody,
  type UpdateStudentBody,
} from '@phonics/contracts';
import { z } from 'zod';
import { request, type QueryParams } from '@/shared/api/client';

const StudentPage = paginated(StudentSummary);
const PointsPage = paginated(PointEntryView);
const ResultsPage = paginated(GameResultView);
const PointsByGameResponse = z.object({ items: z.array(PointsByGame) });

export const studentsRepository = {
  list: (query: QueryParams) => request(ENDPOINTS.students.list, { query, schema: StudentPage }),
  detail: (id: string) => request(ENDPOINTS.students.detail(id), { schema: StudentDetail }),
  update: (id: string, body: UpdateStudentBody) =>
    request(ENDPOINTS.students.detail(id), { method: 'PATCH', body, schema: StudentDetail }),
  moveClass: (id: string, body: MoveClassBody) =>
    request(ENDPOINTS.students.moveClass(id), { method: 'POST', body, schema: StudentDetail }),
  resetPassword: (id: string, body: ResetPasswordBody) =>
    request<void>(ENDPOINTS.students.resetPassword(id), { method: 'POST', body }),
  points: (id: string, query: QueryParams) =>
    request(ENDPOINTS.students.points(id), { query, schema: PointsPage }),
  pointsByGame: (id: string, query: QueryParams) =>
    request(ENDPOINTS.students.pointsByGame(id), { query, schema: PointsByGameResponse }),
  gameResults: (id: string, query: QueryParams) =>
    request(ENDPOINTS.students.gameResults(id), { query, schema: ResultsPage }),
  games: (id: string) => request(ENDPOINTS.students.games(id), { schema: StudentGamesResponse }),
  setGameUnlock: (id: string, gameId: string, body: SetStudentGameUnlockBody) =>
    request(ENDPOINTS.students.game(id, gameId), { method: 'PUT', body, schema: StudentGameStatus }),
};
