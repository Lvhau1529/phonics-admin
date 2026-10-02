import type { GameId, PointEntryView, PointKind } from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { formatSigned, gameLabel } from '@/shared/utils/format';

/** Một dòng sổ điểm (từ `PointEntryView` của BE) */
export class PointEntryModel {
  readonly id: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly classId: string | null;
  readonly className: string | null;
  readonly gameId: GameId | null;
  readonly kind: PointKind;
  readonly points: number;
  readonly note: string | null;
  readonly gameResultId: string | null;
  readonly createdById: string | null;
  readonly createdByName: string | null;
  readonly createdAt: string;

  constructor(data: PointEntryView) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.studentName = data.studentName;
    this.classId = data.classId;
    this.className = data.className;
    this.gameId = data.gameId;
    this.kind = data.kind;
    this.points = data.points;
    this.note = data.note;
    this.gameResultId = data.gameResultId;
    this.createdById = data.createdById;
    this.createdByName = data.createdByName;
    this.createdAt = data.createdAt;
  }

  get isBonus(): boolean {
    return this.kind === 'BONUS';
  }

  get isPenalty(): boolean {
    return this.points < 0;
  }

  /** Tên game; "—" với điểm thưởng không gắn game */
  get gameName(): string {
    return gameLabel(this.gameId);
  }

  /** "+5" / "-3" theo định dạng số của ngôn ngữ hiện tại */
  get pointsText(): string {
    return formatSigned(this.points);
  }

  /** Người cộng điểm; điểm do game tự cộng thì là "Hệ thống" */
  get createdByText(): string {
    return this.createdByName ?? t.points.system;
  }
}
