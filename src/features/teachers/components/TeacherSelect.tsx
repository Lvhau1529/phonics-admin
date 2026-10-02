import { Select, type SelectProps } from 'antd';
import { useState } from 'react';
import { useTeacherOptions } from '@/features/teachers/hooks';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { t } from '@/shared/i18n';

type TeacherSelectProps = Omit<SelectProps<string | string[]>, 'options' | 'loading'> & {
  /** Tìm server-side theo q (mặc định tải 100 GV đầu rồi lọc tại chỗ) */
  remoteSearch?: boolean;
};

/** Ô chọn giáo viên (một hoặc nhiều — `mode="multiple"`) — ADMIN */
export function TeacherSelect({ remoteSearch = false, ...props }: TeacherSelectProps) {
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(remoteSearch ? search : '', 300);
  const { data, isLoading } = useTeacherOptions(q);
  const options = (data ?? []).map((tc) => ({ value: tc.id, label: tc.optionLabel }));
  return (
    <Select
      showSearch
      allowClear
      optionFilterProp="label"
      filterOption={remoteSearch ? false : undefined}
      onSearch={remoteSearch ? setSearch : undefined}
      placeholder={t.common.teacher}
      style={{ minWidth: 240 }}
      {...props}
      loading={isLoading}
      options={options}
    />
  );
}
