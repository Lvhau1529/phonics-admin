import { CalendarOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Segmented, Select } from 'antd';
import type { AssignmentStatus } from '@phonics/contracts';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { AssignWorksheetModal } from '@/features/assignments/components/AssignWorksheetModal';
import { AssignmentsCalendar } from '@/features/assignments/components/AssignmentsCalendar';
import { AssignmentsTable } from '@/features/assignments/components/AssignmentsTable';
import { AssignmentsService } from '@/features/assignments/api/assignmentsService';
import { useAuth } from '@/features/auth/authStore';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { RangePicker } from '@/shared/ui/RangePicker';
import { DEFAULT_RANGE, rangeParams, type RangeValue } from '@/shared/utils/range';

type View = 'calendar' | 'list';

/** /assignments?view=calendar|list */
export function AssignmentsPage() {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const view: View = searchParams.get('view') === 'list' ? 'list' : 'calendar';
  const [assignOpen, setAssignOpen] = useState(false);
  const [calendarClass, setCalendarClass] = useState<string>();

  const setView = (v: View) => {
    const next = new URLSearchParams(searchParams);
    next.set('view', v);
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader
        title={t.assignments.title}
        extra={
          <>
            <Segmented<View>
              value={view}
              onChange={setView}
              options={[
                { value: 'calendar', label: t.assignments.calendar, icon: <CalendarOutlined /> },
                { value: 'list', label: t.assignments.list, icon: <UnorderedListOutlined /> },
              ]}
            />
            {auth.can('worksheets.assign') && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAssignOpen(true)}>
                {t.assignments.assign}
              </Button>
            )}
          </>
        }
      />
      {view === 'calendar' ? (
        <Card
          size="small"
          extra={
            <ClassSelect
              value={calendarClass}
              onChange={setCalendarClass}
              size="small"
              placeholder={t.common.all}
            />
          }
        >
          <AssignmentsCalendar classId={calendarClass} />
        </Card>
      ) : (
        <AssignmentsListView />
      )}
      <AssignWorksheetModal open={assignOpen} onClose={() => setAssignOpen(false)} />
    </>
  );
}

function AssignmentsListView() {
  const table = useTableQuery({
    filterKeys: ['classId', 'status'] as const,
    defaultSort: 'scheduledFor:desc',
  });
  const [range, setRange] = useState<RangeValue>(DEFAULT_RANGE);
  const list = AssignmentsService.useList({ ...table.params, ...rangeParams(range) });
  return (
    <>
      <Flex gap={8} wrap style={{ marginBottom: 12 }}>
        <ClassSelect value={table.filters.classId} onChange={(v) => table.setFilter('classId', v)} />
        <Select<AssignmentStatus>
          allowClear
          placeholder={t.assignments.status}
          value={table.filters.status as AssignmentStatus | undefined}
          onChange={(v) => table.setFilter('status', v)}
          options={(['SCHEDULED', 'OPEN', 'CLOSED'] as const).map((s) => ({
            value: s,
            label: t.assignmentStatus[s],
          }))}
          style={{ width: 140 }}
        />
        <RangePicker value={range} onChange={setRange} />
      </Flex>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <AssignmentsTable
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

export default AssignmentsPage;
