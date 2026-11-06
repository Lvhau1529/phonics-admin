import { Flex, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import type { GuardianChildModel } from '@/features/guardians/models/GuardianModel';
import { t } from '@/shared/i18n';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { StatusTag } from '@/shared/ui/RoleTag';

/** Các con của một phụ huynh: lớp, quan hệ, cờ liên kết, cách đăng nhập, trạng thái */
export function GuardianChildrenTable({ items }: { items: GuardianChildModel[] }) {
  const columns: ColumnsType<GuardianChildModel> = [
    {
      title: t.common.student,
      key: 'name',
      render: (_, c) => (
        <Space>
          <AvatarImg avatarKey={c.avatarKey} name={c.displayName} size="small" />
          <Link to={ROUTES.studentDetail(c.studentId)}>{c.fullName}</Link>
        </Space>
      ),
    },
    {
      title: t.common.class,
      key: 'class',
      render: (_, c) =>
        c.class?.name ?? <Typography.Text type="secondary">{t.students.noClass}</Typography.Text>,
    },
    { title: t.guardians.relation, key: 'relation', render: (_, c) => t.guardianRelation[c.relation] },
    {
      title: t.guardians.flags,
      key: 'flags',
      render: (_, c) => (
        <Flex gap={4} wrap>
          {c.flagLabels.map((label) => (
            <Tag key={label}>{label}</Tag>
          ))}
        </Flex>
      ),
    },
    { title: t.common.status, key: 'status', render: (_, c) => <StatusTag status={c.status} /> },
  ];
  return (
    <Table<GuardianChildModel>
      size="small"
      scroll={{ x: 'max-content' }}
      rowKey="studentId"
      pagination={false}
      columns={columns}
      dataSource={items}
      locale={{ emptyText: t.guardians.noChildren }}
    />
  );
}
