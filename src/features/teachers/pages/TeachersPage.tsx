import { EditOutlined, LockOutlined, PlusOutlined, ReadOutlined, UnlockOutlined } from '@ant-design/icons';
import { App, Button, Flex, Input, Popconfirm, Select, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserStatus, type TeacherSummary } from '@phonics/contracts';
import { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { TeacherClassesModal } from '@/features/teachers/components/TeacherClassesModal';
import { TeacherFormDrawer } from '@/features/teachers/components/TeacherFormDrawer';
import { useTeachersList, useUpdateTeacher } from '@/features/teachers/hooks';
import { errorMessage } from '@/shared/api/errors';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n/vi';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { StatusTag } from '@/shared/ui/RoleTag';
import { formatDateTime } from '@/shared/utils/format';

export function TeachersPage() {
  const { message } = App.useApp();
  const table = useTableQuery({ filterKeys: ['status', 'classId'] as const, defaultSort: 'createdAt:desc' });
  const list = useTeachersList(table.params);
  const update = useUpdateTeacher();
  const [drawer, setDrawer] = useState<{ open: boolean; teacher?: TeacherSummary }>({ open: false });
  const [classesFor, setClassesFor] = useState<TeacherSummary>();

  const toggleStatus = async (teacher: TeacherSummary) => {
    const status: UserStatus = teacher.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await update.mutateAsync({ id: teacher.id, body: { status } });
      message.success(t.common.updated);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const columns: ColumnsType<TeacherSummary> = [
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
      render: (has: boolean, tc) =>
        has ? t.teachers.hasPassword : `${t.teachers.noPassword} (${t.provider[tc.provider]})`,
    },
    {
      title: t.teachers.classesCol,
      dataIndex: 'classes',
      render: (classes: TeacherSummary['classes']) =>
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
          <Popconfirm
            title={
              tc.status === 'ACTIVE'
                ? t.teachers.confirmDisable(tc.displayName)
                : t.teachers.confirmEnable(tc.displayName)
            }
            onConfirm={() => toggleStatus(tc)}
            okText={t.common.confirm}
            cancelText={t.common.cancel}
          >
            <Tooltip title={tc.status === 'ACTIVE' ? t.teachers.disable : t.teachers.enable}>
              <Button
                type="text"
                danger={tc.status === 'ACTIVE'}
                icon={tc.status === 'ACTIVE' ? <LockOutlined /> : <UnlockOutlined />}
              />
            </Tooltip>
          </Popconfirm>
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
            options={UserStatus.options.map((s) => ({ value: s, label: t.userStatus[s] }))}
            style={{ width: 150 }}
          />
          <ClassSelect
            placeholder={t.teachers.filterClass}
            value={table.filters.classId}
            onChange={(v) => table.setFilter('classId', v)}
          />
        </Flex>
      </PageHeader>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <DataTable<TeacherSummary>
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
    </>
  );
}

export default TeachersPage;
