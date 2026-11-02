import { Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AttendanceService } from '@/features/attendance/api/attendanceService';
import { AttendanceStatusTag } from '@/features/attendance/components/AttendanceStatusTag';
import type { AttendanceSessionModel } from '@/features/attendance/models/AttendanceSessionModel';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';

const RECENT_LIMIT = 10;

/** Các buổi gần đây của một ca (trang chi tiết ca) */
export function RecentSessionsCard({ slotId }: { slotId: string }) {
  const params = { slotId, pageSize: RECENT_LIMIT, sort: 'date:desc' };
  const list = AttendanceService.useList(params);
  const columns: ColumnsType<AttendanceSessionModel> = [
    {
      title: t.attendance.date,
      key: 'date',
      render: (_, s) => <Link to={ROUTES.attendanceSession(s.id)}>{s.dateText}</Link>,
    },
    { title: t.extraSlots.time, key: 'time', render: (_, s) => s.timeRange },
    { title: t.attendance.present, key: 'present', render: (_, s) => s.presentText },
    { title: t.common.status, key: 'status', render: (_, s) => <AttendanceStatusTag status={s.status} /> },
  ];
  return (
    <Card
      title={t.attendance.recentSessions}
      extra={<Link to={`${ROUTES.attendance}?slotId=${slotId}`}>{t.attendance.viewAll}</Link>}
    >
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <DataTable.Static<AttendanceSessionModel>
        rowKey="id"
        loading={list.isFetching}
        columns={columns}
        dataSource={list.data?.items}
        pagination={false}
        locale={{ emptyText: t.attendance.noSessions }}
      />
    </Card>
  );
}
