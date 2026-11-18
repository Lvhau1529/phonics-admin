import { useState } from 'react';
import { dayjs } from '@/shared/utils/dayjs';

/** Khoảng tháng 'YYYY-MM' [from, to] (cả hai đầu) */
export interface MonthRange {
  from: string;
  to: string;
}

/** Mặc định tháng hiện tại (học phí luôn mở ở tháng này — docs/attendance-calendar-design.md §4.3); đổi được */
export function useMonthRange() {
  return useState<MonthRange>(() => {
    const month = dayjs().format('YYYY-MM');
    return { from: month, to: month };
  });
}
