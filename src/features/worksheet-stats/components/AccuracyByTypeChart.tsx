import { Empty } from 'antd';
import type { TypeAccuracy } from '@phonics/contracts';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartTheme } from '@/shared/hooks/useChartTheme';
import { t } from '@/shared/i18n';
import { ChartFrame } from '@/shared/ui/ChartFrame';
import { formatPercent } from '@/shared/utils/format';

interface AccuracyByTypeChartProps {
  data: TypeAccuracy[] | undefined;
  loading: boolean;
  height?: number;
}

/** Cột ngang: độ đúng (%) theo dạng câu hỏi */
export function AccuracyByTypeChart({ data, loading, height = 260 }: AccuracyByTypeChartProps) {
  const chart = useChartTheme();
  const rows = (data ?? []).map((r) => ({
    ...r,
    label: t.questionType[r.type],
    pct: Math.round(r.accuracy * 100),
  }));
  return (
    <ChartFrame loading={loading} hasData={!!data} height={height}>
      {rows.length === 0 ? (
        <Empty description={t.worksheetStats.noData} />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(height, rows.length * 26)}>
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 24, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              fontSize={12}
              stroke={chart.axis}
              tick={{ fill: chart.text }}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={150}
              fontSize={12}
              stroke={chart.axis}
              tick={{ fill: chart.text }}
            />
            <Tooltip
              {...chart.tooltip}
              formatter={(value, _name, item) => {
                const row = item.payload as (typeof rows)[number];
                return [
                  `${value}% (${row.correct}/${row.answered}) · ${formatPercent(row.avgScoreRatio)}`,
                  t.worksheetStats.accuracy,
                ];
              }}
            />
            <Bar
              dataKey="pct"
              name={t.worksheetStats.accuracy}
              fill={chart.colors[0]}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
