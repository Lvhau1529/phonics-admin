/**
 * Repository giáo viên: chỉ khai báo endpoint (đường dẫn `ENDPOINTS`, method, body, schema contracts) và trả DTO
 * đúng như BE. Không map / format ở đây — việc đó của `teachersService`.
 */
import {
  ENDPOINTS,
  paginated,
  TeacherSummary,
  type CreateTeacherBody,
  type SetTeacherClassesBody,
  type UpdateTeacherBody,
} from '@phonics/contracts';
import { HttpMethod, request, type QueryParams } from '@/shared/api/client';

const TeacherPage = paginated(TeacherSummary);

export const teachersRepository = {
  list: (query: QueryParams) => request(ENDPOINTS.admin.teachers, { query, schema: TeacherPage }),
  create: (body: CreateTeacherBody) =>
    request(ENDPOINTS.admin.teachers, { method: HttpMethod.POST, body, schema: TeacherSummary }),
  update: (id: string, body: UpdateTeacherBody) =>
    request(ENDPOINTS.admin.teacher(id), { method: HttpMethod.PATCH, body, schema: TeacherSummary }),
  setClasses: (id: string, body: SetTeacherClassesBody) =>
    request(ENDPOINTS.admin.teacherClasses(id), { method: HttpMethod.PUT, body, schema: TeacherSummary }),
};
