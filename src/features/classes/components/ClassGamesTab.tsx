import { UnlockOutlined } from '@ant-design/icons';
import { Button, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GameId } from '@phonics/contracts';
import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks';
import { UnlockGameClassModal } from '@/features/classes/components/UnlockGameClassModal';
import type { ClassModel } from '@/features/classes/models/ClassModel';
import { useGameCatalog } from '@/features/games/hooks';
import type { GameModel } from '@/features/games/models/GameModel';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';

interface ClassGamesTabProps {
  cls: ClassModel;
}

/** Tab Game của lớp: catalog + nút mở khoá cho cả lớp (quyền games.unlock) */
export function ClassGamesTab({ cls }: ClassGamesTabProps) {
  const auth = useAuth();
  const canUnlock = auth.can('games.unlock');
  const catalog = useGameCatalog();
  const [unlockGame, setUnlockGame] = useState<GameId>();

  const columns: ColumnsType<GameModel> = [
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
      render: (_, g) => g.priceText,
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
      <DataTable.Static<GameModel>
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
