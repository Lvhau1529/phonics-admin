import { Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RankingEntry } from '@phonics/contracts';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { t } from '@/shared/i18n/vi';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { formatNumber } from '@/shared/utils/format';

interface RankingTableProps {
  items: RankingEntry[] | undefined;
  loading: boolean;
}

const RANK_COLORS: Record<number, string> = { 1: 'gold', 2: 'default', 3: 'volcano' };

const columns: ColumnsType<RankingEntry> = [
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
  { title: t.common.points, dataIndex: 'points', align: 'right', render: formatNumber },
];

/** Bảng xếp hạng lớp (không phân trang — một lớp ≤ vài chục học sinh) */
export function RankingTable({ items, loading }: RankingTableProps) {
  return (
    <Table<RankingEntry>
      rowKey="studentId"
      size="middle"
      columns={columns}
      dataSource={items}
      loading={loading}
      pagination={false}
      locale={{ emptyText: t.classes.rankingEmpty }}
    />
  );
}
