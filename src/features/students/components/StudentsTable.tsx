import { Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { StudentSummary, UserStatus } from '@phonics/contracts';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { t } from '@/shared/i18n/vi';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { DataTable, type DataTableProps } from '@/shared/ui/DataTable';
import { StatusTag } from '@/shared/ui/RoleTag';
import { formatDateTime, formatNumber } from '@/shared/utils/format';

interface StudentsTableProps extends Omit<DataTableProps<StudentSummary>, 'columns'> {
  /** Ẩn cột lớp (bảng trong trang lớp) */
  hideClass?: boolean;
  /** Cột thao tác (nút theo quyền của trang) */
  renderActions?: (student: StudentSummary) => ReactNode;
}

/** Bảng học sinh dùng chung cho trang Học sinh và tab Học sinh của lớp */
export function StudentsTable({ hideClass, renderActions, ...rest }: StudentsTableProps) {
  const columns: ColumnsType<StudentSummary> = [
    {
      title: t.common.name,
      key: 'displayName',
      sorter: true,
      render: (_, s) => (
        <Space>
          <AvatarImg avatarKey={s.avatarKey} name={s.displayName} size="small" />
          <Link to={ROUTES.studentDetail(s.id)}>
            <Typography.Text strong>{s.displayName}</Typography.Text>
          </Link>
        </Space>
      ),
    },
    { title: t.common.email, dataIndex: 'email', key: 'email', sorter: true },
    ...(hideClass
      ? []
      : [
          {
            title: t.common.class,
            dataIndex: 'class',
            render: (cls: StudentSummary['class']) =>
              cls ? (
                <Link to={ROUTES.classDetail(cls.id)}>{cls.name}</Link>
              ) : (
                <Typography.Text type="secondary">{t.students.noClass}</Typography.Text>
              ),
          },
        ]),
    {
      title: t.common.points,
      dataIndex: 'points',
      key: 'points',
      sorter: true,
      align: 'right',
      render: formatNumber,
    },
    {
      title: t.common.rank,
      dataIndex: 'rank',
      align: 'center',
      render: (r: number | null) => r ?? t.common.none,
    },
    { title: t.common.status, dataIndex: 'status', render: (s: UserStatus) => <StatusTag status={s} /> },
    {
      title: t.common.lastLogin,
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      sorter: true,
      render: (v: string | null) => (v ? formatDateTime(v) : t.common.never),
    },
    {
      title: t.common.createdAt,
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      render: formatDateTime,
    },
    ...(renderActions
      ? [
          {
            title: t.common.actions,
            key: 'actions',
            fixed: 'right' as const,
            render: (_: unknown, s: StudentSummary) => renderActions(s),
          },
        ]
      : []),
  ];
  return <DataTable<StudentSummary> columns={columns} {...rest} />;
}
