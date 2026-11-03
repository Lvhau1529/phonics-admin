import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Select, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import {
  DeleteAccountModal,
  type DeleteTarget,
} from '@/features/account-delete/components/DeleteAccountModal';
import { useAuth } from '@/features/auth/authStore';
import { GuardiansService } from '@/features/guardians/api/guardiansService';
import { GuardianAccountTag } from '@/features/guardians/components/GuardianAccountTag';
import { GuardianDetailDrawer } from '@/features/guardians/components/GuardianDetailDrawer';
import { GuardianFormDrawer } from '@/features/guardians/components/GuardianFormDrawer';
import type { GuardianModel } from '@/features/guardians/models/GuardianModel';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';

/** Phụ huynh (ADMIN): danh sách, thêm / sửa, xem các con, tạo / chuyển sang tài khoản gia đình */
export function GuardiansPage() {
  const table = useTableQuery({ filterKeys: ['hasAccount'] as const });
  const list = GuardiansService.useList(table.params);
  const [drawer, setDrawer] = useState<{ open: boolean; guardian?: GuardianModel }>({ open: false });
  const [viewingId, setViewingId] = useState<string>();
  const [deleting, setDeleting] = useState<DeleteTarget>();
  const { isAdmin } = useAuth();

  const columns: ColumnsType<GuardianModel> = [
    {
      title: t.guardians.fullName,
      key: 'fullName',
      render: (_, g) => (
        <Typography.Link strong onClick={() => setViewingId(g.id)}>
          {g.fullName}
        </Typography.Link>
      ),
    },
    {
      title: t.common.email,
      dataIndex: 'email',
      render: (v: string | null) => v ?? <Typography.Text type="secondary">{t.common.none}</Typography.Text>,
    },
    {
      title: t.guardians.phone,
      dataIndex: 'phone',
      render: (v: string | null) => v ?? <Typography.Text type="secondary">{t.common.none}</Typography.Text>,
    },
    {
      title: t.guardians.children,
      key: 'children',
      render: (_, g) =>
        g.children.length === 0 ? (
          <Typography.Text type="secondary">{t.guardians.noChildren}</Typography.Text>
        ) : (
          <Flex gap={4} wrap>
            {g.children.map((c) => (
              <Link key={c.studentId} to={ROUTES.studentDetail(c.studentId)}>
                <Tag>{c.fullName}</Tag>
              </Link>
            ))}
          </Flex>
        ),
    },
    { title: t.guardians.account, key: 'account', render: (_, g) => <GuardianAccountTag guardian={g} /> },
    {
      title: t.common.actions,
      key: 'actions',
      fixed: 'right',
      render: (_, g) => (
        <Space size={0}>
          <Tooltip title={t.common.view}>
            <Button type="text" icon={<EyeOutlined />} onClick={() => setViewingId(g.id)} />
          </Tooltip>
          <Tooltip title={t.common.edit}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => setDrawer({ open: true, guardian: g })}
            />
          </Tooltip>
          {isAdmin && (
            <Tooltip title={t.accountDelete.action}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => setDeleting({ kind: 'guardian', id: g.id, name: g.fullName })}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.guardians.title}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawer({ open: true })}>
            {t.guardians.add}
          </Button>
        }
      >
        <Flex gap={8} wrap>
          <Input.Search
            allowClear
            placeholder={t.guardians.searchGuardians}
            defaultValue={table.q}
            onSearch={(v) => table.setQ(v)}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            placeholder={t.guardians.filterAccount}
            value={table.filters.hasAccount}
            onChange={(v) => table.setFilter('hasAccount', v)}
            options={[
              { value: 'true', label: t.guardians.hasAccount },
              { value: 'false', label: t.guardians.noAccount },
            ]}
            style={{ width: 180 }}
          />
        </Flex>
      </PageHeader>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <DataTable<GuardianModel>
        columns={columns}
        data={list.data}
        loading={list.isFetching}
        page={table.page}
        pageSize={table.pageSize}
        sort={table.sort}
        onPageChange={table.setPage}
        onSortChange={table.setSort}
      />
      <GuardianFormDrawer
        open={drawer.open}
        guardian={drawer.guardian}
        onClose={() => setDrawer({ open: false })}
      />
      <GuardianDetailDrawer guardianId={viewingId} onClose={() => setViewingId(undefined)} />
      <DeleteAccountModal target={deleting} onClose={() => setDeleting(undefined)} />
    </>
  );
}

export default GuardiansPage;
