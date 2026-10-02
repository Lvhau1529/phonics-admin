/**
 * Repository lớp học: chỉ khai báo endpoint (đường dẫn `ENDPOINTS`, method, body, schema contracts) và trả DTO
 * đúng như BE. Không map / format ở đây — việc đó của `classesService`.
 */
import {
  AwardBonusBatchResponse,
  AwardBonusResponse,
  ClassSummary,
  ENDPOINTS,
  paginated,
  PointEntryView,
  RankingResponse,
  StudentSummary,
  UnlockClassResponse,
  type AwardBonusBatchBody,
  type AwardBonusBody,
  type CreateClassBody,
  type SetClassTeachersBody,
  type UnlockClassBody,
  type UpdateClassBody,
} from '@phonics/contracts';
import { request, type QueryParams } from '@/shared/api/client';

const ClassPage = paginated(ClassSummary);
const StudentPage = paginated(StudentSummary);
const PointsPage = paginated(PointEntryView);

export const classesRepository = {
  list: (query: QueryParams) => request(ENDPOINTS.classes.list, { query, schema: ClassPage }),
  detail: (id: string) => request(ENDPOINTS.classes.detail(id), { schema: ClassSummary }),
  create: (body: CreateClassBody) =>
    request(ENDPOINTS.classes.list, { method: 'POST', body, schema: ClassSummary }),
  update: (id: string, body: UpdateClassBody) =>
    request(ENDPOINTS.classes.detail(id), { method: 'PATCH', body, schema: ClassSummary }),
  setTeachers: (id: string, body: SetClassTeachersBody) =>
    request(ENDPOINTS.classes.teachers(id), { method: 'PUT', body, schema: ClassSummary }),
  students: (id: string, query: QueryParams) =>
    request(ENDPOINTS.classes.students(id), { query, schema: StudentPage }),
  ranking: (id: string, query: QueryParams) =>
    request(ENDPOINTS.classes.ranking(id), { query, schema: RankingResponse }),
  points: (id: string, query: QueryParams) =>
    request(ENDPOINTS.classes.points(id), { query, schema: PointsPage }),
  bonus: (id: string, body: AwardBonusBody) =>
    request(ENDPOINTS.classes.bonus(id), { method: 'POST', body, schema: AwardBonusResponse }),
  bonusBatch: (id: string, body: AwardBonusBatchBody) =>
    request(ENDPOINTS.classes.bonusBatch(id), { method: 'POST', body, schema: AwardBonusBatchResponse }),
  unlockGame: (id: string, gameId: string, body: UnlockClassBody) =>
    request(ENDPOINTS.classes.unlockGame(id, gameId), { method: 'POST', body, schema: UnlockClassResponse }),
};
