import { Empty } from 'antd';
import type { AssignmentItemStats } from '@phonics/contracts';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartTheme } from '@/shared/hooks/useChartTheme';
import { t } from '@/shared/i18n';
import { ChartFrame } from '@/shared/ui/ChartFrame';

interface QuestionAccuracyChartProps {
  data: AssignmentItemStats[] | undefined;
  loading: boolean;
  height?: number;
}

/** Cột: độ đúng (%) từng câu theo thứ tự trong phiếu; câu < 50 % tô màu khác */
export function QuestionAccuracyChart({ data, loading, height = 260 }: QuestionAccuracyChartProps) {
  const chart = useChartTheme();
  const rows = (data ?? []).map((it, i) => ({
    ...it,
    label: `${i + 1}`,
    pct: Math.round(it.accuracy * 100),
  }));
  return (
    <ChartFrame loading={loading} hasData={!!data} height={height}>
      {rows.length === 0 || rows.every((r) => r.answered === 0) ? (
        <Empty description={t.assignments.rankingEmpty} />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
            <XAxis dataKey="label" fontSize={12} stroke={chart.axis} tick={{ fill: chart.text }} />
            <YAxis domain={[0, 100]} fontSize={12} stroke={chart.axis} tick={{ fill: chart.text }} />
            <Tooltip
              {...chart.tooltip}
              labelFormatter={(_label, payload) => {
                const row = payload?.[0]?.payload as (typeof rows)[number] | undefined;
                return row ? `${row.sectionTitle} · ${t.questionType[row.type]} · ${row.instruction}` : '';
              }}
              formatter={(value, _name, item) => {
                const row = item.payload as (typeof rows)[number];
                return [
                  `${value}% (${row.correct}/${row.answered}) · ${row.avgScore}/${row.points}`,
                  t.worksheetStats.accuracy,
                ];
              }}
            />
            <Bar dataKey="pct" name={t.worksheetStats.accuracy} radius={[4, 4, 0, 0]}>
              {rows.map((r) => (
                <Cell
                  key={r.worksheetItemId}
                  fill={r.pct < 50 ? chart.colors[1 % chart.colors.length] : chart.colors[0]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
