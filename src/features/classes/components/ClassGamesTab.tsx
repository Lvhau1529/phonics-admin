import { UnlockOutlined } from '@ant-design/icons';
import { Button, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ClassSummary, GameCatalogItem, GameId } from '@phonics/contracts';
import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks';
import { UnlockGameClassModal } from '@/features/classes/components/UnlockGameClassModal';
import { useGameCatalog } from '@/features/games/hooks';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatNumber } from '@/shared/utils/format';

interface ClassGamesTabProps {
  cls: ClassSummary;
}

/** Tab Game của lớp: catalog + nút mở khoá cho cả lớp (quyền games.unlock) */
export function ClassGamesTab({ cls }: ClassGamesTabProps) {
  const auth = useAuth();
  const canUnlock = auth.can('games.unlock');
  const catalog = useGameCatalog();
  const [unlockGame, setUnlockGame] = useState<GameId>();

  const columns: ColumnsType<GameCatalogItem> = [
    { title: t.common.game, dataIndex: 'title' },
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
    {
      title: t.common.actions,
      key: 'actions',
      render: (_, g) => (
        <Tooltip title={canUnlock ? undefined : t.classes.needUnlockPermission}>
          <Button icon={<UnlockOutlined />} disabled={!canUnlock} onClick={() => setUnlockGame(g.id)}>
            {t.classes.unlockGame}
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <ErrorAlert error={catalog.error} onRetry={() => void catalog.refetch()} />
      <DataTable.Static<GameCatalogItem>
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={catalog.data}
        loading={catalog.isFetching}
        pagination={false}
      />
      <UnlockGameClassModal
        cls={cls}
        open={!!unlockGame}
        gameId={unlockGame}
        onClose={() => setUnlockGame(undefined)}
      />
    </>
  );
}
