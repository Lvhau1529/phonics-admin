import { useQuery } from '@tanstack/react-query';
import { Card, Col, Flex, Row, Segmented, Tabs, Typography } from 'antd';
import { GAME_IDS, type Bucket } from '@phonics/contracts';
import { useState } from 'react';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { useClassOptions } from '@/features/classes/hooks';
import { statsApi } from '@/features/dashboard/api';
import { ClassGamesTable } from '@/features/dashboard/components/ClassGamesTable';
import { OverviewCards } from '@/features/dashboard/components/OverviewCards';
import { PointsTimelineChart } from '@/features/dashboard/components/PointsTimelineChart';
import { TopStudentsChart } from '@/features/dashboard/components/TopStudentsChart';
import { GameTimelineChart } from '@/features/games/components/GameTimelineChart';
import { qk } from '@/shared/api/queryKeys';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { RangePicker } from '@/shared/ui/RangePicker';
import { rangeParams, type RangeValue } from '@/shared/utils/range';
import { formatDateTime } from '@/shared/utils/format';

export function DashboardPage() {
  const overview = useQuery({ queryKey: qk.stats.overview, queryFn: statsApi.overview });
  const classes = useClassOptions();
  const [selectedClassId, setClassId] = useState<string>();
  const [range, setRange] = useState<RangeValue>({ range: 'month' });
  const [bucket, setBucket] = useState<Bucket>('day');
  // Chưa chọn thì lấy lớp đầu tiên trong danh sách
  const classId = selectedClassId ?? classes.data?.[0]?.id;

  const rp = rangeParams(range);
  const timeline = useQuery({
    queryKey: qk.stats.classTimeline(classId ?? '', { ...rp, bucket }),
    queryFn: () => statsApi.classTimeline(classId!, { ...rp, bucket }),
    enabled: !!classId,
  });
  const top = useQuery({
    queryKey: qk.stats.classTopStudents(classId ?? '', { ...rp, limit: 10 }),
    queryFn: () => statsApi.classTopStudents(classId!, { ...rp, limit: 10 }),
    enabled: !!classId,
  });
  const games = useQuery({
    queryKey: qk.stats.classGames(classId ?? '', rp),
    queryFn: () => statsApi.classGames(classId!, rp),
    enabled: !!classId,
  });

  return (
    <>
      <PageHeader
        title={t.dashboard.title}
        subtitle={
          overview.data ? t.dashboard.generatedAt(formatDateTime(overview.data.generatedAt)) : undefined
        }
      />
      <ErrorAlert error={overview.error} onRetry={() => void overview.refetch()} />
      <OverviewCards data={overview.data} loading={overview.isLoading} />

      <Card
        style={{ marginTop: 16 }}
        title={t.dashboard.classSection}
        extra={
          <Flex gap={8} wrap>
            <ClassSelect value={classId} onChange={setClassId} allowClear={false} size="small" />
            <RangePicker value={range} onChange={setRange} size="small" />
            <Segmented<Bucket>
              size="small"
              value={bucket}
              onChange={setBucket}
              options={[
                { value: 'day', label: t.common.bucketDay },
                { value: 'week', label: t.common.bucketWeek },
              ]}
            />
          </Flex>
        }
      >
        {!classId ? (
          <Typography.Text type="secondary">{t.common.selectClassFirst}</Typography.Text>
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={14}>
              <Typography.Title level={5}>{t.dashboard.pointsTimeline}</Typography.Title>
              <ErrorAlert error={timeline.error} />
              <PointsTimelineChart data={timeline.data} loading={timeline.isFetching} />
            </Col>
            <Col xs={24} xl={10}>
              <Typography.Title level={5}>{t.dashboard.topStudents}</Typography.Title>
              <ErrorAlert error={top.error} />
              <TopStudentsChart data={top.data} loading={top.isFetching} />
            </Col>
            <Col span={24}>
              <Typography.Title level={5}>{t.dashboard.classGames}</Typography.Title>
              <ErrorAlert error={games.error} />
              <ClassGamesTable data={games.data} loading={games.isFetching} />
            </Col>
          </Row>
        )}
      </Card>

      <Card style={{ marginTop: 16 }} title={t.dashboard.gameTimeline}>
        <Tabs
          items={GAME_IDS.map((id) => ({
            key: id,
            label: t.gameName[id],
            children: <GameTimelineChart gameId={id} />,
          }))}
        />
      </Card>
    </>
  );
}

export default DashboardPage;
