import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  ReadOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Flex, Input, Popconfirm, Select, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UserStatus } from '@phonics/contracts';
import { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import {
  DeleteAccountModal,
  type DeleteTarget,
} from '@/features/account-delete/components/DeleteAccountModal';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { TeacherClassesModal } from '@/features/teachers/components/TeacherClassesModal';
import { TeacherFormDrawer } from '@/features/teachers/components/TeacherFormDrawer';
import { TeachersService } from '@/features/teachers/api/teachersService';
import type { TeacherModel } from '@/features/teachers/models/TeacherModel';
import { errorMessage } from '@/shared/api/errors';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { StatusTag } from '@/shared/ui/RoleTag';
import { formatDateTime } from '@/shared/utils/format';

/** Lọc theo trạng thái: thêm chờ duyệt / từ chối (yêu cầu tài khoản qua Google) */
const TEACHER_STATUSES = [
  'ACTIVE',
  'DISABLED',
  'PENDING',
  'REJECTED',
] as const satisfies readonly UserStatus[];

export function TeachersPage() {
  const { message } = App.useApp();
  const table = useTableQuery({ filterKeys: ['status', 'classId'] as const, defaultSort: 'createdAt:desc' });
  const list = TeachersService.useList(table.params);
  const update = TeachersService.useUpdate();
  const [drawer, setDrawer] = useState<{ open: boolean; teacher?: TeacherModel }>({ open: false });
  const [classesFor, setClassesFor] = useState<TeacherModel>();
  const [deleting, setDeleting] = useState<DeleteTarget>();
  const pendingCount = TeachersService.usePendingCount().data ?? 0;

  const setStatus = async (teacher: TeacherModel, status: UserStatus, done = t.common.updated) => {
    try {
      await update.mutateAsync({ id: teacher.id, body: { status } });
      message.success(done);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const columns: ColumnsType<TeacherModel> = [
    {
      title: t.common.name,
      key: 'displayName',
      sorter: true,
      render: (_, tc) => (
        <Space>
          <AvatarImg avatarKey={tc.avatarKey} name={tc.displayName} size="small" />
          <span>{tc.displayName}</span>
        </Space>
      ),
    },
    { title: t.common.email, dataIndex: 'email', key: 'email', sorter: true },
    {
      title: t.common.password,
      dataIndex: 'hasPassword',
      render: (_, tc) => tc.passwordText,
    },
    {
      title: t.teachers.classesCol,
      dataIndex: 'classes',
      render: (classes: TeacherModel['classes']) =>
        classes.length === 0 ? (
          <Typography.Text type="secondary">{t.teachers.noClasses}</Typography.Text>
        ) : (
          <Flex gap={4} wrap>
            {classes.map((c) => (
              <Link key={c.id} to={ROUTES.classDetail(c.id)}>
                <Tag>{c.name}</Tag>
              </Link>
            ))}
          </Flex>
        ),
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
    {
      title: t.common.actions,
      key: 'actions',
      fixed: 'right',
      render: (_, tc) => (
        <Space size={0}>
          <Tooltip title={t.common.edit}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => setDrawer({ open: true, teacher: tc })}
            />
          </Tooltip>
          <Tooltip title={t.teachers.setClasses}>
            <Button type="text" icon={<ReadOutlined />} onClick={() => setClassesFor(tc)} />
          </Tooltip>
          {tc.isPending ? (
            <>
              <Popconfirm
                title={t.teachers.confirmApprove(tc.displayName)}
                onConfirm={() => setStatus(tc, 'ACTIVE', t.teachers.approved)}
                okText={t.common.confirm}
                cancelText={t.common.cancel}
              >
                <Tooltip title={t.teachers.approve}>
                  <Button type="text" icon={<CheckOutlined />} />
                </Tooltip>
              </Popconfirm>
              <Popconfirm
                title={t.teachers.confirmReject(tc.displayName)}
                onConfirm={() => setStatus(tc, 'REJECTED', t.teachers.rejected)}
                okText={t.common.confirm}
                cancelText={t.common.cancel}
              >
                <Tooltip title={t.teachers.reject}>
                  <Button type="text" danger icon={<CloseOutlined />} />
                </Tooltip>
              </Popconfirm>
            </>
          ) : (
            <Popconfirm
              title={
                tc.isActive
                  ? t.teachers.confirmDisable(tc.displayName)
                  : t.teachers.confirmEnable(tc.displayName)
              }
              onConfirm={() => setStatus(tc, tc.isActive ? 'DISABLED' : 'ACTIVE')}
              okText={t.common.confirm}
              cancelText={t.common.cancel}
            >
              <Tooltip title={tc.isActive ? t.teachers.disable : t.teachers.enable}>
                <Button
                  type="text"
                  danger={tc.isActive}
                  icon={tc.isActive ? <LockOutlined /> : <UnlockOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
          <Tooltip title={t.accountDelete.action}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => setDeleting({ kind: 'teacher', id: tc.id, name: tc.displayName })}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.teachers.title}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawer({ open: true })}>
            {t.teachers.add}
          </Button>
        }
      >
        <Flex gap={8} wrap>
          <Input.Search
            allowClear
            placeholder={t.common.searchPlaceholder}
            defaultValue={table.q}
            onSearch={(v) => table.setQ(v)}
            style={{ width: 260 }}
          />
          <Select
            allowClear
            placeholder={t.teachers.filterStatus}
            value={table.filters.status as UserStatus | undefined}
            onChange={(v) => table.setFilter('status', v)}
            options={TEACHER_STATUSES.map((s) => ({ value: s, label: t.userStatus[s] }))}
            style={{ width: 150 }}
          />
          <ClassSelect
            placeholder={t.teachers.filterClass}
            value={table.filters.classId}
            onChange={(v) => table.setFilter('classId', v)}
          />
        </Flex>
      </PageHeader>
      {pendingCount > 0 && table.filters.status !== 'PENDING' && (
        <Alert
          type="info"
          showIcon
          message={t.teachers.pendingRequests(pendingCount)}
          action={
            <Button size="small" onClick={() => table.setFilter('status', 'PENDING')}>
              {t.teachers.showPending}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <DataTable<TeacherModel>
        columns={columns}
        data={list.data}
        loading={list.isFetching}
        page={table.page}
        pageSize={table.pageSize}
        sort={table.sort}
        onPageChange={table.setPage}
        onSortChange={table.setSort}
      />
      <TeacherFormDrawer
        open={drawer.open}
        teacher={drawer.teacher}
        onClose={() => setDrawer({ open: false })}
      />
      <TeacherClassesModal
        key={classesFor?.id ?? 'none'}
        teacher={classesFor}
        onClose={() => setClassesFor(undefined)}
      />
      <DeleteAccountModal target={deleting} onClose={() => setDeleting(undefined)} />
    </>
  );
}

export default TeachersPage;
