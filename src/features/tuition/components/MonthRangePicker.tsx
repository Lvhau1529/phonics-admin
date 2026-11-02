import { App, DatePicker } from 'antd';
import { monthSpan } from '@phonics/contracts';
import { t } from '@/shared/i18n';
import type { MonthRange } from '@/features/tuition/components/useMonthRange';
import { dayjs } from '@/shared/utils/dayjs';

const MAX_MONTHS = 24;

/** Chọn khoảng tháng (tối đa 24 tháng — giới hạn của API) */
export function MonthRangePicker({
  value,
  onChange,
}: {
  value: MonthRange;
  onChange: (v: MonthRange) => void;
}) {
  const { message } = App.useApp();
  return (
    <DatePicker.RangePicker
      picker="month"
      format={t.attendance.monthFormat}
      allowClear={false}
      aria-label={t.tuition.range}
      value={[dayjs(`${value.from}-01`), dayjs(`${value.to}-01`)]}
      onChange={(range) => {
        const [from, to] = [range?.[0]?.format('YYYY-MM'), range?.[1]?.format('YYYY-MM')];
        if (!from || !to) return;
        if (monthSpan(from, to) > MAX_MONTHS) return void message.warning(t.tuition.rangeTooLong);
        onChange({ from, to });
      }}
    />
  );
}
