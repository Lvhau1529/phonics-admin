import { Empty } from 'antd';
import type { WeekBucket } from '@phonics/contracts';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartTheme } from '@/shared/hooks/useChartTheme';
import { t } from '@/shared/i18n';
import { ChartFrame } from '@/shared/ui/ChartFrame';
import { formatBucket } from '@/shared/utils/format';

interface WeeklyTrendChartProps {
  data: WeekBucket[] | undefined;
  loading: boolean;
  height?: number;
}

/** Đường: điểm TB (%) theo tuần (tuần không có bài chấm → đứt đoạn) */
export function WeeklyTrendChart({ data, loading, height = 260 }: WeeklyTrendChartProps) {
  const chart = useChartTheme();
  const rows = (data ?? []).map((w) => ({
    ...w,
    label: formatBucket(w.weekStart),
    pct: w.avgPercent === null ? null : Math.round(w.avgPercent * 100),
  }));
  return (
    <ChartFrame loading={loading} hasData={!!data} height={height}>
      {rows.length === 0 ? (
        <Empty description={t.worksheetStats.noData} />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={rows} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
            <XAxis dataKey="label" fontSize={12} stroke={chart.axis} tick={{ fill: chart.text }} />
            <YAxis domain={[0, 100]} fontSize={12} stroke={chart.axis} tick={{ fill: chart.text }} />
            <Tooltip
              {...chart.tooltip}
              formatter={(value, _name, item) => {
                const row = item.payload as (typeof rows)[number];
                return [`${value}% · ${row.submissions}/${row.assignments}`, t.worksheetStats.avgPercent];
              }}
            />
            <Line
              type="monotone"
              dataKey="pct"
              name={t.worksheetStats.avgPercent}
              stroke={chart.colors[0]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
