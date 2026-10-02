import type { ParentContact, StudentDetail } from '@phonics/contracts';
import { StudentModel } from '@/features/students/models/StudentModel';

/** Chi tiết học sinh (từ `StudentDetail` của BE): thêm liên hệ phụ huynh, ghi chú, điểm theo loại */
export class StudentDetailModel extends StudentModel {
  readonly parent: ParentContact | null;
  readonly notes: string | null;
  readonly pointsByKind: { GAME: number; BONUS: number };
  readonly gamesPlayed: number;

  constructor(data: StudentDetail) {
    super(data);
    this.parent = data.parent;
    this.notes = data.notes;
    this.pointsByKind = data.pointsByKind;
    this.gamesPlayed = data.gamesPlayed;
  }

  /** "Tên · email · SĐT" (bỏ phần trống); chuỗi rỗng khi không có gì */
  get parentContactText(): string {
    if (!this.parent) return '';
    return [this.parent.name, this.parent.email, this.parent.phone].filter(Boolean).join(' · ');
  }
}
