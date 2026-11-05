import { type StudentDetail } from '@phonics/contracts';
import { StudentGuardianModel } from '@/features/guardians/models/GuardianModel';
import { StudentModel } from '@/features/students/models/StudentModel';

/** Chi tiết học sinh (từ `StudentDetail` của BE): thêm phụ huynh, ghi chú, điểm theo loại */
export class StudentDetailModel extends StudentModel {
  /** null = không có quyền xem liên hệ phụ huynh */
  readonly guardians: StudentGuardianModel[] | null;
  readonly notes: string | null;
  readonly pointsByKind: { GAME: number; BONUS: number };
  readonly gamesPlayed: number;

  constructor(data: StudentDetail) {
    super(data);
    this.guardians = data.guardians?.map((g) => new StudentGuardianModel(g)) ?? null;
    this.notes = data.notes;
    this.pointsByKind = data.pointsByKind;
    this.gamesPlayed = data.gamesPlayed;
  }
}
