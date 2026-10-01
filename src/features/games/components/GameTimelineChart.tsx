import { Empty, Flex, Segmented } from 'antd';
import type { Bucket, GameId } from '@phonics/contracts';
import { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useGameTimeline } from '@/features/games/hooks';
import { useChartTheme } from '@/shared/hooks/useChartTheme';
import { t } from '@/shared/i18n';
import { ChartFrame } from '@/shared/ui/ChartFrame';
import { RangePicker } from '@/shared/ui/RangePicker';
import { DEFAULT_RANGE, rangeParams, type RangeValue } from '@/shared/utils/range';
import { formatBucket } from '@/shared/utils/format';

interface GameTimelineChartProps {
  gameId: GameId;
  height?: number;
  /** Mặc định 30 ngày gần nhất khi không truyền */
  initialRange?: RangeValue;
}

/** Lượt xem / lượt chơi / người chơi của một game theo ngày hoặc tuần, có chọn khoảng thời gian */
export function GameTimelineChart({ gameId, height = 280, initialRange }: GameTimelineChartProps) {
  const [range, setRange] = useState<RangeValue>(initialRange ?? { ...DEFAULT_RANGE, range: 'month' });
  const [bucket, setBucket] = useState<Bucket>('day');
  const { data, isFetching } = useGameTimeline(gameId, { ...rangeParams(range), bucket });
  const chart = useChartTheme();
  const rows = (data ?? []).map((b) => ({ ...b, label: formatBucket(b.bucketStart) }));

  return (
    <Flex vertical gap={12}>
      <Flex gap={8} wrap>
        <RangePicker value={range} onChange={setRange} size="small" />
        <Segmented<Bucket>
          size="small"
          value={bucket}
          onChange={setBucket}
          options={[
            { value: 'day', label: t.common.bucketDay },
            { value: 'week', label: t.common.bucketWeek },
          ]}
        />
      </Flex>
      <ChartFrame loading={isFetching} hasData={!!data} height={height}>
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
                dataKey="views"
                name={t.dashboard.views}
                stroke={chart.colors[3]}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="plays"
                name={t.dashboard.plays}
                stroke={chart.colors[0]}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="uniquePlayers"
                name={t.dashboard.uniquePlayers}
                stroke={chart.colors[2]}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartFrame>
    </Flex>
  );
}
