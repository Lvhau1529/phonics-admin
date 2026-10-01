import { App, Switch, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { StudentGameStatus } from '@phonics/contracts';
import { useAuth } from '@/features/auth/hooks';
import { useSetStudentGameUnlock, useStudentGames } from '@/features/students/hooks';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatDateTime, formatNumber, gameLabel } from '@/shared/utils/format';

interface StudentGamesTabProps {
  studentId: string;
}

/** Trạng thái mở khoá từng game của học sinh; Switch mở / thu hồi (quyền games.unlock) */
export function StudentGamesTab({ studentId }: StudentGamesTabProps) {
  const { message } = App.useApp();
  const auth = useAuth();
  const canUnlock = auth.can('games.unlock');
  const games = useStudentGames(studentId);
  const setUnlock = useSetStudentGameUnlock(studentId);

  const toggle = async (game: StudentGameStatus, unlocked: boolean) => {
    try {
      await setUnlock.mutateAsync({ gameId: game.gameId, body: { unlocked } });
      message.success(t.students.unlockToggled);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const columns: ColumnsType<StudentGameStatus> = [
    { title: t.common.game, dataIndex: 'gameId', render: gameLabel },
    {
      title: t.common.status,
      dataIndex: 'unlocked',
      render: (unlocked: boolean) => (
        <Tag color={unlocked ? 'success' : 'default'}>
          {unlocked ? t.students.unlocked : t.students.locked}
        </Tag>
      ),
    },
    {
      title: t.students.unlockSource,
      dataIndex: 'source',
      render: (s: StudentGameStatus['source']) => (s ? t.unlockSource[s] : t.common.none),
    },
    { title: t.students.unlockedAt, dataIndex: 'unlockedAt', render: formatDateTime },
    { title: t.common.points, dataIndex: 'points', align: 'right', render: formatNumber },
    { title: t.students.rounds, dataIndex: 'rounds', align: 'right', render: formatNumber },
    {
      title: t.common.actions,
      key: 'toggle',
      render: (_, game) => (
        <Tooltip title={canUnlock ? undefined : t.classes.needUnlockPermission}>
          <Switch
            checked={game.unlocked}
            disabled={!canUnlock}
            loading={setUnlock.isPending && setUnlock.variables?.gameId === game.gameId}
            onChange={(checked) => toggle(game, checked)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <ErrorAlert error={games.error} onRetry={() => void games.refetch()} />
      <DataTable.Static<StudentGameStatus>
        rowKey="gameId"
        size="middle"
        columns={columns}
        dataSource={games.data}
        loading={games.isFetching}
        pagination={false}
      />
    </>
  );
}
