import { Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import type {
  TuitionMonthModel,
  TuitionSlotModel,
  TuitionStudentModel,
} from '@/features/tuition/models/TuitionModel';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { formatMoney, formatNumber } from '@/shared/utils/format';

type Row = TuitionMonthModel | TuitionSlotModel | TuitionStudentModel;

/** Cột tiền + điểm danh dùng chung cho bảng tháng / ca / học sinh */
function moneyColumns<T extends Row>(): ColumnsType<T> {
  return [
    {
      title: t.tuition.confirmed,
      key: 'confirmed',
      align: 'right',
      render: (_, r) => formatMoney(r.confirmedTotal),
    },
    {
      title: t.tuition.pending,
      key: 'pending',
      align: 'right',
      render: (_, r) =>
        r.pendingTotal ? (
          <Typography.Text type="warning">{formatMoney(r.pendingTotal)}</Typography.Text>
        ) : (
          formatMoney(0)
        ),
    },
    {
      title: t.tuition.total,
      key: 'total',
      align: 'right',
      render: (_, r) => <Typography.Text strong>{formatMoney(r.total)}</Typography.Text>,
    },
    {
      title: `${t.tuition.present} / ${t.tuition.absent} / ${t.tuition.excused}`,
      key: 'marks',
      align: 'center',
      render: (_, r) => `${r.presentCount} / ${r.absentCount} / ${r.excusedCount}`,
    },
  ];
}

export function TuitionMonthsTable({
  months,
  loading,
  showStudents,
}: {
  months: TuitionMonthModel[] | undefined;
  loading: boolean;
  showStudents?: boolean;
}) {
  const columns: ColumnsType<TuitionMonthModel> = [
    { title: t.tuition.month, key: 'month', render: (_, m) => m.label },
    ...moneyColumns<TuitionMonthModel>(),
    ...(showStudents
      ? [
          {
            title: t.tuition.students,
            key: 'students',
            align: 'right' as const,
            render: (_: unknown, m: TuitionMonthModel) => formatNumber(m.studentCount),
          },
        ]
      : []),
  ];
  return (
    <DataTable.Static<TuitionMonthModel>
      rowKey="month"
      columns={columns}
      dataSource={months ? [...months].reverse() : undefined}
      loading={loading}
      pagination={false}
      size="small"
      scroll={{ x: 'max-content' }}
    />
  );
}

export function TuitionSlotsTable({
  rows,
  loading,
}: {
  rows: TuitionSlotModel[] | undefined;
  loading: boolean;
}) {
  const columns: ColumnsType<TuitionSlotModel> = [
    {
      title: t.tuition.slot,
      key: 'slot',
      render: (_, s) => (s.slotId ? <Link to={ROUTES.extraSlotDetail(s.slotId)}>{s.label}</Link> : s.label),
    },
    ...moneyColumns<TuitionSlotModel>(),
    {
      title: t.tuition.students,
      key: 'students',
      align: 'right',
      render: (_, s) => formatNumber(s.studentCount),
    },
  ];
  return (
    <DataTable.Static<TuitionSlotModel>
      rowKey={(s) => s.slotId ?? 'makeup'}
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
      size="small"
      scroll={{ x: 'max-content' }}
    />
  );
}

export function TuitionStudentsTable({
  rows,
  loading,
}: {
  rows: TuitionStudentModel[] | undefined;
  loading: boolean;
}) {
  const columns: ColumnsType<TuitionStudentModel> = [
    {
      title: t.common.student,
      key: 'student',
      render: (_, s) => <Link to={`${ROUTES.studentDetail(s.studentId)}?tab=tuition`}>{s.displayName}</Link>,
    },
    ...moneyColumns<TuitionStudentModel>(),
  ];
  return (
    <DataTable.Static<TuitionStudentModel>
      rowKey="studentId"
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
      size="small"
      scroll={{ x: 'max-content' }}
    />
  );
}
