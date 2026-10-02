import { Select, type SelectProps } from 'antd';
import { useClassOptions } from '@/features/classes/hooks';
import { t } from '@/shared/i18n';

type ClassSelectProps<V extends string | string[]> = Omit<SelectProps<V>, 'options' | 'loading'> & {
  /** Chỉ hiện lớp lưu trữ (mặc định lớp đang hoạt động) */
  archived?: boolean;
  /** Bỏ lớp này khỏi danh sách (chuyển lớp: không chọn lại lớp hiện tại) */
  excludeId?: string;
};

/** Ô chọn lớp (giáo viên chỉ thấy lớp mình phụ trách — server lọc) */
export function ClassSelect<V extends string | string[] = string>({
  archived = false,
  excludeId,
  ...props
}: ClassSelectProps<V>) {
  const { data, isLoading } = useClassOptions(archived);
  const options = (data ?? [])
    .filter((cls) => cls.id !== excludeId)
    .map((cls) => ({ value: cls.id, label: cls.label }));
  return (
    <Select<V>
      showSearch
      allowClear
      optionFilterProp="label"
      placeholder={t.common.selectClass}
      style={{ minWidth: 220 }}
      notFoundContent={isLoading ? t.common.loading : t.dashboard.noClasses}
      {...props}
      loading={isLoading}
      options={options}
    />
  );
}
