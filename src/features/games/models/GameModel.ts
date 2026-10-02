import type { GameCatalogItem, GameId } from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { formatNumber } from '@/shared/utils/format';

/** Game trong catalog (từ `GameCatalogItem` của BE) + dữ liệu hiển thị chỉ phía FE */
export class GameModel {
  readonly id: GameId;
  readonly title: string;
  readonly enabled: boolean;
  readonly comingSoon: boolean;
  readonly price: number | null;
  readonly sortOrder: number;
  readonly updatedAt: string;

  constructor(data: GameCatalogItem) {
    this.id = data.id;
    this.title = data.title;
    this.enabled = data.enabled;
    this.comingSoon = data.comingSoon;
    this.price = data.price;
    this.sortOrder = data.sortOrder;
    this.updatedAt = data.updatedAt;
  }

  get isFree(): boolean {
    return this.price === null;
  }

  /** "Miễn phí" hoặc số kim cương theo định dạng ngôn ngữ hiện tại */
  get priceText(): string {
    return this.price === null ? t.games.priceFree : formatNumber(this.price);
  }

  /** "Bread Catcher (bread-catcher)" — tiêu đề kèm id cho trang quản trị */
  get titleWithId(): string {
    return `${this.title} (${this.id})`;
  }
}
