import type { ClassSummary, TeacherRef } from '@phonics/contracts';

/**
 * Lớp học (từ `ClassSummary` của BE). Field giữ nguyên tên như contracts (bảng sort server theo `key` = field);
 * getter là dữ liệu chỉ phía FE dùng.
 */
export class ClassModel {
  readonly id: string;
  readonly name: string;
  readonly grade: string;
  readonly schoolYear: string;
  readonly joinVisible: boolean;
  readonly archivedAt: string | null;
  readonly studentCount: number;
  readonly teachers: TeacherRef[];
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(data: ClassSummary) {
    this.id = data.id;
    this.name = data.name;
    this.grade = data.grade;
    this.schoolYear = data.schoolYear;
    this.joinVisible = data.joinVisible;
    this.archivedAt = data.archivedAt;
    this.studentCount = data.studentCount;
    this.teachers = data.teachers;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /** Nhãn trong ô chọn: "K2A · Lớp 2 · 2026-2027" */
  get label(): string {
    return `${this.name} · ${this.grade} · ${this.schoolYear}`;
  }

  get isArchived(): boolean {
    return this.archivedAt !== null;
  }

  /** Đang hiện ở form đăng ký của học sinh (lớp lưu trữ thì không) */
  get isJoinable(): boolean {
    return this.joinVisible && !this.isArchived;
  }

  get teacherIds(): string[] {
    return this.teachers.map((teacher) => teacher.id);
  }
}
