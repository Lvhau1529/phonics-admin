import type { ClassSummary, GameId } from '@phonics/contracts';
import dayjs, { type ConfigType } from 'dayjs';
import { t } from '@/shared/i18n/vi';

const numberFormat = new Intl.NumberFormat('vi-VN');

/** 1234 → "1.234" */
export const formatNumber = (n: number | null | undefined): string =>
  n === null || n === undefined ? t.common.none : numberFormat.format(n);

/** Điểm có dấu: +5 / -3 */
export const formatSigned = (n: number): string =>
  n > 0 ? `+${numberFormat.format(n)}` : numberFormat.format(n);

/** 0.835 → "83,5%" */
export const formatPercent = (ratio: number): string => `${(ratio * 100).toFixed(1).replace('.', ',')}%`;

/** ISO → 01/10/2026 */
export const formatDate = (value: ConfigType | null | undefined): string =>
  value ? dayjs(value).format('DD/MM/YYYY') : t.common.none;

/** ISO → 01/10/2026 08:30 */
export const formatDateTime = (value: ConfigType | null | undefined): string =>
  value ? dayjs(value).format('DD/MM/YYYY HH:mm') : t.common.none;

/** ms → "1 phút 05 giây" dạng ngắn m:ss */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return t.common.none;
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Ngày cho query API (APP_TIMEZONE phía server): YYYY-MM-DD */
export const toIsoDate = (value: ConfigType): string => dayjs(value).format('YYYY-MM-DD');

/** Nhãn bucket biểu đồ: 01/10 (ngày) */
export const formatBucket = (isoDate: string): string => dayjs(isoDate).format('DD/MM');

/** Tên hiển thị của game theo id (catalog có title riêng nhưng admin dùng tên cố định cho gọn) */
export const gameLabel = (id: GameId | null | undefined): string => (id ? t.gameName[id] : t.common.none);

/** Nhãn lớp trong ô chọn: "K2A · Lớp 2 · 2026-2027" */
export const classLabel = (cls: Pick<ClassSummary, 'name' | 'grade' | 'schoolYear'>): string =>
  `${cls.name} · ${cls.grade} · ${cls.schoolYear}`;
