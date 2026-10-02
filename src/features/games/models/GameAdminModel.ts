import type { GameAdminItem } from '@phonics/contracts';
import { GameModel } from '@/features/games/models/GameModel';

/** Game ở trang quản trị (từ `GameAdminItem` của BE): catalog + số liệu tổng */
export class GameAdminModel extends GameModel {
  readonly views: number;
  readonly plays: number;
  readonly uniquePlayers: number;
  readonly unlockedStudents: number;

  constructor(data: GameAdminItem) {
    super(data);
    this.views = data.views;
    this.plays = data.plays;
    this.uniquePlayers = data.uniquePlayers;
    this.unlockedStudents = data.unlockedStudents;
  }
}
