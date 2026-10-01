import { Select, type SelectProps } from 'antd';
import { useStudentOptions } from '@/features/students/hooks';
import { t } from '@/shared/i18n/vi';

type StudentSelectProps = Omit<SelectProps<string>, 'options' | 'loading'> & {
  /** Lớp cần liệt kê học sinh; không có lớp thì ô bị khoá */
  classId: string | undefined;
};

/** Ô chọn học sinh trong một lớp (tìm theo tên / email) */
export function StudentSelect({ classId, ...props }: StudentSelectProps) {
  const { data, isLoading } = useStudentOptions(classId);
  const options = (data ?? []).map((s) => ({ value: s.id, label: `${s.displayName} · ${s.email}` }));
  return (
    <Select<string>
      showSearch
      allowClear
      optionFilterProp="label"
      placeholder={t.common.selectStudent}
      style={{ minWidth: 220 }}
      disabled={!classId}
      {...props}
      loading={isLoading}
      options={options}
    />
  );
}
