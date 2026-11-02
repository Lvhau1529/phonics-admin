import { Card, Col, Row, Skeleton, Statistic, theme } from 'antd';
import type { TuitionSummaryModel } from '@/features/tuition/models/TuitionModel';
import { t } from '@/shared/i18n';
import { formatMoney, formatNumber, formatPercent } from '@/shared/utils/format';

interface TuitionSummaryCardsProps {
  totals: TuitionSummaryModel | undefined;
  loading: boolean;
  /** Trang tổng quát: thêm thẻ số học sinh */
  showStudents?: boolean;
}

/** Thẻ số liệu học phí của cả khoảng: tổng tạm tính, đã / chờ xác nhận, trung bình tháng, lượt tính phí, có mặt */
export function TuitionSummaryCards({ totals, loading, showStudents }: TuitionSummaryCardsProps) {
  const { token } = theme.useToken();
  const rate = totals?.attendanceRate;
  const cards: { title: string; value: string; color?: string }[] = [
    { title: t.tuition.total, value: formatMoney(totals?.total ?? 0) },
    {
      title: t.tuition.confirmed,
      value: formatMoney(totals?.confirmedTotal ?? 0),
      color: token.colorSuccessText,
    },
    {
      title: t.tuition.pending,
      value: formatMoney(totals?.pendingTotal ?? 0),
      color: token.colorWarningText,
    },
    { title: t.tuition.avgPerMonth, value: formatMoney(totals?.avgPerMonth ?? 0) },
    { title: t.tuition.chargedCount, value: formatNumber(totals?.chargedCount ?? 0) },
    showStudents
      ? { title: t.tuition.students, value: formatNumber(totals?.studentCount ?? 0) }
      : {
          title: t.tuition.attendanceRate,
          value: rate === null || rate === undefined ? t.common.none : formatPercent(rate),
        },
  ];
  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => (
        <Col key={card.title} xs={12} md={8} xl={4}>
          <Card size="small">
            {loading && !totals ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title={card.title}
                value={card.value}
                valueStyle={{ color: card.color, fontSize: 20 }}
              />
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
}
