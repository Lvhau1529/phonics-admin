import { dayjs } from '@/shared/utils/dayjs';

export type CalendarMode = 'week' | 'month';

/** Khoảng ngày hiển thị 'YYYY-MM-DD' (gồm cả hai đầu) — tuần T2–CN; tháng: đủ các tuần phủ tháng (≤ 6 tuần) */
export interface CalendarRange {
  from: string;
  to: string;
  days: string[];
}

const ISO = 'YYYY-MM-DD';

/** Thứ Hai của tuần chứa `date` */
export function mondayOf(date: string): string {
  const d = dayjs(date);
  return d.subtract((d.day() + 6) % 7, 'day').format(ISO);
}

export function calendarRange(mode: CalendarMode, anchor: string): CalendarRange {
  const from = mode === 'week' ? mondayOf(anchor) : mondayOf(dayjs(anchor).startOf('month').format(ISO));
  const to =
    mode === 'week'
      ? dayjs(from).add(6, 'day').format(ISO)
      : dayjs(mondayOf(dayjs(anchor).endOf('month').format(ISO)))
          .add(6, 'day')
          .format(ISO);
  const days: string[] = [];
  for (let d = dayjs(from); d.format(ISO) <= to; d = d.add(1, 'day')) days.push(d.format(ISO));
  return { from, to, days };
}

/** Lùi / tiến một tuần hoặc một tháng */
export function shiftAnchor(mode: CalendarMode, anchor: string, step: -1 | 1): string {
  return dayjs(anchor).add(step, mode).format(ISO);
}
