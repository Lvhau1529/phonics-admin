import { Card, Empty } from 'antd';
import { useSearchParams } from 'react-router';
import { ClassReportsTab } from '@/features/classes/components/ClassReportsTab';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { t } from '@/shared/i18n/vi';
import { PageHeader } from '@/shared/ui/PageHeader';

/** Báo cáo: chọn lớp → khoảng thời gian / game → xuất xếp hạng (xlsx / pdf), sổ điểm (xlsx) + xem trước */
export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const classId = searchParams.get('classId') ?? undefined;
  const setClassId = (next: string | undefined) =>
    setSearchParams(next ? new URLSearchParams({ classId: next }) : new URLSearchParams(), { replace: true });

  return (
    <>
      <PageHeader title={t.reports.title} extra={<ClassSelect value={classId} onChange={setClassId} />} />
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
