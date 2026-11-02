import { Select, type SelectProps } from 'antd';
import { ExtraSlotsService } from '@/features/extra-slots/api/extraSlotsService';
import { t } from '@/shared/i18n';

type ExtraSlotSelectProps = Omit<SelectProps<string>, 'options' | 'loading'> & {
  /** Bỏ ca này khỏi danh sách (chuyển ca: không chọn lại ca hiện tại) */
  excludeId?: string;
};

/** Ô chọn ca học thêm đang hoạt động (GV chỉ thấy ca mình dạy — server lọc) */
export function ExtraSlotSelect({ excludeId, ...props }: ExtraSlotSelectProps) {
  const { data, isLoading } = ExtraSlotsService.useOptions();
  const options = (data ?? [])
    .filter((s) => !s.isArchived && s.id !== excludeId)
    .map((s) => ({ value: s.id, label: s.label }));
  return (
    <Select<string>
      showSearch
      allowClear
      optionFilterProp="label"
      placeholder={t.studentExtra.selectSlot}
      style={{ minWidth: 260 }}
      {...props}
      loading={isLoading}
      options={options}
    />
  );
}
