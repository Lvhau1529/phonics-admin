import { Empty } from 'antd';
import type { PointsTimelineBucket } from '@phonics/contracts';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartTheme } from '@/shared/hooks/useChartTheme';
import { t } from '@/shared/i18n';
import { ChartFrame } from '@/shared/ui/ChartFrame';
import { formatBucket } from '@/shared/utils/format';

interface PointsTimelineChartProps {
  data: PointsTimelineBucket[] | undefined;
  loading: boolean;
  height?: number;
}

/** Điểm của lớp theo ngày / tuần: GAME, BONUS và tổng (giữ biểu đồ cũ khi refetch, mờ nhẹ) */
export function PointsTimelineChart({ data, loading, height = 280 }: PointsTimelineChartProps) {
  const chart = useChartTheme();
  const rows = (data ?? []).map((b) => ({ ...b, label: formatBucket(b.bucketStart) }));
  return (
    <ChartFrame loading={loading} hasData={!!data} height={height}>
      {rows.length === 0 ? (
        <Empty description={t.common.noData} />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
            <XAxis dataKey="label" fontSize={12} stroke={chart.axis} tick={{ fill: chart.text }} />
            <YAxis fontSize={12} allowDecimals={false} stroke={chart.axis} tick={{ fill: chart.text }} />
            <Tooltip {...chart.tooltip} />
            <Legend {...chart.legend} />
            <Line
              type="monotone"
              dataKey="total"
              name={t.dashboard.totalPoints}
              stroke={chart.colors[0]}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="GAME"
              name={t.pointKind.GAME}
              stroke={chart.colors[3]}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="BONUS"
              name={t.pointKind.BONUS}
              stroke={chart.colors[1]}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
