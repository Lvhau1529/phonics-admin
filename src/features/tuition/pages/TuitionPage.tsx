import { MessageOutlined, SettingOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Flex, Row, Typography } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { TuitionService } from '@/features/tuition/api/tuitionService';
import { MonthRangePicker } from '@/features/tuition/components/MonthRangePicker';
import { TuitionMonthsChart } from '@/features/tuition/components/TuitionMonthsChart';
import { TuitionSummaryCards } from '@/features/tuition/components/TuitionSummaryCards';
import { useMonthRange } from '@/features/tuition/components/useMonthRange';
import {
  TuitionMonthsTable,
  TuitionSlotsTable,
  TuitionStudentsTable,
} from '@/features/tuition/components/TuitionTables';
import { t } from '@/shared/i18n';
import { dayjs } from '@/shared/utils/dayjs';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';

/** Học phí tổng quát (ADMIN): tạm tính từ điểm danh theo tháng / ca / học sinh + cảnh báo buổi chờ, thiếu giá */
export function TuitionPage() {
  const [range, setRange] = useMonthRange(6);
  const overview = TuitionService.useOverview(range.from, range.to);
  const data = overview.data;
  const loading = overview.isFetching;
  const pendingLink = `${ROUTES.attendance}?status=PENDING&from=${range.from}-01&to=${dayjs(`${range.to}-01`)
    .endOf('month')
    .format('YYYY-MM-DD')}`;

  return (
    <>
      <PageHeader
        title={t.tuition.title}
        subtitle={t.tuition.estimateHint}
        extra={
          <Flex gap={8} wrap>
            <MonthRangePicker value={range} onChange={setRange} />
            <Link to={ROUTES.tuitionNotices}>
              <Button type="primary" icon={<MessageOutlined />}>
                {t.tuitionNotices.open}
              </Button>
            </Link>
            <Link to={ROUTES.tuitionSettings}>
              <Button icon={<SettingOutlined />}>{t.tuitionSettings.open}</Button>
            </Link>
          </Flex>
        }
      />
      <ErrorAlert error={overview.error} onRetry={() => void overview.refetch()} />
      <Flex vertical gap={16}>
        {!!data?.pendingSessions && (
          <Alert
            type="warning"
            showIcon
            message={t.tuition.pendingWarning(data.pendingSessions)}
            action={
              <Link to={pendingLink}>
                <Button size="small">{t.tuition.viewPending}</Button>
              </Link>
            }
          />
        )}
        {!!data?.zeroPriceRecords && (
          <Alert type="warning" showIcon message={t.tuition.zeroPriceWarning(data.zeroPriceRecords)} />
        )}
        <TuitionSummaryCards totals={data?.totals} loading={loading} showStudents />
        <Card title={t.tuition.byMonth}>
          <Flex vertical gap={16}>
            <TuitionMonthsChart months={data?.months} loading={loading} />
            <TuitionMonthsTable months={data?.months} loading={loading} showStudents />
          </Flex>
        </Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card title={t.tuition.bySlot}>
              <TuitionSlotsTable rows={data?.bySlot} loading={loading} />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              title={t.tuition.topStudents}
              extra={<Typography.Text type="secondary">{data?.topStudents.length ?? 0}</Typography.Text>}
            >
              <TuitionStudentsTable rows={data?.topStudents} loading={loading} />
            </Card>
          </Col>
        </Row>
      </Flex>
    </>
  );
}

export default TuitionPage;
