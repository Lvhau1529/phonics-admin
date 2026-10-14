import { Badge, Flex, Segmented, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { AssignmentRosterRow, RosterStatus } from '@phonics/contracts';
import { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { t } from '@/shared/i18n';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { DataTable } from '@/shared/ui/DataTable';
import { formatDateTime, formatPercent } from '@/shared/utils/format';

interface SubmissionsTableProps {
  assignmentId: string;
  items: AssignmentRosterRow[] | undefined;
  loading: boolean;
}

type Filter = 'all' | 'pending' | 'late' | 'missing';

const STATUS_COLOR: Record<RosterStatus, string> = {
  MISSING: 'default',
  IN_PROGRESS: 'warning',
  SUBMITTED: 'processing',
  GRADED: 'success',
};

const buildColumns = (assignmentId: string): ColumnsType<AssignmentRosterRow> => [
  {
    title: t.common.student,
    dataIndex: 'displayName',
    render: (name: string, r) => (
      <Space>
        <AvatarImg avatarKey={r.avatarKey} name={name} size="small" />
        <Link to={ROUTES.studentDetail(r.studentId)}>{name}</Link>
      </Space>
    ),
  },
  {
    title: t.common.status,
    dataIndex: 'status',
    width: 140,
    render: (s: RosterStatus, r) => (
      <Flex gap={4} align="center">
        <Tag color={STATUS_COLOR[s]}>{t.rosterStatus[s]}</Tag>
        {r.late && <Tag color="warning">{t.assignments.late}</Tag>}
        {r.pendingManual > 0 && (
          <Badge count={r.pendingManual} title={t.grading.pendingManual(r.pendingManual)} />
        )}
      </Flex>
    ),
  },
  {
    title: t.grading.attempt,
    dataIndex: 'attempts',
    align: 'center',
    width: 80,
  },
  {
    title: t.grading.score,
    key: 'score',
    align: 'right',
    render: (_, r) =>
      r.totalScore === null ? (
        t.common.none
      ) : (
        <>
          {r.totalScore}
          {r.percent !== null ? ` (${formatPercent(r.percent)})` : ''}
        </>
      ),
  },
  {
    title: t.common.rank,
    dataIndex: 'rank',
    align: 'center',
    width: 80,
    render: (v: number | null) => v ?? t.common.none,
  },
  {
    title: t.grading.submittedAt,
    dataIndex: 'submittedAt',
    render: (v: string | null) => (v ? formatDateTime(v) : t.common.none),
  },
  {
    title: t.common.actions,
    key: 'actions',
    width: 120,
    render: (_, r) => {
      const sid = r.latestSubmissionId ?? r.bestSubmissionId;
      return sid ? <Link to={ROUTES.grading(assignmentId, sid)}>{t.grading.title}</Link> : null;
    },
  },
];

/** Roster: mọi học sinh trong lớp kể cả chưa làm; lọc nhanh chờ chấm / nộp muộn / chưa làm */
export function SubmissionsTable({ assignmentId, items, loading }: SubmissionsTableProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const rows = (items ?? []).filter((r) => {
    if (filter === 'pending') return r.status === 'SUBMITTED' || r.pendingManual > 0;
    if (filter === 'late') return r.late;
    if (filter === 'missing') return r.status === 'MISSING';
    return true;
  });
  return (
    <>
      <Segmented<Filter>
        value={filter}
        onChange={setFilter}
        style={{ marginBottom: 12 }}
        options={[
          { value: 'all', label: t.assignments.filterAll },
          { value: 'pending', label: t.assignments.filterPending },
          { value: 'late', label: t.assignments.filterLate },
          { value: 'missing', label: t.assignments.missing },
        ]}
      />
      <DataTable.Static<AssignmentRosterRow>
        size="small"
        rowKey="studentId"
        columns={buildColumns(assignmentId)}
        dataSource={items ? rows : undefined}
        loading={loading}
        pagination={false}
      />
    </>
  );
}
