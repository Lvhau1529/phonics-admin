import type {
  AssignmentCounts,
  AssignmentDetail,
  AssignmentStatus,
  AssignmentSummary,
  MediaMap,
  Subject,
  WorksheetKind,
  WorksheetSnapshot,
} from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { formatDateTime, formatPercent } from '@/shared/utils/format';

/** Bài giao (AssignmentSummary) + getter hiển thị */
export class AssignmentModel {
  readonly id: string;
  readonly worksheetId: string;
  readonly worksheetTitle: string;
  readonly subject: Subject;
  readonly topic: string | null;
  readonly kind: WorksheetKind;
  readonly classId: string;
  readonly className: string;
  readonly assignedById: string;
  readonly assignedByName: string;
  readonly scheduledFor: string;
  readonly availableFrom: string;
  readonly dueAt: string | null;
  readonly allowLate: boolean;
  readonly maxAttempts: number;
  readonly showAnswersAfterSubmit: boolean;
  readonly status: AssignmentStatus;
  readonly maxScore: number;
  readonly hasManualItems: boolean;
  readonly counts: AssignmentCounts;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(data: AssignmentSummary) {
    this.id = data.id;
    this.worksheetId = data.worksheetId;
    this.worksheetTitle = data.worksheetTitle;
    this.subject = data.subject;
    this.topic = data.topic;
    this.kind = data.kind;
    this.classId = data.classId;
    this.className = data.className;
    this.assignedById = data.assignedById;
    this.assignedByName = data.assignedByName;
    this.scheduledFor = data.scheduledFor;
    this.availableFrom = data.availableFrom;
    this.dueAt = data.dueAt;
    this.allowLate = data.allowLate;
    this.maxAttempts = data.maxAttempts;
    this.showAnswersAfterSubmit = data.showAnswersAfterSubmit;
    this.status = data.status;
    this.maxScore = data.maxScore;
    this.hasManualItems = data.hasManualItems;
    this.counts = data.counts;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  get statusLabel(): string {
    return t.assignmentStatus[this.status];
  }

  get statusColor(): string {
    return this.status === 'OPEN' ? 'success' : this.status === 'SCHEDULED' ? 'processing' : 'default';
  }

  get isClosed(): boolean {
    return this.status === 'CLOSED';
  }

  /** Quá hạn (có dueAt đã qua) */
  get isOverdue(): boolean {
    return !!this.dueAt && new Date(this.dueAt).getTime() < Date.now();
  }

  /** "08/10/2026 07:00 → 10/10/2026 20:00" */
  get windowText(): string {
    return t.assignments.window(
      formatDateTime(this.availableFrom),
      this.dueAt ? formatDateTime(this.dueAt) : null,
    );
  }

  /** "12/24" đã nộp / sĩ số */
  get submittedRatioText(): string {
    return `${this.counts.submitted}/${this.counts.students}`;
  }

  get avgPercentText(): string {
    return this.counts.avgPercent === null ? t.common.none : formatPercent(this.counts.avgPercent);
  }

  get pendingGrading(): number {
    return this.counts.pendingGrading;
  }
}

/** Bài giao đầy đủ: snapshot (có answerKey) + media */
export class AssignmentDetailModel extends AssignmentModel {
  readonly snapshot: WorksheetSnapshot;
  readonly media: MediaMap;

  constructor(data: AssignmentDetail) {
    super(data);
    this.snapshot = data.snapshot;
    this.media = data.media;
  }

  get items() {
    return this.snapshot.sections.flatMap((s) => s.items.map((it) => ({ ...it, sectionTitle: s.title })));
  }
}
