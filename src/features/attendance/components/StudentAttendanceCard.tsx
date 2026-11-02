import { Card, DatePicker, Flex, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AttendanceService } from '@/features/attendance/api/attendanceService';
import { AttendanceMarkTag, AttendanceStatusTag } from '@/features/attendance/components/AttendanceStatusTag';
import type { StudentAttendanceItemModel } from '@/features/attendance/models/AttendanceSessionModel';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { dayjs } from '@/shared/utils/dayjs';
import { formatMoney } from '@/shared/utils/format';

const MONTH_FORMAT = 'YYYY-MM';

function buildColumns(showPrice: boolean): ColumnsType<StudentAttendanceItemModel> {
  const columns: ColumnsType<StudentAttendanceItemModel> = [
    {
      title: t.attendance.date,
      key: 'date',
      render: (_, i) => <Link to={ROUTES.attendanceSession(i.sessionId)}>{i.dateText}</Link>,
    },
    { title: t.attendance.session, key: 'slot', render: (_, i) => i.title },
    { title: t.attendance.mark, key: 'mark', render: (_, i) => <AttendanceMarkTag mark={i.mark} /> },
    { title: t.common.status, key: 'status', render: (_, i) => <AttendanceStatusTag status={i.status} /> },
  ];
  if (showPrice)
    columns.push(
      { title: t.attendance.unitPrice, key: 'price', render: (_, i) => i.priceText },
      {
        title: t.attendance.charged,
        key: 'charged',
        render: (_, i) => (i.charged ? t.common.yes : t.common.no),
      },
    );
  return columns;
}

/** Điểm danh theo tháng của học sinh (tab Học thêm) */
export function StudentAttendanceCard({ studentId }: { studentId: string }) {
  const [month, setMonth] = useState(() => dayjs().format(MONTH_FORMAT));
  const query = AttendanceService.useStudentAttendance(studentId, month);
  const data = query.data;
  return (
    <Card
      title={t.attendance.monthly}
      extra={
        <DatePicker
          picker="month"
          allowClear={false}
          value={dayjs(`${month}-01`)}
          format={t.attendance.monthFormat}
          onChange={(d) => d && setMonth(d.format(MONTH_FORMAT))}
        />
      }
    >
      <ErrorAlert error={query.error} onRetry={() => void query.refetch()} />
      <DataTable.Static<StudentAttendanceItemModel>
        rowKey="sessionId"
        loading={query.isFetching}
        columns={buildColumns(data?.chargedTotal !== null && data?.chargedTotal !== undefined)}
        dataSource={data?.items}
        pagination={false}
        locale={{ emptyText: t.attendance.noSessionsInMonth }}
      />
      {data && data.chargedTotal !== null && (
        <Flex justify="flex-end" style={{ marginTop: 12 }}>
          <Typography.Text strong>
            {t.attendance.chargedTotal}: {formatMoney(data.chargedTotal)}
          </Typography.Text>
        </Flex>
      )}
    </Card>
  );
}
