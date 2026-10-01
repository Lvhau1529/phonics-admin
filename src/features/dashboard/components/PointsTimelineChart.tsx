import { Empty, Spin } from 'antd';
import type { PointsTimelineBucket } from '@phonics/contracts';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { t } from '@/shared/i18n/vi';
import { CHART_COLORS } from '@/shared/theme';
import { formatBucket } from '@/shared/utils/format';

interface PointsTimelineChartProps {
  data: PointsTimelineBucket[] | undefined;
  loading: boolean;
  height?: number;
}

/** Điểm của lớp theo ngày / tuần: GAME, BONUS và tổng */
export function PointsTimelineChart({ data, loading, height = 280 }: PointsTimelineChartProps) {
  if (loading && !data) return <Spin style={{ display: 'block', margin: '48px auto' }} />;
  if (!data || data.length === 0) return <Empty description={t.common.noData} />;
  const rows = data.map((b) => ({ ...b, label: formatBucket(b.bucketStart) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis fontSize={12} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="total"
          name={t.dashboard.totalPoints}
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          dot={false}
        />
        <Line type="monotone" dataKey="GAME" name={t.pointKind.GAME} stroke={CHART_COLORS[3]} dot={false} />
        <Line type="monotone" dataKey="BONUS" name={t.pointKind.BONUS} stroke={CHART_COLORS[1]} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
