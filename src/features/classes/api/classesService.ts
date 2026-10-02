/**
 * Service lớp học: gọi `classesRepository` rồi đổi DTO → model (`ClassModel`, `StudentModel`, `PointEntryModel`).
 * Hook / component chỉ gọi service, không gọi repository trực tiếp.
 */
import type {
  AwardBonusBatchBody,
  ClassSummary,
  AwardBonusBody,
  CreateClassBody,
  SetClassTeachersBody,
  UnlockClassBody,
  UpdateClassBody,
} from '@phonics/contracts';
import { classesRepository } from '@/features/classes/api/classesRepository';
import { ClassModel } from '@/features/classes/models/ClassModel';
import { PointEntryModel } from '@/features/points/models/PointEntryModel';
import { StudentModel } from '@/features/students/models/StudentModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';

const toClass = (data: ClassSummary) => new ClassModel(data);

export const classesService = {
  list: async (query: QueryParams) => mapPage(await classesRepository.list(query), toClass),
  detail: async (id: string) => toClass(await classesRepository.detail(id)),
  create: async (body: CreateClassBody) => toClass(await classesRepository.create(body)),
  update: async (id: string, body: UpdateClassBody) => toClass(await classesRepository.update(id, body)),
  setTeachers: async (id: string, body: SetClassTeachersBody) =>
    toClass(await classesRepository.setTeachers(id, body)),
  students: async (id: string, query: QueryParams) =>
    mapPage(await classesRepository.students(id, query), (s) => new StudentModel(s)),
  /** Bảng xếp hạng là số liệu thống kê → giữ DTO */
  ranking: (id: string, query: QueryParams) => classesRepository.ranking(id, query),
  points: async (id: string, query: QueryParams) =>
    mapPage(await classesRepository.points(id, query), (e) => new PointEntryModel(e)),
  bonus: (id: string, body: AwardBonusBody) => classesRepository.bonus(id, body),
  bonusBatch: (id: string, body: AwardBonusBatchBody) => classesRepository.bonusBatch(id, body),
  unlockGame: (id: string, gameId: string, body: UnlockClassBody) =>
    classesRepository.unlockGame(id, gameId, body),
};
