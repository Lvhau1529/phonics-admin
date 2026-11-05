import { Card, Empty } from 'antd';
import { useSearchParams } from 'react-router';
import { ClassReportsTab } from '@/features/classes/components/ClassReportsTab';
import { ClassesService } from '@/features/classes/api/classesService';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { t } from '@/shared/i18n';
import { PageHeader } from '@/shared/ui/PageHeader';

/** Báo cáo: chọn lớp → khoảng thời gian / game → xuất xếp hạng (xlsx / pdf), sổ điểm (xlsx) + xem trước */
export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const classes = ClassesService.useOptions();
  // URL chưa có lớp → mặc định lớp đầu tiên (như Dashboard), không bắt người dùng chọn rồi mới thấy dữ liệu
  const classId = searchParams.get('classId') ?? classes.data?.[0]?.id;
  const setClassId = (next: string | undefined) =>
    setSearchParams(next ? new URLSearchParams({ classId: next }) : new URLSearchParams(), { replace: true });

  return (
    <>
      <PageHeader
        title={t.reports.title}
        extra={<ClassSelect value={classId} onChange={setClassId} allowClear={false} />}
      />
      {classId ? (
        <Card>
          <ClassReportsTab key={classId} classId={classId} />
        </Card>
      ) : (
        <Empty description={t.common.selectClassFirst} />
      )}
    </>
  );
}

export default ReportsPage;
