import {
  ENDPOINTS,
  paginated,
  TeacherSummary,
  type CreateTeacherBody,
  type SetTeacherClassesBody,
  type UpdateTeacherBody,
} from '@phonics/contracts';
import { request, type QueryParams } from '@/shared/api/client';

const TeacherPage = paginated(TeacherSummary);

export const teachersApi = {
  list: (query: QueryParams) => request(ENDPOINTS.admin.teachers, { query, schema: TeacherPage }),
  create: (body: CreateTeacherBody) =>
    request(ENDPOINTS.admin.teachers, { method: 'POST', body, schema: TeacherSummary }),
  update: (id: string, body: UpdateTeacherBody) =>
    request(ENDPOINTS.admin.teacher(id), { method: 'PATCH', body, schema: TeacherSummary }),
  setClasses: (id: string, body: SetTeacherClassesBody) =>
    request(ENDPOINTS.admin.teacherClasses(id), { method: 'PUT', body, schema: TeacherSummary }),
};
