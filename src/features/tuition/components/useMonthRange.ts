import { useState } from 'react';
import { dayjs } from '@/shared/utils/dayjs';

/** Khoảng tháng 'YYYY-MM' [from, to] (cả hai đầu) */
export interface MonthRange {
  from: string;
  to: string;
}

/** Khoảng `months` tháng gần nhất, kết thúc ở tháng này */
export function useMonthRange(months: number) {
  return useState<MonthRange>(() => ({
    from: dayjs()
      .subtract(months - 1, 'month')
      .format('YYYY-MM'),
    to: dayjs().format('YYYY-MM'),
  }));
}
