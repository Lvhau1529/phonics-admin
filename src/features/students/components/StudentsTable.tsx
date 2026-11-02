import { Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UserStatus } from '@phonics/contracts';
import type { StudentModel } from '@/features/students/models/StudentModel';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { t } from '@/shared/i18n';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { DataTable, type DataTableProps } from '@/shared/ui/DataTable';
import { StatusTag } from '@/shared/ui/RoleTag';
import { formatDateTime, formatNumber } from '@/shared/utils/format';

interface StudentsTableProps extends Omit<DataTableProps<StudentModel>, 'columns'> {
  /** Ẩn cột lớp (bảng trong trang lớp) */
  hideClass?: boolean;
  /** Cột thao tác (nút theo quyền của trang) */
  renderActions?: (student: StudentModel) => ReactNode;
}

/** Bảng học sinh dùng chung cho trang Học sinh và tab Học sinh của lớp */
export function StudentsTable({ hideClass, renderActions, ...rest }: StudentsTableProps) {
  const columns: ColumnsType<StudentModel> = [
    {
      title: t.students.vietnameseName,
      // Sắp theo tên (từ cuối) rồi họ tên — server
      key: 'vietnameseName',
      sorter: true,
      render: (_, s) => (
        <Space>
          <AvatarImg avatarKey={s.avatarKey} name={s.displayName} size="small" />
          <Link to={ROUTES.studentDetail(s.id)}>
            <Typography.Text strong>{s.vietnameseName}</Typography.Text>
          </Link>
        </Space>
      ),
    },
    {
      title: t.students.englishName,
      dataIndex: 'englishName',
      render: (name: string | null) =>
        name ?? <Typography.Text type="secondary">{t.common.none}</Typography.Text>,
    },
    {
      title: t.common.email,
      dataIndex: 'email',
      key: 'email',
      sorter: true,
      render: (_: unknown, s: StudentModel) =>
        s.email ?? <Typography.Text type="secondary">{t.common.none}</Typography.Text>,
    },
    {
      title: t.students.loginMode,
      dataIndex: 'loginMode',
      render: (_: unknown, s: StudentModel) => (
        <Tag color={s.isManaged ? 'gold' : undefined}>{s.loginModeLabel}</Tag>
      ),
    },
    ...(hideClass
      ? []
      : [
          {
            title: t.common.class,
            dataIndex: 'class',
            render: (cls: StudentModel['class']) =>
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
      render: (_: unknown, s: StudentModel) => s.lastLoginText,
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
            render: (_: unknown, s: StudentModel) => renderActions(s),
          },
        ]
      : []),
  ];
  return <DataTable<StudentModel> columns={columns} {...rest} />;
}
