import { Empty } from 'antd';
import type { ScoreBucket } from '@phonics/contracts';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartTheme } from '@/shared/hooks/useChartTheme';
import { t } from '@/shared/i18n';
import { ChartFrame } from '@/shared/ui/ChartFrame';

interface ScoreDistributionChartProps {
  data: ScoreBucket[] | undefined;
  loading: boolean;
  height?: number;
}

/** Cột: số học sinh theo khoảng điểm (%) */
export function ScoreDistributionChart({ data, loading, height = 240 }: ScoreDistributionChartProps) {
  const chart = useChartTheme();
  const rows = data ?? [];
  const empty = rows.every((r) => r.count === 0);
  return (
    <ChartFrame loading={loading} hasData={!!data} height={height}>
      {empty ? (
        <Empty description={t.assignments.rankingEmpty} />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
            <XAxis dataKey="label" fontSize={12} stroke={chart.axis} tick={{ fill: chart.text }} />
            <YAxis allowDecimals={false} fontSize={12} stroke={chart.axis} tick={{ fill: chart.text }} />
            <Tooltip {...chart.tooltip} formatter={(value) => [value, t.worksheetStats.students]} />
            <Bar
              dataKey="count"
              name={t.worksheetStats.students}
              fill={chart.colors[0]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
