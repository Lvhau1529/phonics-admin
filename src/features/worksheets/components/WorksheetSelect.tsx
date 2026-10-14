import { Select, type SelectProps } from 'antd';
import { useWorksheetOptions } from '@/features/worksheets/hooks';
import { t } from '@/shared/i18n';

type WorksheetSelectProps = Omit<SelectProps<string>, 'options' | 'loading'>;

/** Ô chọn phiếu đã phát hành (giao bài) */
export function WorksheetSelect(props: WorksheetSelectProps) {
  const { data, isLoading } = useWorksheetOptions();
  const options = (data ?? []).map((w) => ({ value: w.id, label: `${w.title} · ${w.subtitle}` }));
  return (
    <Select<string>
      showSearch
      allowClear
      optionFilterProp="label"
      placeholder={t.assignments.worksheet}
      style={{ minWidth: 260 }}
      notFoundContent={isLoading ? t.common.loading : t.common.noData}
      {...props}
      loading={isLoading}
      options={options}
    />
  );
}
