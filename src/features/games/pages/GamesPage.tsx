import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GameAdminItem } from '@phonics/contracts';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAuth } from '@/features/auth/hooks';
import { GameFormDrawer } from '@/features/games/components/GameFormDrawer';
import { useAdminGames } from '@/features/games/hooks';
import { t } from '@/shared/i18n/vi';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { formatDateTime, formatNumber } from '@/shared/utils/format';

export function GamesPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const games = useAdminGames();
  const [editing, setEditing] = useState<GameAdminItem>();
  const canManage = auth.can('games.manage');

  const columns: ColumnsType<GameAdminItem> = [
    { title: t.games.gameTitle, dataIndex: 'title', render: (title: string, g) => `${title} (${g.id})` },
    {
      title: t.common.status,
      key: 'status',
      render: (_, g) => (
        <>
          <Tag color={g.enabled ? 'success' : 'default'}>
            {g.enabled ? t.games.enabled : t.common.disabled}
          </Tag>
          {g.comingSoon && <Tag color="orange">{t.games.comingSoon}</Tag>}
        </>
      ),
    },
    {
      title: t.games.price,
      dataIndex: 'price',
      align: 'right',
      render: (p: number | null) => (p === null ? t.games.priceFree : formatNumber(p)),
    },
    { title: t.games.sortOrder, dataIndex: 'sortOrder', align: 'right' },
    { title: t.games.views, dataIndex: 'views', align: 'right', render: formatNumber },
    { title: t.games.plays, dataIndex: 'plays', align: 'right', render: formatNumber },
    { title: t.games.uniquePlayers, dataIndex: 'uniquePlayers', align: 'right', render: formatNumber },
    { title: t.games.unlockedStudents, dataIndex: 'unlockedStudents', align: 'right', render: formatNumber },
    { title: t.common.updatedAt, dataIndex: 'updatedAt', render: formatDateTime },
    {
      title: t.common.actions,
      key: 'actions',
      fixed: 'right',
      render: (_, g) => (
        <Space size={0}>
          <Tooltip title={t.common.view}>
            <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(ROUTES.gameDetail(g.id))} />
          </Tooltip>
          <Tooltip title={canManage ? t.common.edit : t.games.needManagePermission}>
            <Button type="text" icon={<EditOutlined />} disabled={!canManage} onClick={() => setEditing(g)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t.games.title} />
      <ErrorAlert error={games.error} onRetry={() => void games.refetch()} />
      <Table<GameAdminItem>
        rowKey="id"
        size="middle"
        scroll={{ x: 'max-content' }}
        columns={columns}
        dataSource={games.data}
        loading={games.isLoading}
        pagination={false}
      />
      <GameFormDrawer game={editing} onClose={() => setEditing(undefined)} />
    </>
  );
}

export default GamesPage;
