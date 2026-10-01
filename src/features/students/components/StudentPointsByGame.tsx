import { Col, Empty, Flex, Row, Spin, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { PointsByGame } from '@phonics/contracts';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStudentPointsByGame } from '@/features/students/hooks';
import { t } from '@/shared/i18n/vi';
import { CHART_COLORS } from '@/shared/theme';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { RangePicker } from '@/shared/ui/RangePicker';
import { DEFAULT_RANGE, rangeParams, type RangeValue } from '@/shared/utils/range';
import { formatNumber, gameLabel } from '@/shared/utils/format';

interface StudentPointsByGameProps {
  studentId: string;
}

const columns: ColumnsType<PointsByGame> = [
  { title: t.common.game, dataIndex: 'gameId', render: gameLabel },
  { title: t.common.points, dataIndex: 'points', align: 'right', render: formatNumber },
  { title: t.students.rounds, dataIndex: 'rounds', align: 'right', render: formatNumber },
];

/** Điểm của học sinh theo từng game: cột + bảng, lọc khoảng thời gian */
export function StudentPointsByGame({ studentId }: StudentPointsByGameProps) {
  const [range, setRange] = useState<RangeValue>(DEFAULT_RANGE);
  const query = useStudentPointsByGame(studentId, rangeParams(range));
  const rows = (query.data ?? []).map((r) => ({ ...r, label: gameLabel(r.gameId) }));

  return (
    <Flex vertical gap={12}>
      <RangePicker value={range} onChange={setRange} />
      <ErrorAlert error={query.error} onRetry={() => void query.refetch()} />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          {query.isLoading ? (
            <Spin style={{ display: 'block', margin: '48px auto' }} />
          ) : rows.length === 0 ? (
            <Empty description={t.common.noData} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="points" name={t.common.points} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Col>
        <Col xs={24} md={12}>
          <Table<PointsByGame>
            rowKey="gameId"
            size="small"
            columns={columns}
            dataSource={query.data}
            loading={query.isLoading}
            pagination={false}
          />
        </Col>
      </Row>
    </Flex>
  );
}
