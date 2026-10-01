import { Card, Flex } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { GameId, type GameByClassStats } from '@phonics/contracts';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { ROUTES } from '@/app/routes';
import { GameTimelineChart } from '@/features/games/components/GameTimelineChart';
import { useGameByClass } from '@/features/games/hooks';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { RangePicker } from '@/shared/ui/RangePicker';
import { DEFAULT_RANGE, rangeParams, type RangeValue } from '@/shared/utils/range';
import { formatNumber } from '@/shared/utils/format';

const buildColumns = (): ColumnsType<GameByClassStats> => [
  {
    title: t.common.class,
    dataIndex: 'className',
    render: (name: string, r) => <Link to={ROUTES.classDetail(r.classId)}>{name}</Link>,
  },
  { title: t.games.plays, dataIndex: 'plays', align: 'right', render: formatNumber },
  { title: t.games.uniquePlayers, dataIndex: 'players', align: 'right', render: formatNumber },
  { title: t.common.points, dataIndex: 'points', align: 'right', render: formatNumber },
];

/** Bảng thống kê game theo lớp, có chọn khoảng thời gian */
function GameByClassTable({ gameId }: { gameId: GameId }) {
  const [range, setRange] = useState<RangeValue>(DEFAULT_RANGE);
  const byClass = useGameByClass(gameId, rangeParams(range));
  return (
    <Flex vertical gap={12}>
      <RangePicker value={range} onChange={setRange} size="small" />
      <ErrorAlert error={byClass.error} onRetry={() => void byClass.refetch()} />
      <DataTable.Static<GameByClassStats>
        rowKey="classId"
        size="small"
        columns={buildColumns()}
        dataSource={byClass.data}
        loading={byClass.isFetching}
        pagination={false}
      />
    </Flex>
  );
}

export function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const parsed = GameId.safeParse(id);
  if (!parsed.success) return <Navigate to={ROUTES.games} replace />;
  const gameId = parsed.data;

  return (
    <>
      <PageHeader
        title={t.gameName[gameId]}
        documentTitle={`${t.games.title}: ${t.gameName[gameId]}`}
        backTo={ROUTES.games}
        subtitle={gameId}
      />
      <Card title={t.games.timeline} style={{ marginBottom: 16 }}>
        <GameTimelineChart gameId={gameId} height={320} />
      </Card>
      <Card title={t.games.byClass}>
        <GameByClassTable gameId={gameId} />
      </Card>
    </>
  );
}

export default GameDetailPage;
