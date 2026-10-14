import type {
  ContentStatus,
  MediaMap,
  QuestionView,
  Subject,
  Visibility,
  WorksheetDetail,
  WorksheetKind,
  WorksheetSectionView,
  WorksheetSummary,
} from '@phonics/contracts';
import { t } from '@/shared/i18n';

/** Phiếu bài tập trong danh sách */
export class WorksheetSummaryModel {
  readonly id: string;
  readonly title: string;
  readonly subject: Subject;
  readonly topic: string | null;
  readonly grade: string | null;
  readonly week: number | null;
  readonly day: number | null;
  readonly kind: WorksheetKind;
  readonly status: ContentStatus;
  readonly visibility: Visibility;
  readonly note: string | null;
  readonly itemCount: number;
  readonly maxScore: number;
  readonly assignmentCount: number;
  readonly createdById: string;
  readonly createdByName: string;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(data: WorksheetSummary) {
    this.id = data.id;
    this.title = data.title;
    this.subject = data.subject;
    this.topic = data.topic;
    this.grade = data.grade;
    this.week = data.week;
    this.day = data.day;
    this.kind = data.kind;
    this.status = data.status;
    this.visibility = data.visibility;
    this.note = data.note;
    this.itemCount = data.itemCount;
    this.maxScore = data.maxScore;
    this.assignmentCount = data.assignmentCount;
    this.createdById = data.createdById;
    this.createdByName = data.createdByName;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  get isPublished(): boolean {
    return this.status === 'PUBLISHED';
  }

  get isArchived(): boolean {
    return this.status === 'ARCHIVED';
  }

  get statusColor(): string {
    return this.status === 'PUBLISHED' ? 'success' : this.status === 'ARCHIVED' ? 'default' : 'warning';
  }

  /** "Tuần 9 · D3" */
  get scheduleText(): string {
    return t.worksheets.scheduleText(this.week, this.day);
  }

  get kindLabel(): string {
    return t.worksheetKind[this.kind];
  }

  get subjectLabel(): string {
    return t.subject[this.subject];
  }

  /** "Letter Nn · Handout · Tuần 9 · D3" cho phụ đề / ô chọn */
  get subtitle(): string {
    return [this.topic, this.kindLabel, this.week || this.day ? this.scheduleText : null]
      .filter(Boolean)
      .join(' · ');
  }

  canEditBy(userId: string | undefined, isAdmin: boolean): boolean {
    return isAdmin || this.createdById === userId;
  }
}

/** Phiếu đầy đủ: Part → câu (summary) + map câu hỏi đầy đủ + media */
export class WorksheetModel extends WorksheetSummaryModel {
  readonly sections: WorksheetSectionView[];
  readonly questions: Record<string, QuestionView>;
  readonly media: MediaMap;

  constructor(data: WorksheetDetail) {
    super(data);
    this.sections = data.sections;
    this.questions = data.questions;
    this.media = data.media;
  }

  /** Tổng điểm từ cấu trúc hiện tại (= maxScore của BE) */
  get totalPoints(): number {
    return this.sections.reduce((sum, s) => sum + s.items.reduce((x, it) => x + it.points, 0), 0);
  }

  get questionIds(): string[] {
    return this.sections.flatMap((s) => s.items.map((it) => it.questionId));
  }
}
