/**
 * Service giáo viên: gọi `teachersRepository` rồi đổi DTO → `TeacherModel`. Hook / component chỉ gọi service.
 */
import type {
  CreateTeacherBody,
  SetTeacherClassesBody,
  TeacherSummary,
  UpdateTeacherBody,
} from '@phonics/contracts';
import { teachersRepository } from '@/features/teachers/api/teachersRepository';
import { TeacherModel } from '@/features/teachers/models/TeacherModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';

const toTeacher = (data: TeacherSummary) => new TeacherModel(data);

export const teachersService = {
  list: async (query: QueryParams) => mapPage(await teachersRepository.list(query), toTeacher),
  create: async (body: CreateTeacherBody) => toTeacher(await teachersRepository.create(body)),
  update: async (id: string, body: UpdateTeacherBody) => toTeacher(await teachersRepository.update(id, body)),
  setClasses: async (id: string, body: SetTeacherClassesBody) =>
    toTeacher(await teachersRepository.setClasses(id, body)),
};
