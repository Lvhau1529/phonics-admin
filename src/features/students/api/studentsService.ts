/**
 * Service học sinh: gọi `studentsRepository` rồi đổi DTO → model (`StudentModel`, `StudentDetailModel`,
 * `PointEntryModel`, `GameResultModel`, `StudentGameModel`). Hook / component chỉ gọi service.
 */
import type {
  MoveClassBody,
  ResetPasswordBody,
  SetStudentGameUnlockBody,
  StudentDetail,
  UpdateStudentBody,
} from '@phonics/contracts';
import { PointEntryModel } from '@/features/points/models/PointEntryModel';
import { studentsRepository } from '@/features/students/api/studentsRepository';
import { GameResultModel } from '@/features/students/models/GameResultModel';
import { StudentDetailModel } from '@/features/students/models/StudentDetailModel';
import { StudentGameModel } from '@/features/students/models/StudentGameModel';
import { StudentModel } from '@/features/students/models/StudentModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';

const toDetail = (data: StudentDetail) => new StudentDetailModel(data);

export const studentsService = {
  list: async (query: QueryParams) =>
    mapPage(await studentsRepository.list(query), (s) => new StudentModel(s)),
  detail: async (id: string) => toDetail(await studentsRepository.detail(id)),
  update: async (id: string, body: UpdateStudentBody) => toDetail(await studentsRepository.update(id, body)),
  moveClass: async (id: string, body: MoveClassBody) =>
    toDetail(await studentsRepository.moveClass(id, body)),
  resetPassword: (id: string, body: ResetPasswordBody) => studentsRepository.resetPassword(id, body),
  points: async (id: string, query: QueryParams) =>
    mapPage(await studentsRepository.points(id, query), (e) => new PointEntryModel(e)),
  /** Điểm theo game là số liệu thống kê (biểu đồ) → giữ DTO */
  pointsByGame: async (id: string, query: QueryParams) =>
    (await studentsRepository.pointsByGame(id, query)).items,
  gameResults: async (id: string, query: QueryParams) =>
    mapPage(await studentsRepository.gameResults(id, query), (r) => new GameResultModel(r)),
  games: async (id: string) => (await studentsRepository.games(id)).items.map((g) => new StudentGameModel(g)),
  setGameUnlock: async (id: string, gameId: string, body: SetStudentGameUnlockBody) =>
    new StudentGameModel(await studentsRepository.setGameUnlock(id, gameId, body)),
};
