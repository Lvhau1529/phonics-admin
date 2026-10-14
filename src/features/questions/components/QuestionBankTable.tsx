import { Avatar, Flex, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Paginated } from '@phonics/contracts';
import type { ReactNode } from 'react';
import { QuestionTypeTag } from '@/features/questions/components/QuestionTypeTag';
import type { QuestionSummaryModel } from '@/features/questions/models/QuestionModel';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { formatDateTime } from '@/shared/utils/format';

interface QuestionBankTableProps {
  data: Paginated<QuestionSummaryModel> | undefined;
  loading: boolean;
  page: number;
  pageSize: number;
  sort?: string;
  onPageChange: (page: number, pageSize: number) => void;
  onSortChange?: (sort: string | undefined) => void;
  /** Render tiêu đề (link mở editor / chỉ chữ) */
  renderTitle?: (q: QuestionSummaryModel) => ReactNode;
  /** Chọn nhiều (drawer ghép phiếu) */
  rowSelection?: {
    selectedIds: string[];
    onChange: (ids: string[], rows: QuestionSummaryModel[]) => void;
    disabledIds?: Set<string>;
  };
  actions?: (q: QuestionSummaryModel) => ReactNode;
}

/** Bảng ngân hàng câu hỏi (dùng ở trang bank và drawer chọn câu) */
export function QuestionBankTable({
  data,
  loading,
  page,
  pageSize,
  sort,
  onPageChange,
  onSortChange,
  renderTitle,
  rowSelection,
  actions,
}: QuestionBankTableProps) {
  const columns: ColumnsType<QuestionSummaryModel> = [
    {
      title: t.questions.instruction,
      key: 'instruction',
      render: (_, q) => (
        <Flex gap={8} align="center">
          <Avatar shape="square" size={40} src={q.thumbnailUrl} style={{ flexShrink: 0 }}>
            {q.typeLabel.charAt(0)}
          </Avatar>
          <Flex vertical>
            {renderTitle ? renderTitle(q) : <Typography.Text strong>{q.instruction}</Typography.Text>}
            {q.instructionVi && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {q.instructionVi}
              </Typography.Text>
            )}
          </Flex>
        </Flex>
      ),
    },
    {
      title: t.questions.type,
      key: 'type',
      sorter: true,
      render: (_, q) => <QuestionTypeTag type={q.type} />,
    },
    {
      title: t.questions.points,
      dataIndex: 'points',
      key: 'points',
      sorter: true,
      align: 'right',
      width: 80,
    },
    {
      title: t.common.status,
      key: 'status',
      sorter: true,
      render: (_, q) => (
        <Flex gap={4} wrap>
          <Tag color={q.statusColor}>{t.contentStatus[q.status]}</Tag>
          {q.visibility === 'SHARED' && <Tag>{t.visibility.SHARED}</Tag>}
        </Flex>
      ),
    },
    {
      title: t.questions.tags,
      dataIndex: 'tags',
      render: (tags: string[]) => (
        <Flex gap={4} wrap>
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Flex>
      ),
    },
    { title: t.questions.owner, dataIndex: 'createdByName' },
    {
      title: t.worksheets.title,
      dataIndex: 'usedInWorksheets',
      align: 'right',
      render: (n: number) => t.questions.usedIn(n),
    },
    {
      title: t.common.updatedAt,
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: true,
      render: formatDateTime,
    },
    ...(actions
      ? [
          {
            title: t.common.actions,
            key: 'actions',
            fixed: 'right' as const,
            render: (_: unknown, q: QuestionSummaryModel) => actions(q),
          },
        ]
      : []),
  ];
  return (
    <DataTable<QuestionSummaryModel>
      columns={columns}
      data={data}
      loading={loading}
      page={page}
      pageSize={pageSize}
      sort={sort}
      onPageChange={onPageChange}
      onSortChange={onSortChange}
      rowSelection={
        rowSelection
          ? {
              selectedRowKeys: rowSelection.selectedIds,
              preserveSelectedRowKeys: true,
              onChange: (keys, rows) => rowSelection.onChange(keys.map(String), rows),
              getCheckboxProps: (q) => ({ disabled: rowSelection.disabledIds?.has(q.id) }),
            }
          : undefined
      }
    />
  );
}
