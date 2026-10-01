import { DatePicker, Select, Space } from 'antd';
import { RangePreset } from '@phonics/contracts';
import { type RangeValue } from '@/shared/utils/range';
import dayjs from 'dayjs';
import { t } from '@/shared/i18n/vi';
import { toIsoDate } from '@/shared/utils/format';

interface RangePickerProps {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  /** Cho phép chọn ngày tuỳ ý */
  allowCustom?: boolean;
  size?: 'small' | 'middle' | 'large';
}

type PresetOrCustom = RangePreset | 'custom';

/** Chọn khoảng thời gian: preset (mọi lúc / hôm nay / tuần / tháng) hoặc từ ngày – đến ngày */
export function RangePicker({ value, onChange, allowCustom = true, size }: RangePickerProps) {
  const mode: PresetOrCustom = value.from && value.to ? 'custom' : value.range;
  const options: { value: PresetOrCustom; label: string }[] = [
    ...RangePreset.options.map((p) => ({ value: p, label: t.range[p] })),
    ...(allowCustom ? [{ value: 'custom' as const, label: t.range.custom }] : []),
  ];

  const handleMode = (next: PresetOrCustom) => {
    if (next === 'custom') {
      const to = dayjs();
      onChange({ range: 'all', from: toIsoDate(to.subtract(29, 'day')), to: toIsoDate(to) });
    } else {
      onChange({ range: next });
    }
  };

  return (
    <Space.Compact size={size}>
      <Select<PresetOrCustom>
        value={mode}
        options={options}
        onChange={handleMode}
        style={{ width: 130 }}
        aria-label={t.common.range}
      />
      {mode === 'custom' && (
        <DatePicker.RangePicker
          size={size}
          allowClear={false}
          format="DD/MM/YYYY"
          value={[dayjs(value.from), dayjs(value.to)]}
          onChange={(dates) => {
            if (!dates || !dates[0] || !dates[1]) return;
            onChange({ range: 'all', from: toIsoDate(dates[0]), to: toIsoDate(dates[1]) });
          }}
        />
      )}
    </Space.Compact>
  );
}
