import { Col, Empty, Flex, Row } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { PointsByGame } from '@phonics/contracts';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStudentPointsByGame } from '@/features/students/hooks';
import { useChartTheme } from '@/shared/hooks/useChartTheme';
import { t } from '@/shared/i18n';
import { ChartFrame } from '@/shared/ui/ChartFrame';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { RangePicker } from '@/shared/ui/RangePicker';
import { DEFAULT_RANGE, rangeParams, type RangeValue } from '@/shared/utils/range';
import { formatNumber, gameLabel } from '@/shared/utils/format';

interface StudentPointsByGameProps {
  studentId: string;
}

const buildColumns = (): ColumnsType<PointsByGame> => [
  { title: t.common.game, dataIndex: 'gameId', render: gameLabel },
  { title: t.common.points, dataIndex: 'points', align: 'right', render: formatNumber },
  { title: t.students.rounds, dataIndex: 'rounds', align: 'right', render: formatNumber },
];

/** Điểm của học sinh theo từng game: cột + bảng, lọc khoảng thời gian */
export function StudentPointsByGame({ studentId }: StudentPointsByGameProps) {
  const [range, setRange] = useState<RangeValue>(DEFAULT_RANGE);
  const query = useStudentPointsByGame(studentId, rangeParams(range));
  const rows = (query.data ?? []).map((r) => ({ ...r, label: gameLabel(r.gameId) }));
  const chart = useChartTheme();

  return (
    <Flex vertical gap={12}>
      <RangePicker value={range} onChange={setRange} />
      <ErrorAlert error={query.error} onRetry={() => void query.refetch()} />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <ChartFrame loading={query.isFetching} hasData={!!query.data} height={240}>
            {rows.length === 0 ? (
              <Empty description={t.common.noData} />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="label" fontSize={12} stroke={chart.axis} tick={{ fill: chart.text }} />
                  <YAxis
                    fontSize={12}
                    allowDecimals={false}
                    stroke={chart.axis}
                    tick={{ fill: chart.text }}
                  />
                  <Tooltip {...chart.tooltip} />
                  <Bar dataKey="points" name={t.common.points} fill={chart.colors[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartFrame>
        </Col>
        <Col xs={24} md={12}>
          <DataTable.Static<PointsByGame>
            rowKey="gameId"
            size="small"
            columns={buildColumns()}
            dataSource={query.data}
            loading={query.isFetching}
            pagination={false}
          />
        </Col>
      </Row>
    </Flex>
  );
}
