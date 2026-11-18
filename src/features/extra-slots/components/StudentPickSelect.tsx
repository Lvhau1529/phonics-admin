import { Select, type SelectProps } from 'antd';
import { type ReactNode, useState } from 'react';
import { StudentsService } from '@/features/students/api/studentsService';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { t } from '@/shared/i18n';
import { selectLoading } from '@/shared/ui/selectLoading';

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
      {...selectLoading(isFetching, options.length > 0)}
      options={options}
    />
  );
}

/** Học sinh đã chọn kèm nhãn (giữ tên khi kết quả tìm kiếm đổi) */
export interface StudentPick {
  value: string;
  label: ReactNode;
}

type StudentMultiPickSelectProps = Omit<
  SelectProps<StudentPick[]>,
  'options' | 'loading' | 'showSearch' | 'onSearch' | 'filterOption' | 'mode' | 'labelInValue'
>;

/** Chọn nhiều học sinh (tìm phía server như `StudentPickSelect`) — giá trị `{ value, label }` để không mất tên */
export function StudentMultiPickSelect(props: StudentMultiPickSelectProps) {
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const { data, isFetching } = StudentsService.useSearch(q);
  const options = (data ?? []).map((s) => ({
    value: s.id,
    label: s.class ? `${s.fullName} · ${s.class.name}` : s.fullName,
  }));
  return (
    <Select<StudentPick[]>
      mode="multiple"
      labelInValue
      showSearch
      allowClear
      filterOption={false}
      placeholder={t.extraSlots.searchStudent}
      style={{ width: '100%' }}
      {...props}
      searchValue={search}
      onSearch={setSearch}
      // Chọn xong một em thì xoá ô tìm để tìm em tiếp theo
      onSelect={() => setSearch('')}
      {...selectLoading(isFetching, options.length > 0)}
      options={options}
    />
  );
}
