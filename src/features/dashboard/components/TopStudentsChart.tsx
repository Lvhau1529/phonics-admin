import { Empty, Spin } from 'antd';
import type { TopStudent } from '@phonics/contracts';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { t } from '@/shared/i18n/vi';
import { CHART_COLORS } from '@/shared/theme';

interface TopStudentsChartProps {
  data: TopStudent[] | undefined;
  loading: boolean;
  height?: number;
}

/** Cột ngang: top học sinh theo điểm trong khoảng thời gian */
export function TopStudentsChart({ data, loading, height = 280 }: TopStudentsChartProps) {
  if (loading && !data) return <Spin style={{ display: 'block', margin: '48px auto' }} />;
  if (!data || data.length === 0) return <Empty description={t.common.noData} />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(height, data.length * 28)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
        <XAxis type="number" fontSize={12} allowDecimals={false} />
        <YAxis type="category" dataKey="displayName" width={110} fontSize={12} />
        <Tooltip formatter={(value) => [value, t.common.points]} />
        <Bar dataKey="points" name={t.common.points} fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
