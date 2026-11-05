import { Select, type SelectProps } from 'antd';
import { StudentsService } from '@/features/students/api/studentsService';
import { t } from '@/shared/i18n';
import { selectLoading } from '@/shared/ui/selectLoading';

type StudentSelectProps = Omit<
  SelectProps<string>,
  'options' | 'loading' | 'notFoundContent' | 'popupRender'
> & {
  /** Lớp cần liệt kê học sinh; không có lớp thì ô bị khoá */
  classId: string | undefined;
};

/** Ô chọn học sinh trong một lớp (tìm theo tên) */
export function StudentSelect({ classId, ...props }: StudentSelectProps) {
  const { data, isLoading } = StudentsService.useOptions(classId);
  const options = (data ?? []).map((s) => ({
    value: s.id,
    label: s.fullName,
  }));
  return (
    <Select<string>
      showSearch
      allowClear
      optionFilterProp="label"
      placeholder={t.common.selectStudent}
      style={{ minWidth: 220 }}
      disabled={!classId}
      {...props}
      {...selectLoading(isLoading, options.length > 0)}
      options={options}
    />
  );
}
