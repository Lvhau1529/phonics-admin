import { Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { PointEntryView, PointKind } from '@phonics/contracts';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { t } from '@/shared/i18n';
import { DataTable, type DataTableProps } from '@/shared/ui/DataTable';
import { formatDateTime, formatSigned, gameLabel } from '@/shared/utils/format';

interface PointsTableProps extends Omit<DataTableProps<PointEntryView>, 'columns'> {
  /** Ẩn cột học sinh (bảng trong trang chi tiết học sinh) */
  hideStudent?: boolean;
  /** Ẩn cột lớp (bảng trong trang lớp) */
  hideClass?: boolean;
}

/** Bảng sổ điểm dùng chung: lớp, học sinh, trang Sổ điểm */
export function PointsTable({ hideStudent, hideClass, ...rest }: PointsTableProps) {
  const columns: ColumnsType<PointEntryView> = [
    {
      title: t.common.time,
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      render: formatDateTime,
      width: 150,
    },
    ...(hideStudent
      ? []
      : [
          {
            title: t.common.student,
            dataIndex: 'studentName',
            render: (name: string, e: PointEntryView) => (
              <Link to={ROUTES.studentDetail(e.studentId)}>{name}</Link>
            ),
          },
        ]),
    ...(hideClass
      ? []
      : [
          {
            title: t.common.class,
            dataIndex: 'className',
            render: (name: string | null, e: PointEntryView) =>
              e.classId ? <Link to={ROUTES.classDetail(e.classId)}>{name}</Link> : t.common.none,
          },
        ]),
    {
      title: t.points.kind,
      dataIndex: 'kind',
      render: (kind: PointKind) => <Tag color={kind === 'BONUS' ? 'gold' : 'blue'}>{t.pointKind[kind]}</Tag>,
    },
    { title: t.common.game, dataIndex: 'gameId', render: gameLabel },
    {
      title: t.common.points,
      dataIndex: 'points',
      key: 'points',
      sorter: true,
      align: 'right',
      render: (p: number) => (
        <Typography.Text type={p < 0 ? 'danger' : 'success'}>{formatSigned(p)}</Typography.Text>
      ),
    },
    { title: t.points.note, dataIndex: 'note', render: (n: string | null) => n ?? t.common.none },
    {
      title: t.points.createdBy,
      dataIndex: 'createdByName',
      render: (n: string | null) => n ?? t.points.system,
    },
  ];
  return <DataTable<PointEntryView> columns={columns} {...rest} />;
}
