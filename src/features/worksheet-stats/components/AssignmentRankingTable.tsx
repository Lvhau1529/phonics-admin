import { Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { AssignmentRankingEntry } from '@phonics/contracts';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { t } from '@/shared/i18n';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { DataTable } from '@/shared/ui/DataTable';
import { formatDateTime, formatDuration, formatPercent } from '@/shared/utils/format';

interface AssignmentRankingTableProps {
  assignmentId: string;
  items: AssignmentRankingEntry[] | undefined;
  loading: boolean;
}

const RANK_COLORS: Record<number, string> = { 1: 'gold', 2: 'default', 3: 'volcano' };

const buildColumns = (assignmentId: string): ColumnsType<AssignmentRankingEntry> => [
  {
    title: t.common.rank,
    dataIndex: 'rank',
    width: 80,
    align: 'center',
    render: (rank: number) => <Tag color={RANK_COLORS[rank] ?? 'default'}>{rank}</Tag>,
  },
  {
    title: t.common.student,
    dataIndex: 'displayName',
    render: (name: string, e) => (
      <Space>
        <AvatarImg avatarKey={e.avatarKey} name={name} size="small" />
        <Link to={ROUTES.studentDetail(e.studentId)}>{name}</Link>
      </Space>
    ),
  },
  {
    title: t.grading.score,
    key: 'score',
    align: 'right',
    render: (_, e) => (
      <Link to={ROUTES.grading(assignmentId, e.submissionId)}>
        {e.totalScore}/{e.maxScore} ({formatPercent(e.percent)})
      </Link>
    ),
  },
  { title: t.grading.duration, dataIndex: 'durationMs', align: 'right', render: formatDuration },
  { title: t.grading.attempt, dataIndex: 'attemptNo', align: 'center', width: 70 },
  { title: t.grading.submittedAt, dataIndex: 'submittedAt', render: formatDateTime },
];

/** Xếp hạng theo bài giao (best attempt GRADED, RANK() 1,1,3) */
export function AssignmentRankingTable({ assignmentId, items, loading }: AssignmentRankingTableProps) {
  return (
    <DataTable.Static<AssignmentRankingEntry>
      size="small"
      rowKey="studentId"
      columns={buildColumns(assignmentId)}
      dataSource={items}
      loading={loading}
      pagination={false}
      locale={{ emptyText: t.assignments.rankingEmpty }}
    />
  );
}
