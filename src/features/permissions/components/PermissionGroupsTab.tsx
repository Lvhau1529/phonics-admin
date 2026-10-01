import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Flex, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Permission, PermissionGroup } from '@phonics/contracts';
import { useState } from 'react';
import { PermissionGroupDrawer } from '@/features/permissions/components/PermissionGroupDrawer';
import { useDeletePermissionGroup, usePermissionGroups } from '@/features/permissions/hooks';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatDateTime } from '@/shared/utils/format';

/** Tab Nhóm quyền: bảng nhóm (tên, mô tả, quyền, thành viên, hệ thống) + tạo / sửa / xoá */
export function PermissionGroupsTab() {
  const { message } = App.useApp();
  const groups = usePermissionGroups();
  const remove = useDeletePermissionGroup();
  const [drawer, setDrawer] = useState<{ open: boolean; group?: PermissionGroup }>({ open: false });

  const handleDelete = async (group: PermissionGroup) => {
    try {
      await remove.mutateAsync(group.id);
      message.success(t.permissions.groupDeleted);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const columns: ColumnsType<PermissionGroup> = [
    {
      title: t.permissions.groupName,
      dataIndex: 'name',
      render: (name: string, g) => (
        <Flex vertical gap={2}>
          <Space size={6}>
            <Typography.Text strong>{name}</Typography.Text>
            {g.isSystem && (
              <Tooltip title={t.permissions.systemGroupHint}>
                <Tag color="gold">{t.permissions.systemGroup}</Tag>
              </Tooltip>
            )}
          </Space>
          {g.description && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {g.description}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: t.permissions.groupPermissions,
      dataIndex: 'permissions',
      render: (codes: Permission[]) =>
        codes.length === 0 ? (
          <Typography.Text type="secondary">{t.permissions.noPermissions}</Typography.Text>
        ) : (
          <Flex gap={4} wrap>
            {codes.map((code) => (
              <Tooltip key={code} title={code}>
                <Tag style={{ marginInlineEnd: 0 }}>{t.permissionLabel[code]}</Tag>
              </Tooltip>
            ))}
          </Flex>
        ),
    },
    {
      title: t.permissions.members,
      dataIndex: 'memberCount',
      align: 'center',
      width: 120,
      render: (n: number) => <Tooltip title={t.permissions.membersCount(n)}>{n}</Tooltip>,
    },
    { title: t.common.updatedAt, dataIndex: 'updatedAt', width: 160, render: formatDateTime },
    {
      title: t.common.actions,
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, g) => (
        <Space size={0}>
          <Tooltip title={t.common.edit}>
            <Button type="text" icon={<EditOutlined />} onClick={() => setDrawer({ open: true, group: g })} />
          </Tooltip>
          {g.isSystem ? (
            <Tooltip title={t.permissions.systemGroupHint}>
              <Button type="text" icon={<DeleteOutlined />} disabled />
            </Tooltip>
          ) : (
            <Popconfirm
              title={t.permissions.confirmDeleteGroup(g.name)}
              onConfirm={() => handleDelete(g)}
              okText={t.common.delete}
              okButtonProps={{ danger: true }}
              cancelText={t.common.cancel}
            >
              <Tooltip title={t.common.delete}>
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Flex vertical gap={12}>
      <Flex justify="space-between" align="center" gap={8} wrap>
        <Typography.Text type="secondary">{t.permissions.groupsHint}</Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawer({ open: true })}>
          {t.permissions.addGroup}
        </Button>
      </Flex>
      <ErrorAlert error={groups.error} onRetry={() => void groups.refetch()} />
      <DataTable.Static<PermissionGroup>
        rowKey="id"
        columns={columns}
        dataSource={groups.data}
        loading={groups.isFetching}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
      <PermissionGroupDrawer
        open={drawer.open}
        group={drawer.group}
        onClose={() => setDrawer({ open: false })}
      />
    </Flex>
  );
}
