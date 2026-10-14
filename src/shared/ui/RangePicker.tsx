import { DatePicker, Select, Space } from 'antd';
import { type SizeType } from 'antd/es/config-provider/SizeContext';
import { RangePreset } from '@phonics/contracts';
import { dayjs } from '@/shared/utils/dayjs';
import { RangeOption, type RangeValue } from '@/shared/utils/range';
import { t } from '@/shared/i18n';
import { toIsoDate } from '@/shared/utils/format';

interface RangePickerProps {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  /** Cho phép chọn ngày tuỳ ý */
  allowCustom?: boolean;
  size?: SizeType;
}

/** Chọn khoảng thời gian: preset (mọi lúc / hôm nay / tuần / tháng) hoặc từ ngày – đến ngày */
export function RangePicker({ value, onChange, allowCustom = true, size }: RangePickerProps) {
  const mode: RangeOption = value.from && value.to ? RangeOption.CUSTOM : value.range;
  const options: { value: RangeOption; label: string }[] = [
    ...RangePreset.options.map((p) => ({ value: p, label: t.range[p] })),
    ...(allowCustom ? [{ value: RangeOption.CUSTOM, label: t.range.custom }] : []),
  ];

  const handleMode = (next: RangeOption) => {
    if (next === RangeOption.CUSTOM) {
      const to = dayjs();
      onChange({ range: RangePreset.enum.all, from: toIsoDate(to.subtract(29, 'day')), to: toIsoDate(to) });
    } else {
      onChange({ range: next });
    }
  };

  return (
    <Space.Compact size={size}>
      <Select<RangeOption>
        value={mode}
        options={options}
        onChange={handleMode}
        style={{ width: 130 }}
        aria-label={t.common.range}
      />
      {mode === RangeOption.CUSTOM && (
        <DatePicker.RangePicker
          size={size}
          allowClear={false}
          format={t.format.date}
          value={[dayjs(value.from), dayjs(value.to)]}
          onChange={(dates) => {
            if (!dates || !dates[0] || !dates[1]) return;
            onChange({ range: RangePreset.enum.all, from: toIsoDate(dates[0]), to: toIsoDate(dates[1]) });
          }}
        />
      )}
    </Space.Compact>
  );
}
