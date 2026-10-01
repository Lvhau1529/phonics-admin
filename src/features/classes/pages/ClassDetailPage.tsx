import {
  EditOutlined,
  InboxOutlined,
  PlusCircleOutlined,
  RollbackOutlined,
  TeamOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Descriptions, Flex, Popconfirm, Skeleton, Tabs, Tag, Tooltip } from 'antd';
import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAuth } from '@/features/auth/hooks';
import { AssignTeachersModal } from '@/features/classes/components/AssignTeachersModal';
import { BonusPointsModal } from '@/features/classes/components/BonusPointsModal';
import { ClassFormDrawer } from '@/features/classes/components/ClassFormDrawer';
import { ClassGamesTab } from '@/features/classes/components/ClassGamesTab';
import { ClassPointsTab } from '@/features/classes/components/ClassPointsTab';
import { ClassRankingTab } from '@/features/classes/components/ClassRankingTab';
import { ClassReportsTab } from '@/features/classes/components/ClassReportsTab';
import { ClassStudentsTab } from '@/features/classes/components/ClassStudentsTab';
import { UnlockGameClassModal } from '@/features/classes/components/UnlockGameClassModal';
import { useClass, useUpdateClass } from '@/features/classes/hooks';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { formatDateTime, formatNumber } from '@/shared/utils/format';

type TabKey = 'students' | 'ranking' | 'points' | 'bonus' | 'games' | 'reports';

export function ClassDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { message } = App.useApp();
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const cls = useClass(id);
  const update = useUpdateClass();
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [bonus, setBonus] = useState<{ open: boolean; mode: 'single' | 'batch' }>({
    open: false,
    mode: 'single',
  });
  const [unlockOpen, setUnlockOpen] = useState(false);
  const tab = (searchParams.get('tab') as TabKey | null) ?? 'students';
  const canAward = auth.can('points.award');
  const canUnlock = auth.can('games.unlock');

  // Đổi tab: xoá page / filter của tab cũ khỏi URL
  const setTab = (key: string) => setSearchParams(new URLSearchParams({ tab: key }), { replace: true });

  const setArchived = async (archived: boolean) => {
    try {
      await update.mutateAsync({ id, body: { archived } });
      message.success(t.common.updated);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  if (cls.isLoading) return <Skeleton active />;
  if (cls.error || !cls.data) return <ErrorAlert error={cls.error} onRetry={() => void cls.refetch()} />;
  const data = cls.data;

  const bonusTab = (
    <Card>
      <Flex vertical gap={12} align="flex-start">
        <span>{t.classes.bonusHint}</span>
        <Flex gap={8} wrap>
          <Tooltip title={canAward ? undefined : t.classes.bonusNeedPermission}>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              disabled={!canAward}
              onClick={() => setBonus({ open: true, mode: 'single' })}
            >
              {t.classes.bonusSingle}
            </Button>
          </Tooltip>
          <Tooltip title={canAward ? undefined : t.classes.bonusNeedPermission}>
            <Button
              icon={<TeamOutlined />}
              disabled={!canAward}
              onClick={() => setBonus({ open: true, mode: 'batch' })}
            >
              {t.classes.bonusBatch}
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Card>
  );

  return (
    <>
      <PageHeader
        title={data.name}
        documentTitle={`${t.classes.title}: ${data.name}`}
        backTo={ROUTES.classes}
        subtitle={`${t.classes.grade} ${data.grade} · ${t.classes.schoolYear} ${data.schoolYear}`}
        extra={
          <>
            {canAward && (
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => setBonus({ open: true, mode: 'single' })}
              >
                {t.classes.tabBonus}
              </Button>
            )}
            {canUnlock && (
              <Button icon={<UnlockOutlined />} onClick={() => setUnlockOpen(true)}>
                {t.classes.unlockGame}
              </Button>
            )}
            {auth.isAdmin && (
              <>
                <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
                  {t.common.edit}
                </Button>
                <Button icon={<TeamOutlined />} onClick={() => setAssignOpen(true)}>
                  {t.classes.assignTeachers}
                </Button>
                {data.archivedAt ? (
                  <Popconfirm
                    title={t.classes.confirmUnarchive(data.name)}
                    onConfirm={() => setArchived(false)}
                    okText={t.common.confirm}
                    cancelText={t.common.cancel}
                  >
                    <Button icon={<RollbackOutlined />}>{t.classes.unarchive}</Button>
                  </Popconfirm>
                ) : (
                  <Popconfirm
                    title={t.classes.confirmArchive(data.name)}
                    onConfirm={() => setArchived(true)}
                    okText={t.common.confirm}
                    cancelText={t.common.cancel}
                  >
                    <Button danger icon={<InboxOutlined />}>
                      {t.classes.archive}
                    </Button>
                  </Popconfirm>
                )}
              </>
            )}
          </>
        }
      >
        <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }}>
          <Descriptions.Item label={t.common.status}>
            <Tag color={data.archivedAt ? 'default' : 'success'}>
              {data.archivedAt ? t.classes.archived : t.classes.active}
            </Tag>
            {data.joinVisible && !data.archivedAt && <Tag color="blue">{t.classes.joinVisible}</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label={t.classes.studentCount}>
            {formatNumber(data.studentCount)}
          </Descriptions.Item>
          <Descriptions.Item label={t.classes.teachers}>
            {data.teachers.length
              ? data.teachers.map((tc) => <Tag key={tc.id}>{tc.displayName}</Tag>)
              : t.common.none}
          </Descriptions.Item>
          <Descriptions.Item label={t.common.createdAt}>{formatDateTime(data.createdAt)}</Descriptions.Item>
        </Descriptions>
      </PageHeader>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        destroyOnHidden
        items={[
          { key: 'students', label: t.classes.tabStudents, children: <ClassStudentsTab classId={id} /> },
          { key: 'ranking', label: t.classes.tabRanking, children: <ClassRankingTab classId={id} /> },
          { key: 'points', label: t.classes.tabPoints, children: <ClassPointsTab classId={id} /> },
          { key: 'bonus', label: t.classes.tabBonus, children: bonusTab },
          { key: 'games', label: t.classes.tabGames, children: <ClassGamesTab cls={data} /> },
          { key: 'reports', label: t.classes.tabReports, children: <ClassReportsTab classId={id} /> },
        ]}
      />

      <ClassFormDrawer open={editOpen} cls={data} onClose={() => setEditOpen(false)} />
      <AssignTeachersModal
        key={assignOpen ? data.updatedAt : 'none'}
        cls={assignOpen ? data : undefined}
        onClose={() => setAssignOpen(false)}
      />
      <BonusPointsModal
        classId={id}
        open={bonus.open}
        initialMode={bonus.mode}
        onClose={() => setBonus((b) => ({ ...b, open: false }))}
      />
      <UnlockGameClassModal cls={data} open={unlockOpen} onClose={() => setUnlockOpen(false)} />
    </>
  );
}

export default ClassDetailPage;
