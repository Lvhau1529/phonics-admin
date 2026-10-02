import { Flex, Select } from 'antd';
import { PointKind, type GameId } from '@phonics/contracts';
import { useState } from 'react';
import { useClassPoints } from '@/features/classes/hooks';
import { GameSelect } from '@/features/games/components/GameSelect';
import { PointsTable } from '@/features/points/components/PointsTable';
import { StudentSelect } from '@/features/students/components/StudentSelect';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { RangePicker } from '@/shared/ui/RangePicker';
import { DEFAULT_RANGE, rangeParams, type RangeValue } from '@/shared/utils/range';

interface ClassPointsTabProps {
  classId: string;
  /** Hiện ô lọc học sinh (trang Sổ điểm toàn cục) */
  withStudentFilter?: boolean;
}

/** Tab Sổ điểm của lớp: lọc loại / game / học sinh / khoảng thời gian, phân trang server */
export function ClassPointsTab({ classId, withStudentFilter = false }: ClassPointsTabProps) {
  const table = useTableQuery({
    filterKeys: ['kind', 'gameId', 'studentId'] as const,
    defaultSort: 'createdAt:desc',
  });
  const [range, setRange] = useState<RangeValue>(DEFAULT_RANGE);
  const list = useClassPoints(classId, { ...table.params, ...rangeParams(range) });

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
        {withStudentFilter && (
          <StudentSelect
            classId={classId}
            value={table.filters.studentId}
            onChange={(v) => table.setFilter('studentId', v)}
            placeholder={t.points.filterStudent}
          />
        )}
      </Flex>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <PointsTable
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
  );
}
