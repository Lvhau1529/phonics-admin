import { Empty } from 'antd';
import { useSearchParams } from 'react-router';
import { ClassPointsTab } from '@/features/classes/components/ClassPointsTab';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { t } from '@/shared/i18n';
import { PageHeader } from '@/shared/ui/PageHeader';

/** Sổ điểm toàn cục: API chỉ có sổ điểm theo lớp nên bắt buộc chọn lớp trước */
export function PointsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const classId = searchParams.get('classId') ?? undefined;

  // Đổi lớp: bỏ mọi filter / trang của lớp cũ
  const setClassId = (next: string | undefined) =>
    setSearchParams(next ? new URLSearchParams({ classId: next }) : new URLSearchParams(), { replace: true });

  return (
    <>
      <PageHeader title={t.points.title} extra={<ClassSelect value={classId} onChange={setClassId} />} />
      {classId ? (
        <ClassPointsTab key={classId} classId={classId} withStudentFilter />
      ) : (
        <Empty description={t.common.selectClassFirst} />
      )}
    </>
  );
}

export default PointsPage;
