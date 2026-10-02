import { EditOutlined, InboxOutlined, PlusOutlined, RollbackOutlined, TeamOutlined } from '@ant-design/icons';
import { App, Button, Flex, Input, Popconfirm, Segmented, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAuth } from '@/features/auth/hooks';
import { AssignTeachersModal } from '@/features/classes/components/AssignTeachersModal';
import { ClassFormDrawer } from '@/features/classes/components/ClassFormDrawer';
import { useClassesList, useUpdateClass } from '@/features/classes/hooks';
import type { ClassModel } from '@/features/classes/models/ClassModel';
import { errorMessage } from '@/shared/api/errors';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { formatDateTime, formatNumber } from '@/shared/utils/format';

export function ClassesPage() {
  const { message } = App.useApp();
  const auth = useAuth();
  const table = useTableQuery({
    filterKeys: ['grade', 'schoolYear', 'archived'] as const,
    defaultSort: 'name:asc',
  });
  const list = useClassesList(table.params);
  const update = useUpdateClass();
  const [drawer, setDrawer] = useState<{ open: boolean; cls?: ClassModel }>({ open: false });
  const [assignFor, setAssignFor] = useState<ClassModel>();
  const showArchived = table.filters.archived === 'true';

  const setArchived = async (cls: ClassModel, archived: boolean) => {
    try {
      await update.mutateAsync({ id: cls.id, body: { archived } });
      message.success(t.common.updated);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const columns: ColumnsType<ClassModel> = [
    {
      title: t.classes.name,
      key: 'name',
      sorter: true,
      render: (_, cls) => (
        <Link to={ROUTES.classDetail(cls.id)}>
          <Typography.Text strong>{cls.name}</Typography.Text>
        </Link>
      ),
    },
    { title: t.classes.grade, dataIndex: 'grade', key: 'grade', sorter: true },
    { title: t.classes.schoolYear, dataIndex: 'schoolYear', key: 'schoolYear', sorter: true },
    {
      title: t.classes.studentCount,
      dataIndex: 'studentCount',
      key: 'studentCount',
      sorter: true,
      align: 'right',
      render: formatNumber,
    },
    {
      title: t.classes.teachers,
      dataIndex: 'teachers',
      render: (teachers: ClassModel['teachers']) =>
        teachers.length === 0 ? (
          <Typography.Text type="secondary">{t.common.none}</Typography.Text>
        ) : (
          <Flex gap={4} wrap>
            {teachers.map((tc) => (
              <Tag key={tc.id}>{tc.displayName}</Tag>
            ))}
          </Flex>
        ),
    },
    {
      title: t.common.status,
      dataIndex: 'archivedAt',
      render: (_, cls) => (
        <Space size={4}>
          <Tag color={cls.isArchived ? 'default' : 'success'}>
            {cls.isArchived ? t.classes.archived : t.classes.active}
          </Tag>
          {cls.isJoinable && <Tag color="blue">{t.classes.joinVisible}</Tag>}
        </Space>
      ),
    },
    {
      title: t.common.createdAt,
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      render: formatDateTime,
    },
    ...(auth.isAdmin
      ? [
          {
            title: t.common.actions,
            key: 'actions',
            fixed: 'right' as const,
            render: (_: unknown, cls: ClassModel) => (
              <Space size={0}>
                <Tooltip title={t.common.edit}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => setDrawer({ open: true, cls })}
                  />
                </Tooltip>
                <Tooltip title={t.classes.assignTeachers}>
                  <Button type="text" icon={<TeamOutlined />} onClick={() => setAssignFor(cls)} />
                </Tooltip>
                {cls.archivedAt ? (
                  <Popconfirm
                    title={t.classes.confirmUnarchive(cls.name)}
                    onConfirm={() => setArchived(cls, false)}
                    okText={t.common.confirm}
                    cancelText={t.common.cancel}
                  >
                    <Tooltip title={t.classes.unarchive}>
                      <Button type="text" icon={<RollbackOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                ) : (
                  <Popconfirm
                    title={t.classes.confirmArchive(cls.name)}
                    onConfirm={() => setArchived(cls, true)}
                    okText={t.common.confirm}
                    cancelText={t.common.cancel}
                  >
                    <Tooltip title={t.classes.archive}>
                      <Button type="text" danger icon={<InboxOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title={t.classes.title}
        extra={
          auth.isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawer({ open: true })}>
              {t.classes.add}
            </Button>
          )
        }
      >
        <Flex gap={8} wrap>
          <Input.Search
            allowClear
            placeholder={t.common.search}
            defaultValue={table.q}
            onSearch={(v) => table.setQ(v)}
            style={{ width: 220 }}
          />
          <Input
            allowClear
            placeholder={t.classes.grade}
            defaultValue={table.filters.grade}
            onBlur={(e) => table.setFilter('grade', e.target.value || undefined)}
            onPressEnter={(e) => table.setFilter('grade', e.currentTarget.value || undefined)}
            style={{ width: 120 }}
          />
          <Input
            allowClear
            placeholder={t.classes.schoolYear}
            defaultValue={table.filters.schoolYear}
            onBlur={(e) => table.setFilter('schoolYear', e.target.value || undefined)}
            onPressEnter={(e) => table.setFilter('schoolYear', e.currentTarget.value || undefined)}
            style={{ width: 130 }}
          />
          <Segmented<'active' | 'archived'>
            value={showArchived ? 'archived' : 'active'}
            onChange={(v) => table.setFilter('archived', v === 'archived' ? 'true' : undefined)}
            options={[
              { value: 'active', label: t.classes.active },
              { value: 'archived', label: t.classes.showArchived },
            ]}
          />
        </Flex>
      </PageHeader>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <DataTable<ClassModel>
        columns={columns}
        data={list.data}
        loading={list.isFetching}
        page={table.page}
        pageSize={table.pageSize}
        sort={table.sort}
        onPageChange={table.setPage}
        onSortChange={table.setSort}
      />
      <ClassFormDrawer open={drawer.open} cls={drawer.cls} onClose={() => setDrawer({ open: false })} />
      <AssignTeachersModal
        key={assignFor?.id ?? 'none'}
        cls={assignFor}
        onClose={() => setAssignFor(undefined)}
      />
    </>
  );
}

export default ClassesPage;
