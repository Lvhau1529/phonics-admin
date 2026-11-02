import { Empty } from 'antd';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TuitionMonthModel } from '@/features/tuition/models/TuitionModel';
import { useChartTheme } from '@/shared/hooks/useChartTheme';
import { t } from '@/shared/i18n';
import { ChartFrame } from '@/shared/ui/ChartFrame';
import { formatCompact, formatMoney } from '@/shared/utils/format';

interface TuitionMonthsChartProps {
  months: TuitionMonthModel[] | undefined;
  loading: boolean;
  height?: number;
}

/** Học phí theo tháng: cột chồng đã xác nhận + chờ xác nhận */
export function TuitionMonthsChart({ months, loading, height = 300 }: TuitionMonthsChartProps) {
  const chart = useChartTheme();
  const rows = (months ?? []).map((m) => ({
    label: m.shortLabel,
    confirmed: m.confirmedTotal,
    pending: m.pendingTotal,
  }));
  const empty = rows.every((r) => r.confirmed + r.pending === 0);
  return (
    <ChartFrame loading={loading} hasData={!!months} height={height}>
      {empty ? (
        <Empty description={t.common.noData} />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
            <XAxis dataKey="label" fontSize={12} stroke={chart.axis} tick={{ fill: chart.text }} />
            <YAxis
              fontSize={12}
              width={56}
              stroke={chart.axis}
              tick={{ fill: chart.text }}
              tickFormatter={(v: number) => formatCompact(v)}
            />
            <Tooltip {...chart.tooltip} formatter={(v) => formatMoney(Number(v))} />
            <Legend {...chart.legend} />
            <Bar
              dataKey="confirmed"
              name={t.tuition.confirmed}
              stackId="total"
              fill={chart.colors[0]}
              maxBarSize={48}
            />
            <Bar
              dataKey="pending"
              name={t.tuition.pending}
              stackId="total"
              fill={chart.colors[1]}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
