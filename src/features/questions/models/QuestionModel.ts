import type {
  ContentStatus,
  GradingMode,
  MediaMap,
  MediaRef,
  QuestionAnswerKey,
  QuestionConfig,
  QuestionExample,
  QuestionSummary,
  QuestionType,
  QuestionView,
  Visibility,
} from '@phonics/contracts';
import { t } from '@/shared/i18n';

/** Câu hỏi trong danh sách (QuestionSummary) — field cùng tên DTO, getter cho nhãn / cờ FE */
export class QuestionSummaryModel {
  readonly id: string;
  readonly type: QuestionType;
  readonly gradingMode: GradingMode;
  readonly instruction: string;
  readonly instructionVi: string | null;
  readonly points: number;
  readonly tags: string[];
  readonly status: ContentStatus;
  readonly visibility: Visibility;
  readonly createdById: string;
  readonly createdByName: string;
  readonly usedInWorksheets: number;
  readonly thumbnail: MediaRef | null;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(data: QuestionSummary) {
    this.id = data.id;
    this.type = data.type;
    this.gradingMode = data.gradingMode;
    this.instruction = data.instruction;
    this.instructionVi = data.instructionVi;
    this.points = data.points;
    this.tags = data.tags;
    this.status = data.status;
    this.visibility = data.visibility;
    this.createdById = data.createdById;
    this.createdByName = data.createdByName;
    this.usedInWorksheets = data.usedInWorksheets;
    this.thumbnail = data.thumbnail;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  get typeLabel(): string {
    return t.questionType[this.type];
  }

  get isManual(): boolean {
    return this.gradingMode === 'MANUAL';
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

  get thumbnailUrl(): string | undefined {
    return this.thumbnail?.url;
  }

  /** Chủ sở hữu hoặc admin mới sửa được */
  canEditBy(userId: string | undefined, isAdmin: boolean): boolean {
    return isAdmin || this.createdById === userId;
  }
}

/** Câu hỏi đầy đủ (QuestionView): thêm config / answerKey / example / media */
export class QuestionModel extends QuestionSummaryModel {
  readonly example: QuestionExample | null;
  readonly config: QuestionConfig;
  readonly answerKey: QuestionAnswerKey;
  readonly media: MediaMap;

  constructor(data: QuestionView) {
    super(data);
    this.example = data.example;
    this.config = data.config;
    this.answerKey = data.answerKey;
    this.media = data.media;
  }
}
