import type { GameId, StudentGameStatus, UnlockSource } from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { gameLabel } from '@/shared/utils/format';

/** Trạng thái mở khoá một game của học sinh (từ `StudentGameStatus` của BE) */
export class StudentGameModel {
  readonly gameId: GameId;
  readonly unlocked: boolean;
  readonly source: UnlockSource | null;
  readonly unlockedAt: string | null;
  readonly points: number;
  readonly rounds: number;

  constructor(data: StudentGameStatus) {
    this.gameId = data.gameId;
    this.unlocked = data.unlocked;
    this.source = data.source;
    this.unlockedAt = data.unlockedAt;
    this.points = data.points;
    this.rounds = data.rounds;
  }

  get gameName(): string {
    return gameLabel(this.gameId);
  }

  /** Nguồn mở khoá (kim cương / admin / miễn phí); "—" khi chưa mở */
  get sourceText(): string {
    return this.source ? t.unlockSource[this.source] : t.common.none;
  }
}
