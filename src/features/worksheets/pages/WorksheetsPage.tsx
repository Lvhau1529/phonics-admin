import { CopyOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Flex, Input, Segmented, Select, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ContentStatus, Subject } from '@phonics/contracts';
import { Link, useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { WorksheetStatusTag } from '@/features/worksheets/components/WorksheetStatusTag';
import { WorksheetsService } from '@/features/worksheets/api/worksheetsService';
import type { WorksheetSummaryModel } from '@/features/worksheets/models/WorksheetModel';
import { errorMessage } from '@/shared/api/errors';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { formatDateTime } from '@/shared/utils/format';

export function WorksheetsPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const table = useTableQuery({
    filterKeys: ['status', 'subject', 'mine'] as const,
    defaultSort: 'updatedAt:desc',
  });
  const list = WorksheetsService.useList({
    ...table.params,
    mine: table.filters.mine === '1' ? true : undefined,
  });
  const duplicate = WorksheetsService.useDuplicate();

  const columns: ColumnsType<WorksheetSummaryModel> = [
    {
      title: t.worksheets.name,
      key: 'title',
      sorter: true,
      render: (_, w) => (
        <Flex vertical>
          <Link to={ROUTES.worksheetDetail(w.id)}>
            <Typography.Text strong>{w.title}</Typography.Text>
          </Link>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {w.subtitle}
          </Typography.Text>
        </Flex>
      ),
    },
    { title: t.worksheets.subject, dataIndex: 'subject', render: (s: Subject) => t.subject[s] },
    { title: t.worksheets.grade, dataIndex: 'grade', render: (g: string | null) => g ?? t.common.none },
    { title: t.worksheets.week, key: 'week', sorter: true, render: (_, w) => w.scheduleText },
    {
      title: t.questions.title,
      dataIndex: 'itemCount',
      align: 'right',
      render: (n: number) => t.worksheets.items(n),
    },
    { title: t.worksheets.totalPoints, dataIndex: 'maxScore', align: 'right' },
    { title: t.assignments.title, dataIndex: 'assignmentCount', align: 'right' },
    {
      title: t.common.status,
      key: 'status',
      sorter: true,
      render: (_, w) => (
        <Flex gap={4}>
          <WorksheetStatusTag status={w.status} />
          {w.visibility === 'SHARED' && <Tag>{t.visibility.SHARED}</Tag>}
        </Flex>
      ),
    },
    { title: t.questions.owner, dataIndex: 'createdByName' },
    {
      title: t.common.updatedAt,
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: true,
      render: formatDateTime,
    },
    {
      title: t.common.actions,
      key: 'actions',
      fixed: 'right',
      render: (_, w) => (
        <Space size={0}>
          <Tooltip title={t.common.edit}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(ROUTES.worksheetDetail(w.id))}
            />
          </Tooltip>
          <Tooltip title={t.worksheets.duplicate}>
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={async () => {
                try {
                  const copy = await duplicate.mutateAsync(w.id);
                  message.success(t.worksheets.duplicated);
                  navigate(ROUTES.worksheetDetail(copy.id));
                } catch (error) {
                  message.error(errorMessage(error));
                }
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.worksheets.title}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(ROUTES.worksheetNew)}>
            {t.worksheets.add}
          </Button>
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
          <Select<ContentStatus>
            allowClear
            placeholder={t.common.status}
            value={table.filters.status as ContentStatus | undefined}
            onChange={(v) => table.setFilter('status', v)}
            options={(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((s) => ({
              value: s,
              label: t.contentStatus[s],
            }))}
            style={{ width: 150 }}
          />
          <Select<Subject>
            allowClear
            placeholder={t.worksheets.subject}
            value={table.filters.subject as Subject | undefined}
            onChange={(v) => table.setFilter('subject', v)}
            options={(['PHONICS', 'ESL'] as const).map((s) => ({ value: s, label: t.subject[s] }))}
            style={{ width: 130 }}
          />
          <Segmented<'all' | 'mine'>
            value={table.filters.mine === '1' ? 'mine' : 'all'}
            onChange={(v) => table.setFilter('mine', v === 'mine' ? '1' : undefined)}
            options={[
              { value: 'all', label: t.questions.all },
              { value: 'mine', label: t.worksheets.mine },
            ]}
          />
        </Flex>
      </PageHeader>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <DataTable<WorksheetSummaryModel>
        columns={columns}
        data={list.data}
        loading={list.isFetching}
        page={table.page}
        pageSize={table.pageSize}
        sort={table.sort}
        onPageChange={table.setPage}
        onSortChange={table.setSort}
      />
    </>
  );
}

export default WorksheetsPage;
