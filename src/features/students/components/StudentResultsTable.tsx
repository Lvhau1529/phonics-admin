import { Flex, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { EndedBy, GameId, GameResultView } from '@phonics/contracts';
import { useStudentGameResults } from '@/features/students/hooks';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { GameSelect } from '@/shared/ui/GameSelect';
import { formatDateTime, formatDuration, formatNumber, gameLabel } from '@/shared/utils/format';

interface StudentResultsTableProps {
  studentId: string;
}

const buildColumns = (): ColumnsType<GameResultView> => [
  {
    title: t.students.results.playedAt,
    dataIndex: 'playedAt',
    key: 'playedAt',
    sorter: true,
    render: formatDateTime,
  },
  { title: t.common.game, dataIndex: 'gameId', render: gameLabel },
  { title: t.students.results.level, dataIndex: 'levelId' },
  { title: t.students.results.pack, dataIndex: 'packId', render: (p: string | null) => p ?? t.common.none },
  {
    title: t.students.results.correct,
    key: 'correct',
    align: 'center',
    render: (_, r) => `${r.correct} / ${r.total}`,
  },
  { title: t.students.results.score, dataIndex: 'score', align: 'right', render: formatNumber },
  { title: t.students.results.duration, dataIndex: 'durationMs', align: 'right', render: formatDuration },
  {
    title: t.students.results.endedBy,
    dataIndex: 'endedBy',
    render: (e: EndedBy) => <Tag>{t.endedBy[e]}</Tag>,
  },
  {
    title: t.students.results.pointsAwarded,
    dataIndex: 'pointsAwarded',
    align: 'right',
    render: formatNumber,
  },
];

/** Kết quả từng ván chơi của học sinh (phân trang server, lọc game) */
export function StudentResultsTable({ studentId }: StudentResultsTableProps) {
  const table = useTableQuery({ filterKeys: ['gameId'] as const, defaultSort: 'playedAt:desc' });
  const list = useStudentGameResults(studentId, table.params);
  return (
    <>
      <Flex gap={8} wrap style={{ marginBottom: 12 }}>
        <GameSelect
          value={table.filters.gameId as GameId | undefined}
          onChange={(v) => table.setFilter('gameId', v)}
        />
      </Flex>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <DataTable<GameResultView>
        columns={buildColumns()}
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
