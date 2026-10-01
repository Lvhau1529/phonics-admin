import { Empty } from 'antd';
import type { TopStudent } from '@phonics/contracts';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartTheme } from '@/shared/hooks/useChartTheme';
import { t } from '@/shared/i18n';
import { ChartFrame } from '@/shared/ui/ChartFrame';

interface TopStudentsChartProps {
  data: TopStudent[] | undefined;
  loading: boolean;
  height?: number;
}

/** Cột ngang: top học sinh theo điểm trong khoảng thời gian */
export function TopStudentsChart({ data, loading, height = 280 }: TopStudentsChartProps) {
  const chart = useChartTheme();
  const rows = data ?? [];
  return (
    <ChartFrame loading={loading} hasData={!!data} height={height}>
      {rows.length === 0 ? (
        <Empty description={t.common.noData} />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(height, rows.length * 28)}>
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 24, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
            <XAxis
              type="number"
              fontSize={12}
              allowDecimals={false}
              stroke={chart.axis}
              tick={{ fill: chart.text }}
            />
            <YAxis
              type="category"
              dataKey="displayName"
              width={110}
              fontSize={12}
              stroke={chart.axis}
              tick={{ fill: chart.text }}
            />
            <Tooltip {...chart.tooltip} formatter={(value) => [value, t.common.points]} />
            <Bar dataKey="points" name={t.common.points} fill={chart.colors[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
