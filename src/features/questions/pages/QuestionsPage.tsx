import { CopyOutlined, EditOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Flex, Input, Popconfirm, Segmented, Select, Space, Tooltip, Typography } from 'antd';
import { QUESTION_TYPES, type ContentStatus, type QuestionType } from '@phonics/contracts';
import { Link, useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAuth } from '@/features/auth/authStore';
import { QuestionBankTable } from '@/features/questions/components/QuestionBankTable';
import { QuestionsService } from '@/features/questions/api/questionsService';
import type { QuestionSummaryModel } from '@/features/questions/models/QuestionModel';
import { errorMessage } from '@/shared/api/errors';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';

export function QuestionsPage() {
  const { message } = App.useApp();
  const auth = useAuth();
  const navigate = useNavigate();
  const table = useTableQuery({
    filterKeys: ['type', 'status', 'mine', 'tag'] as const,
    defaultSort: 'updatedAt:desc',
  });
  const list = QuestionsService.useList({
    ...table.params,
    mine: table.filters.mine === '1' ? true : undefined,
  });
  const archive = QuestionsService.useArchive();
  const duplicate = QuestionsService.useDuplicate();

  const handleDuplicate = async (q: QuestionSummaryModel) => {
    try {
      const copy = await duplicate.mutateAsync(q.id);
      message.success(t.questions.duplicated);
      navigate(ROUTES.questionDetail(copy.id));
    } catch (error) {
      message.error(errorMessage(error));
    }
  };
  const handleArchive = async (q: QuestionSummaryModel) => {
    try {
      await archive.mutateAsync(q.id);
      message.success(t.questions.archived);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  return (
    <>
      <PageHeader
        title={t.questions.title}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(ROUTES.questionNew)}>
            {t.questions.add}
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
          <Select<QuestionType>
            allowClear
            placeholder={t.questions.filterType}
            value={table.filters.type as QuestionType | undefined}
            onChange={(v) => table.setFilter('type', v)}
            options={QUESTION_TYPES.map((x) => ({ value: x, label: t.questionType[x] }))}
            style={{ width: 240 }}
          />
          <Select<ContentStatus>
            allowClear
            placeholder={t.questions.filterStatus}
            value={table.filters.status as ContentStatus | undefined}
            onChange={(v) => table.setFilter('status', v)}
            options={(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((s) => ({
              value: s,
              label: t.contentStatus[s],
            }))}
            style={{ width: 150 }}
          />
          <Input
            allowClear
            placeholder={t.questions.filterTag}
            defaultValue={table.filters.tag}
            onBlur={(e) => table.setFilter('tag', e.target.value || undefined)}
            onPressEnter={(e) => table.setFilter('tag', e.currentTarget.value || undefined)}
            style={{ width: 140 }}
          />
          <Segmented<'all' | 'mine'>
            value={table.filters.mine === '1' ? 'mine' : 'all'}
            onChange={(v) => table.setFilter('mine', v === 'mine' ? '1' : undefined)}
            options={[
              { value: 'all', label: t.questions.all },
              { value: 'mine', label: t.questions.mine },
            ]}
          />
        </Flex>
      </PageHeader>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <QuestionBankTable
        data={list.data}
        loading={list.isFetching}
        page={table.page}
        pageSize={table.pageSize}
        sort={table.sort}
        onPageChange={table.setPage}
        onSortChange={table.setSort}
        renderTitle={(q) => (
          <Link to={ROUTES.questionDetail(q.id)}>
            <Typography.Text strong>{q.instruction}</Typography.Text>
          </Link>
        )}
        actions={(q) => {
          const editable = q.canEditBy(auth.user?.id, auth.isAdmin);
          return (
            <Space size={0}>
              <Tooltip title={t.common.edit}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => navigate(ROUTES.questionDetail(q.id))}
                />
              </Tooltip>
              <Tooltip title={t.questions.duplicate}>
                <Button type="text" icon={<CopyOutlined />} onClick={() => handleDuplicate(q)} />
              </Tooltip>
              {editable && !q.isArchived && (
                <Popconfirm
                  title={t.questions.confirmArchive}
                  onConfirm={() => handleArchive(q)}
                  okText={t.common.confirm}
                  cancelText={t.common.cancel}
                >
                  <Tooltip title={t.questions.archive}>
                    <Button type="text" danger icon={<InboxOutlined />} />
                  </Tooltip>
                </Popconfirm>
              )}
            </Space>
          );
        }}
      />
    </>
  );
}

export default QuestionsPage;
