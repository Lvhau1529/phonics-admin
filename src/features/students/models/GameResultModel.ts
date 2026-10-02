import type { EndedBy, GameId, GameResultView } from '@phonics/contracts';
import { gameLabel } from '@/shared/utils/format';

/** Một ván chơi của học sinh (từ `GameResultView` của BE) */
export class GameResultModel {
  readonly id: string;
  readonly studentId: string;
  readonly classId: string | null;
  readonly gameId: GameId;
  readonly mode: 'solo';
  readonly levelId: string;
  readonly packId: string | null;
  readonly correct: number;
  readonly total: number;
  readonly score: number;
  readonly durationMs: number | null;
  readonly endedBy: EndedBy;
  readonly playedAt: string;
  readonly pointsAwarded: number;
  readonly details: Record<string, unknown>;
  readonly createdAt: string;

  constructor(data: GameResultView) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.classId = data.classId;
    this.gameId = data.gameId;
    this.mode = data.mode;
    this.levelId = data.levelId;
    this.packId = data.packId;
    this.correct = data.correct;
    this.total = data.total;
    this.score = data.score;
    this.durationMs = data.durationMs;
    this.endedBy = data.endedBy;
    this.playedAt = data.playedAt;
    this.pointsAwarded = data.pointsAwarded;
    this.details = data.details;
    this.createdAt = data.createdAt;
  }

  get gameName(): string {
    return gameLabel(this.gameId);
  }

  /** "7 / 10" */
  get correctText(): string {
    return `${this.correct} / ${this.total}`;
  }

  /** Tỉ lệ đúng 0..1 */
  get accuracy(): number {
    return this.total > 0 ? this.correct / this.total : 0;
  }
}
