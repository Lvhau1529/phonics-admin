import { Card, Col, Flex, Row, Statistic, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { StudentWorksheetRecent } from '@phonics/contracts';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AccuracyByTypeChart } from '@/features/worksheet-stats/components/AccuracyByTypeChart';
import { WeeklyTrendChart } from '@/features/worksheet-stats/components/WeeklyTrendChart';
import { WorksheetStatsService } from '@/features/worksheet-stats/api/worksheetStatsService';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatDate, formatPercent } from '@/shared/utils/format';

const buildColumns = (): ColumnsType<StudentWorksheetRecent> => [
  { title: t.assignments.scheduledFor, dataIndex: 'scheduledFor', width: 120, render: formatDate },
  {
    title: t.assignments.worksheet,
    dataIndex: 'worksheetTitle',
    render: (title: string, r) => <Link to={ROUTES.assignmentDetail(r.assignmentId)}>{title}</Link>,
  },
  {
    title: t.common.status,
    key: 'status',
    render: (_, r) =>
      r.status ? (
        <Flex gap={4}>
          <Tag
            color={r.status === 'GRADED' ? 'success' : r.status === 'SUBMITTED' ? 'processing' : 'default'}
          >
            {t.submissionStatus[r.status]}
          </Tag>
          {r.late && <Tag color="warning">{t.assignments.late}</Tag>}
        </Flex>
      ) : (
        <Tag>{t.rosterStatus.MISSING}</Tag>
      ),
  },
  {
    title: t.grading.score,
    key: 'score',
    align: 'right',
    render: (_, r) =>
      r.submissionId && r.totalScore !== null ? (
        <Link to={ROUTES.grading(r.assignmentId, r.submissionId)}>
          {r.totalScore}/{r.maxScore}
          {r.percent !== null ? ` (${formatPercent(r.percent)})` : ''}
        </Link>
      ) : (
        t.common.none
      ),
  },
  {
    title: t.common.rank,
    dataIndex: 'rank',
    align: 'center',
    width: 80,
    render: (v: number | null) => v ?? t.common.none,
  },
];

/** Tab "Phiếu bài tập" trên trang học sinh */
export function StudentWorksheetsTab({ studentId }: { studentId: string }) {
  const stats = WorksheetStatsService.useStudent(studentId);
  const s = stats.data;
  const pct = (v: number | null | undefined) =>
    v === null || v === undefined ? t.common.none : formatPercent(v);
  return (
    <Flex vertical gap={16}>
      <ErrorAlert error={stats.error} onRetry={() => void stats.refetch()} />
      <Row gutter={[16, 16]}>
        {[
          { title: t.worksheetStats.done, value: s?.done },
          { title: t.worksheetStats.avgPercent, value: pct(s?.avgPercent) },
          { title: t.worksheetStats.bestPercent, value: pct(s?.bestPercent) },
          { title: t.worksheetStats.late, value: s?.late },
          { title: t.worksheetStats.missing, value: s?.missing },
          { title: t.worksheetStats.pendingGrading, value: s?.pendingGrading },
        ].map((c) => (
          <Col key={c.title} xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic title={c.title} value={c.value ?? t.common.none} loading={stats.isLoading} />
            </Card>
          </Col>
        ))}
        <Col xs={24} xl={12}>
          <Card size="small" title={t.worksheetStats.accuracyByType}>
            <AccuracyByTypeChart data={s?.byType} loading={stats.isFetching} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card size="small" title={t.worksheetStats.weeklyTrend}>
            <WeeklyTrendChart data={s?.trend} loading={stats.isFetching} />
          </Card>
        </Col>
      </Row>
      <Card size="small" title={t.worksheetStats.history}>
        <DataTable.Static<StudentWorksheetRecent>
          size="small"
          rowKey="assignmentId"
          columns={buildColumns()}
          dataSource={s?.recent}
          loading={stats.isFetching}
          pagination={false}
          locale={{ emptyText: t.worksheetStats.noData }}
        />
      </Card>
    </Flex>
  );
}
