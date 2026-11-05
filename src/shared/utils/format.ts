import type { GameId } from '@phonics/contracts';
import { t, type IsoWeekday } from '@/shared/i18n';
import { dayjs, type ConfigType } from '@/shared/utils/dayjs';

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

/**
 * Định dạng ô nhập tiền (InputNumber): ô trống phải giữ trống — antd đưa '' vào formatter / parser, mà `Number('')`
 * là 0 nên ô trống từng hiện và lưu thành 0 ₫.
 */
export const formatPriceInput = (v: number | string | undefined): string =>
  v === undefined || v === null || v === '' ? '' : formatNumber(Number(v));

/** Ngược của formatPriceInput: bỏ dấu phân cách; trống → '' (antd hiểu là chưa nhập) */
export const parsePriceInput = (v: string | undefined): number => {
  const digits = (v ?? '').replace(/\D/g, '');
  return (digits === '' ? '' : Number(digits)) as number;
};

/** Danh sách dài rút gọn: ["Cô Lan", "Thầy Minh", "Mr. Nam"] → "Cô Lan, Thầy Minh +1" (rỗng → "—") */
export function shortList(items: readonly string[], max = 2): string {
  if (items.length === 0) return t.common.none;
  const shown = items.slice(0, max).join(', ');
  return items.length > max ? `${shown} ${t.common.andMore(items.length - max)}` : shown;
}

const moneyFormats = new Map<string, Intl.NumberFormat>();

/** Tiền theo ngôn ngữ hiện tại: 150000 → "150.000 ₫" (vi) / "₫150,000" (en) */
export function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return t.common.none;
  const locale = t.format.numberLocale;
  let fmt = moneyFormats.get(locale);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: t.format.currency,
      maximumFractionDigits: 0,
    });
    moneyFormats.set(locale, fmt);
  }
  return fmt.format(n);
}

const compactFormats = new Map<string, Intl.NumberFormat>();

/** Số gọn cho trục biểu đồ: 1200000 → "1,2 Tr" (vi) / "1.2M" (en) */
export function formatCompact(n: number): string {
  const locale = t.format.numberLocale;
  let fmt = compactFormats.get(locale);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
    compactFormats.set(locale, fmt);
  }
  return fmt.format(n);
}

/** Tiền có dấu: "+120.000 ₫" / "-50.000 ₫" / "0 ₫" */
export const signedMoney = (n: number): string => (n > 0 ? `+${formatMoney(n)}` : formatMoney(n));

/** Contracts để weekday là number (1..7) → khoá từ điển thứ */
export const isoWeekday = (n: number): IsoWeekday => Math.min(7, Math.max(1, Math.trunc(n))) as IsoWeekday;

/** "T3 18/11/2026" — thứ (theo ngày) + ngày; dayjs().day() 0 = Chủ nhật → ISO 7 */
export const sessionDateText = (date: string): string =>
  `${t.weekdayShort[isoWeekday(dayjs(date).day() || 7)]} ${formatDate(date)}`;

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

/** ms → dạng ngắn m:ss, làm tròn tới giây (65_000 → "1:05"); phút không quay vòng sau 59 (75:00) */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return t.common.none;
  const duration = dayjs.duration(Math.round(ms / 1000), 'seconds');
  return `${Math.floor(duration.asMinutes())}:${duration.format('ss')}`;
}

/** Ngày cho query API (APP_TIMEZONE phía server): YYYY-MM-DD */
export const toIsoDate = (value: ConfigType): string => dayjs(value).format('YYYY-MM-DD');

/** Nhãn bucket biểu đồ: 01/10 (vi) / Oct 1 (en) */
export const formatBucket = (isoDate: string): string => dayjs(isoDate).format(t.format.bucket);

/** Tên hiển thị của game theo id (catalog có title riêng nhưng admin dùng tên cố định cho gọn) */
export const gameLabel = (id: GameId | null | undefined): string => (id ? t.gameName[id] : t.common.none);
