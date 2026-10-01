import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ClassGameStats } from '@phonics/contracts';
import { t } from '@/shared/i18n/vi';
import { formatNumber, formatPercent, gameLabel } from '@/shared/utils/format';

interface ClassGamesTableProps {
  data: ClassGameStats[] | undefined;
  loading: boolean;
}

const columns: ColumnsType<ClassGameStats> = [
  { title: t.common.game, dataIndex: 'gameId', render: (id: ClassGameStats['gameId']) => gameLabel(id) },
  { title: t.dashboard.rounds, dataIndex: 'rounds', align: 'right', render: formatNumber },
  { title: t.dashboard.players, dataIndex: 'players', align: 'right', render: formatNumber },
  { title: t.dashboard.accuracy, dataIndex: 'accuracy', align: 'right', render: formatPercent },
  { title: t.common.points, dataIndex: 'points', align: 'right', render: formatNumber },
];

/** Bảng thống kê từng game trong lớp (ván, người chơi, độ chính xác, điểm) */
export function ClassGamesTable({ data, loading }: ClassGamesTableProps) {
  return (
    <Table<ClassGameStats>
      rowKey="gameId"
      size="small"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
    />
  );
}
