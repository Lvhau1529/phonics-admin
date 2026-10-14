import { Badge, Flex, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AssignmentActions } from '@/features/assignments/components/AssignmentActions';
import { AssignmentStatusTag } from '@/features/assignments/components/AssignmentStatusTag';
import type { AssignmentModel } from '@/features/assignments/models/AssignmentModel';
import type { Paginated } from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { formatDate } from '@/shared/utils/format';

interface AssignmentsTableProps {
  data: Paginated<AssignmentModel> | undefined;
  loading: boolean;
  page: number;
  pageSize: number;
  sort: string | undefined;
  onPageChange: (page: number, pageSize: number) => void;
  onSortChange: (sort: string | undefined) => void;
  /** Ẩn cột lớp khi đã ở trong trang lớp */
  hideClass?: boolean;
}

const buildColumns = (hideClass: boolean): ColumnsType<AssignmentModel> => [
  {
    title: t.assignments.scheduledFor,
    dataIndex: 'scheduledFor',
    key: 'scheduledFor',
    sorter: true,
    width: 120,
    render: (d: string) => formatDate(d),
  },
  {
    title: t.assignments.worksheet,
    key: 'worksheetTitle',
    render: (_, a) => (
      <Flex vertical>
        <Link to={ROUTES.assignmentDetail(a.id)}>
          <Typography.Text strong>{a.worksheetTitle}</Typography.Text>
        </Link>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t.subject[a.subject]} · {t.worksheetKind[a.kind]}
          {a.topic ? ` · ${a.topic}` : ''}
        </Typography.Text>
      </Flex>
    ),
  },
  ...(hideClass
    ? []
    : [
        {
          title: t.common.class,
          dataIndex: 'className',
          render: (name: string, a: AssignmentModel) => (
            <Link to={ROUTES.classDetail(a.classId)}>{name}</Link>
          ),
        },
      ]),
  { title: t.assignments.availableFrom, key: 'window', render: (_, a) => a.windowText },
  {
    title: t.common.status,
    dataIndex: 'status',
    key: 'status',
    sorter: true,
    width: 110,
    render: (_, a) => <AssignmentStatusTag status={a.status} />,
  },
  {
    title: t.assignments.submitted,
    key: 'submitted',
    align: 'right',
    render: (_, a) => (
      <Flex gap={6} justify="flex-end" align="center">
        {a.submittedRatioText}
        {a.pendingGrading > 0 && <Badge count={a.pendingGrading} title={t.assignments.pendingGrading} />}
      </Flex>
    ),
  },
  { title: t.assignments.avgPercent, key: 'avg', align: 'right', render: (_, a) => a.avgPercentText },
  {
    title: t.assignments.assignedBy,
    dataIndex: 'assignedByName',
    render: (name: string, a) => (
      <>
        {name}
        {a.hasManualItems && <Tag style={{ marginLeft: 6 }}>{t.assignments.hasManual}</Tag>}
      </>
    ),
  },
  {
    title: t.common.actions,
    key: 'actions',
    width: 100,
    fixed: 'right',
    render: (_, a) => <AssignmentActions assignment={a} />,
  },
];

export function AssignmentsTable({ hideClass = false, ...rest }: AssignmentsTableProps) {
  return <DataTable<AssignmentModel> columns={buildColumns(hideClass)} {...rest} />;
}
