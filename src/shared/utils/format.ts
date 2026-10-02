import type { GameId } from '@phonics/contracts';
import dayjs, { type ConfigType } from 'dayjs';
import { t } from '@/shared/i18n';

// Intl.NumberFormat theo ngôn ngữ hiện tại (cache theo locale vì tạo formatter khá tốn)
const numberFormats = new Map<string, Intl.NumberFormat>();
function numberFormat(): Intl.NumberFormat {
  const locale = t.format.numberLocale;
  let fmt = numberFormats.get(locale);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale);
    numberFormats.set(locale, fmt);
  }
  return fmt;
}

/** 1234 → "1.234" (vi) / "1,234" (en) */
export const formatNumber = (n: number | null | undefined): string =>
  n === null || n === undefined ? t.common.none : numberFormat().format(n);

/** Điểm có dấu: +5 / -3 */
export const formatSigned = (n: number): string =>
  n > 0 ? `+${numberFormat().format(n)}` : numberFormat().format(n);

/** 0.835 → "83,5%" (vi) / "83.5%" (en) */
export const formatPercent = (ratio: number): string =>
  `${(ratio * 100).toFixed(1).replace('.', t.format.decimal)}%`;

/** ISO → 01/10/2026 (vi) / Oct 1, 2026 (en) */
export const formatDate = (value: ConfigType | null | undefined): string =>
  value ? dayjs(value).format(t.format.date) : t.common.none;

/** ISO → 01/10/2026 08:30 (vi) / Oct 1, 2026 08:30 (en) */
export const formatDateTime = (value: ConfigType | null | undefined): string =>
  value ? dayjs(value).format(t.format.dateTime) : t.common.none;

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

/** Nhãn bucket biểu đồ: 01/10 (vi) / Oct 1 (en) */
export const formatBucket = (isoDate: string): string => dayjs(isoDate).format(t.format.bucket);

/** Tên hiển thị của game theo id (catalog có title riêng nhưng admin dùng tên cố định cho gọn) */
export const gameLabel = (id: GameId | null | undefined): string => (id ? t.gameName[id] : t.common.none);
