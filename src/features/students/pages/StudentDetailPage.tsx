import { EditOutlined, KeyOutlined, SwapOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Flex, Select, Skeleton, Space, Statistic, Tabs, Typography } from 'antd';
import { PointKind, type GameId } from '@phonics/contracts';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAuth } from '@/features/auth/hooks';
import { GameSelect } from '@/features/games/components/GameSelect';
import { PointsTable } from '@/features/points/components/PointsTable';
import { MoveClassModal } from '@/features/students/components/MoveClassModal';
import { ResetPasswordModal } from '@/features/students/components/ResetPasswordModal';
import { StudentFormDrawer } from '@/features/students/components/StudentFormDrawer';
import { StudentGamesTab } from '@/features/students/components/StudentGamesTab';
import { StudentPointsByGame } from '@/features/students/components/StudentPointsByGame';
import { StudentResultsTable } from '@/features/students/components/StudentResultsTable';
import { useStudent, useStudentPoints } from '@/features/students/hooks';
import type { StudentDetailModel } from '@/features/students/models/StudentDetailModel';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { RangePicker } from '@/shared/ui/RangePicker';
import { DEFAULT_RANGE, rangeParams, type RangeValue } from '@/shared/utils/range';
import { StatusTag } from '@/shared/ui/RoleTag';
import { formatDateTime, formatNumber } from '@/shared/utils/format';

type TabKey = 'by-game' | 'points' | 'results' | 'games';

/** Tab Sổ điểm của học sinh: lọc loại / game / khoảng thời gian */
function StudentPointsTab({ studentId }: { studentId: string }) {
  const table = useTableQuery({ filterKeys: ['kind', 'gameId'] as const, defaultSort: 'createdAt:desc' });
  const [range, setRange] = useState<RangeValue>(DEFAULT_RANGE);
  const list = useStudentPoints(studentId, { ...table.params, ...rangeParams(range) });
  return (
    <>
      <Flex gap={8} wrap style={{ marginBottom: 12 }}>
        <RangePicker value={range} onChange={setRange} />
        <Select
          allowClear
          placeholder={t.points.kind}
          value={table.filters.kind as PointKind | undefined}
          onChange={(v) => table.setFilter('kind', v)}
          options={PointKind.options.map((k) => ({ value: k, label: t.pointKind[k] }))}
          style={{ width: 140 }}
        />
        <GameSelect
          value={table.filters.gameId as GameId | undefined}
          onChange={(v) => table.setFilter('gameId', v)}
        />
      </Flex>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <PointsTable
        hideStudent
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

export function StudentDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const student = useStudent(id);
  const [editOpen, setEditOpen] = useState(false);
  const [moving, setMoving] = useState<StudentDetailModel>();
  const [resetting, setResetting] = useState<StudentDetailModel>();
  const tab = (searchParams.get('tab') as TabKey | null) ?? 'by-game';
  const setTab = (key: string) => setSearchParams(new URLSearchParams({ tab: key }), { replace: true });
  const canEdit = auth.can('students.edit');
  const canMove = auth.can('class.changeStudentClass');

  if (student.isLoading) return <Skeleton active />;
  if (student.error || !student.data)
    return <ErrorAlert error={student.error} onRetry={() => void student.refetch()} />;
  const s = student.data;

  return (
    <>
      <PageHeader
        title={
          <Space>
            <AvatarImg avatarKey={s.avatarKey} name={s.displayName} />
            {s.displayName}
          </Space>
        }
        documentTitle={`${t.students.title}: ${s.displayName}`}
        backTo={ROUTES.students}
        subtitle={s.email}
        extra={
          <>
            {canEdit && (
              <Button type="primary" icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
                {t.common.edit}
              </Button>
            )}
            {canMove && (
              <Button icon={<SwapOutlined />} onClick={() => setMoving(s)}>
                {t.students.moveClass}
              </Button>
            )}
            {auth.isAdmin && (
              <Button icon={<KeyOutlined />} onClick={() => setResetting(s)}>
                {t.students.resetPassword}
              </Button>
            )}
          </>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Flex gap={24} wrap style={{ marginBottom: 16 }}>
          <Statistic title={t.students.pointsTotal} value={s.points} />
          <Statistic title={t.students.pointsGame} value={s.pointsByKind.GAME} />
          <Statistic title={t.students.pointsBonus} value={s.pointsByKind.BONUS} />
          <Statistic title={t.common.rank} value={s.rank ?? t.common.none} />
          <Statistic title={t.students.gamesPlayed} value={formatNumber(s.gamesPlayed)} />
        </Flex>
        <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 3 }} title={t.students.profile}>
          <Descriptions.Item label={t.common.status}>
            <StatusTag status={s.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t.common.class}>
            {s.class ? <Link to={ROUTES.classDetail(s.class.id)}>{s.classLabel}</Link> : t.students.noClass}
          </Descriptions.Item>
          <Descriptions.Item label={t.students.joinedAt}>
            {formatDateTime(s.class?.joinedAt)}
          </Descriptions.Item>
          <Descriptions.Item label={t.common.lastLogin}>{s.lastLoginText}</Descriptions.Item>
          <Descriptions.Item label={t.common.createdAt}>{formatDateTime(s.createdAt)}</Descriptions.Item>
          {s.parent && (
            <Descriptions.Item label={t.students.parent}>
              {s.parentContactText || t.common.none}
            </Descriptions.Item>
          )}
          {auth.isAdmin && (
            <Descriptions.Item label={t.students.notes} span={3}>
              <Typography.Text type={s.notes ? undefined : 'secondary'}>
                {s.notes ?? t.common.none}
              </Typography.Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        destroyOnHidden
        items={[
          { key: 'by-game', label: t.students.tabByGame, children: <StudentPointsByGame studentId={id} /> },
          { key: 'points', label: t.students.tabPoints, children: <StudentPointsTab studentId={id} /> },
          { key: 'results', label: t.students.tabResults, children: <StudentResultsTable studentId={id} /> },
          { key: 'games', label: t.students.tabGames, children: <StudentGamesTab studentId={id} /> },
        ]}
      />

      <StudentFormDrawer open={editOpen} student={s} onClose={() => setEditOpen(false)} />
      <MoveClassModal student={moving} onClose={() => setMoving(undefined)} />
      <ResetPasswordModal student={resetting} onClose={() => setResetting(undefined)} />
    </>
  );
}

export default StudentDetailPage;
