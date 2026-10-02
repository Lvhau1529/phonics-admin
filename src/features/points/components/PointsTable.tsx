import { Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { PointKind } from '@phonics/contracts';
import type { PointEntryModel } from '@/features/points/models/PointEntryModel';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { t } from '@/shared/i18n';
import { DataTable, type DataTableProps } from '@/shared/ui/DataTable';
import { formatDateTime } from '@/shared/utils/format';

interface PointsTableProps extends Omit<DataTableProps<PointEntryModel>, 'columns'> {
  /** Ẩn cột học sinh (bảng trong trang chi tiết học sinh) */
  hideStudent?: boolean;
  /** Ẩn cột lớp (bảng trong trang lớp) */
  hideClass?: boolean;
}

/** Bảng sổ điểm dùng chung: lớp, học sinh, trang Sổ điểm */
export function PointsTable({ hideStudent, hideClass, ...rest }: PointsTableProps) {
  const columns: ColumnsType<PointEntryModel> = [
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
            render: (name: string, e: PointEntryModel) => (
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
            render: (name: string | null, e: PointEntryModel) =>
              e.classId ? <Link to={ROUTES.classDetail(e.classId)}>{name}</Link> : t.common.none,
          },
        ]),
    {
      title: t.points.kind,
      dataIndex: 'kind',
      render: (kind: PointKind, e) => <Tag color={e.isBonus ? 'gold' : 'blue'}>{t.pointKind[kind]}</Tag>,
    },
    { title: t.common.game, dataIndex: 'gameId', render: (_, e) => e.gameName },
    {
      title: t.common.points,
      dataIndex: 'points',
      key: 'points',
      sorter: true,
      align: 'right',
      render: (_, e) => (
        <Typography.Text type={e.isPenalty ? 'danger' : 'success'}>{e.pointsText}</Typography.Text>
      ),
    },
    { title: t.points.note, dataIndex: 'note', render: (n: string | null) => n ?? t.common.none },
    {
      title: t.points.createdBy,
      dataIndex: 'createdByName',
      render: (_, e) => e.createdByText,
    },
  ];
  return <DataTable<PointEntryModel> columns={columns} {...rest} />;
}
