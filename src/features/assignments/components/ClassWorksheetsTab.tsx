import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Segmented, Statistic } from 'antd';
import { useState } from 'react';
import { AssignWorksheetModal } from '@/features/assignments/components/AssignWorksheetModal';
import { AssignmentsCalendar } from '@/features/assignments/components/AssignmentsCalendar';
import { AssignmentsTable } from '@/features/assignments/components/AssignmentsTable';
import { useAssignmentsList } from '@/features/assignments/hooks';
import { useAuth } from '@/features/auth/hooks';
import { AccuracyByTypeChart } from '@/features/worksheet-stats/components/AccuracyByTypeChart';
import { WeeklyTrendChart } from '@/features/worksheet-stats/components/WeeklyTrendChart';
import { useClassWorksheetOverview } from '@/features/worksheet-stats/hooks';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { RangePicker } from '@/shared/ui/RangePicker';
import { formatPercent } from '@/shared/utils/format';
import { DEFAULT_RANGE, rangeParams, type RangeValue } from '@/shared/utils/range';

type View = 'list' | 'calendar';

/** Tab "Phiếu bài tập" trên trang lớp: tổng quan + bài giao (list / lịch) */
export function ClassWorksheetsTab({ classId }: { classId: string }) {
  const auth = useAuth();
  const canStats = auth.can('worksheets.viewStats');
  const [view, setView] = useState<View>('list');
  const [range, setRange] = useState<RangeValue>(DEFAULT_RANGE);
  const [assignOpen, setAssignOpen] = useState(false);
  const table = useTableQuery({ filterKeys: ['status'] as const, defaultSort: 'scheduledFor:desc' });
  const list = useAssignmentsList({ ...table.params, classId, ...rangeParams(range) });
  const overview = useClassWorksheetOverview(canStats ? classId : undefined, rangeParams(range));
  const o = overview.data;
  const pct = (v: number | null | undefined) =>
    v === null || v === undefined ? t.common.none : formatPercent(v);

  return (
    <Flex vertical gap={16}>
      <Flex gap={8} wrap justify="space-between">
        <Flex gap={8} wrap>
          <RangePicker value={range} onChange={setRange} />
          <Segmented<View>
            value={view}
            onChange={setView}
            options={[
              { value: 'list', label: t.assignments.list },
              { value: 'calendar', label: t.assignments.calendar },
            ]}
          />
        </Flex>
        {auth.can('worksheets.assign') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAssignOpen(true)}>
            {t.assignments.assign}
          </Button>
        )}
      </Flex>
      {canStats && (
        <>
          <ErrorAlert error={overview.error} />
          <Row gutter={[16, 16]}>
            {[
              { title: t.worksheetStats.assignments, value: o?.assignments },
              { title: t.worksheetStats.openNow, value: o?.open },
              { title: t.worksheetStats.avgPercent, value: pct(o?.avgPercent) },
              { title: t.worksheetStats.completionRate, value: pct(o?.completionRate) },
              { title: t.worksheetStats.lateRate, value: pct(o?.lateRate) },
              { title: t.worksheetStats.pendingGrading, value: o?.pendingGrading },
            ].map((c) => (
              <Col key={c.title} xs={12} md={8} xl={4}>
                <Card size="small">
                  <Statistic title={c.title} value={c.value ?? t.common.none} loading={overview.isLoading} />
                </Card>
              </Col>
            ))}
            <Col xs={24} xl={12}>
              <Card size="small" title={t.worksheetStats.accuracyByType}>
                <AccuracyByTypeChart data={o?.byType} loading={overview.isFetching} />
              </Card>
            </Col>
            <Col xs={24} xl={12}>
              <Card size="small" title={t.worksheetStats.weeklyTrend}>
                <WeeklyTrendChart data={o?.trend} loading={overview.isFetching} />
              </Card>
            </Col>
          </Row>
        </>
      )}
      {view === 'calendar' ? (
        <Card size="small">
          <AssignmentsCalendar classId={classId} />
        </Card>
      ) : (
        <>
          <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
          <AssignmentsTable
            hideClass
            data={list.data}
            loading={list.isFetching}
            page={table.page}
            pageSize={table.pageSize}
            sort={table.sort}
            onPageChange={table.setPage}
            onSortChange={table.setSort}
          />
        </>
      )}
      <AssignWorksheetModal open={assignOpen} classId={classId} onClose={() => setAssignOpen(false)} />
    </Flex>
  );
}
