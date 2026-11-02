import { Select, type SelectProps } from 'antd';
import { useState } from 'react';
import { StudentsService } from '@/features/students/api/studentsService';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { t } from '@/shared/i18n';

type StudentPickSelectProps = Omit<
  SelectProps<string>,
  'options' | 'loading' | 'showSearch' | 'onSearch' | 'filterOption'
>;

/** Chọn một học sinh, tìm phía server theo tên / email (GV chỉ thấy học sinh lớp mình — server lọc) */
export function StudentPickSelect(props: StudentPickSelectProps) {
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const { data, isFetching } = StudentsService.useSearch(q);
  const options = (data ?? []).map((s) => ({
    value: s.id,
    label: s.class ? `${s.fullName} · ${s.class.name}` : s.fullName,
  }));
  return (
    <Select<string>
      showSearch
      allowClear
      filterOption={false}
      placeholder={t.extraSlots.searchStudent}
      style={{ width: '100%' }}
      {...props}
      onSearch={setSearch}
      loading={isFetching}
      options={options}
    />
  );
}
