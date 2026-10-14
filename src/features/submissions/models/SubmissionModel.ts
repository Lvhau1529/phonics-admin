import type {
  MediaMap,
  QuestionAnswer,
  QuestionAnswerKey,
  QuestionType,
  SnapshotItem,
  SubmissionAnswerView,
  SubmissionDetail,
  SubmissionStatus,
  WorksheetSnapshot,
} from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { formatDuration, formatPercent } from '@/shared/utils/format';

/** Một câu trong bài nộp (SubmissionAnswerView) + getter */
export class SubmissionItemModel {
  readonly worksheetItemId: string;
  readonly questionType: QuestionType;
  readonly maxPoints: number;
  readonly answer: QuestionAnswer | null;
  readonly isCorrect: boolean | null;
  readonly autoScore: number | null;
  readonly manualScore: number | null;
  readonly score: number | null;
  readonly teacherNote: string | null;
  readonly gradeDetail: Record<string, unknown> | null;
  readonly gradedAt: string | null;
  readonly answerKey: QuestionAnswerKey | null;

  constructor(data: SubmissionAnswerView) {
    this.worksheetItemId = data.worksheetItemId;
    this.questionType = data.questionType;
    this.maxPoints = data.maxPoints;
    this.answer = data.answer;
    this.isCorrect = data.isCorrect;
    this.autoScore = data.autoScore;
    this.manualScore = data.manualScore;
    this.score = data.score;
    this.teacherNote = data.teacherNote;
    this.gradeDetail = data.gradeDetail;
    this.gradedAt = data.gradedAt;
    this.answerKey = data.answerKey;
  }

  get isManual(): boolean {
    return this.questionType === 'TRACE_AND_READ' || this.questionType === 'SPEAK';
  }

  /** Câu chấm tay chưa có điểm */
  get needsManual(): boolean {
    return this.isManual && this.manualScore === null;
  }

  get effectiveScore(): number {
    return this.manualScore ?? this.autoScore ?? 0;
  }

  /** Nhãn kết quả: đúng / sai / một phần / chờ chấm */
  get resultLabel(): string {
    if (this.needsManual) return t.submissionStatus.SUBMITTED;
    if (this.isCorrect) return t.grading.correct;
    if (this.effectiveScore > 0) return t.grading.partial;
    return t.grading.incorrect;
  }

  get resultColor(): string {
    if (this.needsManual) return 'processing';
    if (this.isCorrect) return 'success';
    if (this.effectiveScore > 0) return 'warning';
    return 'error';
  }

  /** mediaId ghi âm / tô chữ trong câu trả lời (dạng chấm tay) */
  get recordingMediaId(): string | null {
    const a = this.answer as { recordingMediaId?: string } | null;
    return a?.recordingMediaId ?? null;
  }

  get traceMediaId(): string | null {
    const a = this.answer as { traceMediaId?: string } | null;
    return a?.traceMediaId ?? null;
  }
}

/** Bài nộp đầy đủ */
export class SubmissionModel {
  readonly id: string;
  readonly assignmentId: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly attemptNo: number;
  readonly status: SubmissionStatus;
  readonly startedAt: string;
  readonly submittedAt: string | null;
  readonly gradedAt: string | null;
  readonly gradedById: string | null;
  readonly gradedByName: string | null;
  readonly autoScore: number;
  readonly manualScore: number | null;
  readonly totalScore: number | null;
  readonly maxScore: number;
  readonly percent: number | null;
  readonly durationMs: number | null;
  readonly late: boolean;
  readonly updatedAt: string;
  readonly answers: SubmissionItemModel[];
  readonly worksheet: WorksheetSnapshot;
  readonly media: MediaMap;
  readonly pendingManual: number;

  constructor(data: SubmissionDetail) {
    this.id = data.id;
    this.assignmentId = data.assignmentId;
    this.studentId = data.studentId;
    this.studentName = data.studentName;
    this.attemptNo = data.attemptNo;
    this.status = data.status;
    this.startedAt = data.startedAt;
    this.submittedAt = data.submittedAt;
    this.gradedAt = data.gradedAt;
    this.gradedById = data.gradedById;
    this.gradedByName = data.gradedByName;
    this.autoScore = data.autoScore;
    this.manualScore = data.manualScore;
    this.totalScore = data.totalScore;
    this.maxScore = data.maxScore;
    this.percent = data.percent;
    this.durationMs = data.durationMs;
    this.late = data.late;
    this.updatedAt = data.updatedAt;
    this.answers = data.answers.map((a) => new SubmissionItemModel(a));
    // GV luôn nhận snapshot đầy đủ (có answerKey)
    this.worksheet = data.worksheet as WorksheetSnapshot;
    this.media = data.media;
    this.pendingManual = data.pendingManual;
  }

  get statusLabel(): string {
    return t.submissionStatus[this.status];
  }

  get statusColor(): string {
    return this.status === 'GRADED' ? 'success' : this.status === 'SUBMITTED' ? 'processing' : 'default';
  }

  get isInProgress(): boolean {
    return this.status === 'IN_PROGRESS';
  }

  get isGraded(): boolean {
    return this.status === 'GRADED';
  }

  get percentText(): string {
    return this.percent === null ? t.common.none : formatPercent(this.percent);
  }

  get scoreText(): string {
    return `${this.totalScore ?? this.autoScore}/${this.maxScore}`;
  }

  get durationText(): string {
    return formatDuration(this.durationMs);
  }

  /** Item snapshot theo thứ tự Part → câu, kèm tên Part và câu trả lời tương ứng */
  get items(): { item: SnapshotItem; sectionTitle: string; answer: SubmissionItemModel | undefined }[] {
    const byId = new Map(this.answers.map((a) => [a.worksheetItemId, a]));
    return this.worksheet.sections.flatMap((s) =>
      s.items.map((item) => ({ item, sectionTitle: s.title, answer: byId.get(item.worksheetItemId) })),
    );
  }
}
