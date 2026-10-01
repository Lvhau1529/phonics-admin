import {
  BarChartOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ReadOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Skeleton, Statistic } from 'antd';
import type { OverviewStats } from '@phonics/contracts';
import type { ReactNode } from 'react';
import { t } from '@/shared/i18n/vi';
import { COLOR_PRIMARY } from '@/shared/theme';

interface OverviewCardsProps {
  data: OverviewStats | undefined;
  loading: boolean;
}

/** 6 thẻ số liệu tổng (học sinh, giáo viên, lớp, điểm / ván / lượt xem-chơi 7 ngày) */
export function OverviewCards({ data, loading }: OverviewCardsProps) {
  const cards: { title: string; value: number | undefined; icon: ReactNode; suffix?: string }[] = [
    { title: t.dashboard.students, value: data?.students, icon: <TeamOutlined /> },
    { title: t.dashboard.teachers, value: data?.teachers, icon: <UserOutlined /> },
    { title: t.dashboard.classes, value: data?.classes, icon: <ReadOutlined /> },
    { title: t.dashboard.points7d, value: data?.pointsLast7d, icon: <BarChartOutlined /> },
    { title: t.dashboard.rounds7d, value: data?.roundsLast7d, icon: <PlayCircleOutlined /> },
    {
      title: t.dashboard.views7d,
      value: data?.viewsLast7d,
      icon: <EyeOutlined />,
      suffix: data ? `/ ${data.playsLast7d} ${t.dashboard.plays.toLowerCase()}` : undefined,
    },
  ];
  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => (
        <Col key={card.title} xs={12} md={8} xl={4}>
          <Card size="small">
            {loading && !data ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title={card.title}
                value={card.value ?? 0}
                prefix={<span style={{ color: COLOR_PRIMARY }}>{card.icon}</span>}
                suffix={card.suffix && <span style={{ fontSize: 12 }}>{card.suffix}</span>}
              />
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
}
