import { Card, Flex, Typography } from 'antd';
import { TuitionService } from '@/features/tuition/api/tuitionService';
import { MonthRangePicker } from '@/features/tuition/components/MonthRangePicker';
import { StatementExportButton } from '@/features/tuition/components/StatementExportButton';
import { TuitionMonthsChart } from '@/features/tuition/components/TuitionMonthsChart';
import { TuitionSummaryCards } from '@/features/tuition/components/TuitionSummaryCards';
import { useMonthRange } from '@/features/tuition/components/useMonthRange';
import { TuitionMonthsTable } from '@/features/tuition/components/TuitionTables';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';

/** Tab "Học phí" ở chi tiết học sinh (extra.viewPricing): biểu đồ + bảng học phí tạm tính theo tháng + xuất phiếu PDF */
export function StudentTuitionTab({ studentId }: { studentId: string }) {
  const [range, setRange] = useMonthRange(12);
  const tuition = TuitionService.useStudent(studentId, range.from, range.to);
  const data = tuition.data;
  const loading = tuition.isFetching;
  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" gap={12} wrap>
        <Typography.Text type="secondary">{t.tuition.estimateHint}</Typography.Text>
        <Flex gap={8} wrap>
          <StatementExportButton studentId={studentId} />
          <MonthRangePicker value={range} onChange={setRange} />
        </Flex>
      </Flex>
      <ErrorAlert error={tuition.error} onRetry={() => void tuition.refetch()} />
      <TuitionSummaryCards totals={data?.totals} loading={loading} />
      <Card title={t.tuition.byMonth}>
        <Flex vertical gap={16}>
          <TuitionMonthsChart months={data?.months} loading={loading} />
          <TuitionMonthsTable months={data?.activeMonths} loading={loading} />
        </Flex>
      </Card>
    </Flex>
  );
}
