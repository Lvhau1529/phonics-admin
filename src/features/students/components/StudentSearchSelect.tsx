import { Select, type SelectProps } from 'antd';
import { useState } from 'react';
import { StudentsService } from '@/features/students/api/studentsService';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { t } from '@/shared/i18n';
import { selectLoading } from '@/shared/ui/selectLoading';

export interface StudentOption {
  value: string;
  label: string;
}

type StudentSearchSelectProps = Omit<
  SelectProps<string[]>,
  'options' | 'loading' | 'mode' | 'showSearch' | 'onSearch' | 'filterOption'
> & {
  /** Nhãn của các học sinh đã chọn sẵn (không nằm trong kết quả tìm hiện tại) */
  initialOptions?: StudentOption[];
};

/** Chọn nhiều học sinh ở mọi lớp, tìm phía server (tên); giữ nhãn các học sinh đã chọn khi đổi từ khoá */
export function StudentSearchSelect({ initialOptions = [], onChange, ...props }: StudentSearchSelectProps) {
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const { data, isFetching } = StudentsService.useSearch(q);
  const [known, setKnown] = useState<StudentOption[]>(initialOptions);

  const found: StudentOption[] = (data ?? []).map((s) => ({
    value: s.id,
    label: s.fullName,
  }));
  const options = [...found, ...known.filter((k) => !found.some((f) => f.value === k.value))];

  return (
    <Select<string[]>
      mode="multiple"
      showSearch
      filterOption={false}
      placeholder={t.guardians.searchStudents}
      style={{ width: '100%' }}
      {...props}
      onSearch={setSearch}
      onChange={(ids, option) => {
        // Nhớ nhãn của học sinh vừa chọn để còn hiện khi kết quả tìm đổi
        setKnown(options.filter((o) => ids.includes(o.value)));
        onChange?.(ids, option);
      }}
      {...selectLoading(isFetching, found.length > 0)}
      options={options}
    />
  );
}
