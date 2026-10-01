import { Flex, Typography } from 'antd';
import type { GameId } from '@phonics/contracts';
import { useState } from 'react';
import { RankingTable } from '@/features/classes/components/RankingTable';
import { useClassRanking } from '@/features/classes/hooks';
import { ExportButton } from '@/features/reports/components/ExportButton';
import { t } from '@/shared/i18n/vi';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { GameSelect } from '@/shared/ui/GameSelect';
import { RangePicker } from '@/shared/ui/RangePicker';
import { DEFAULT_RANGE, rangeParams, type RangeValue } from '@/shared/utils/range';

interface ClassReportsTabProps {
  classId: string | undefined;
  /** Ẩn bảng xem trước (trang Báo cáo tự hiện) */
  withPreview?: boolean;
}

/** Chọn khoảng thời gian + game → xuất xếp hạng (xlsx / pdf), sổ điểm (xlsx); xem trước xếp hạng */
export function ClassReportsTab({ classId, withPreview = true }: ClassReportsTabProps) {
  const [range, setRange] = useState<RangeValue>(DEFAULT_RANGE);
  const [gameId, setGameId] = useState<GameId>();
  const query = { ...rangeParams(range), gameId };
  const ranking = useClassRanking(withPreview ? classId : undefined, query);

  return (
    <Flex vertical gap={12}>
      <Flex gap={8} wrap>
        <RangePicker value={range} onChange={setRange} />
        <GameSelect value={gameId} onChange={setGameId} />
      </Flex>
      <Flex gap={8} wrap>
        <ExportButton kind="ranking-xlsx" classId={classId} query={query} type="primary" />
        <ExportButton kind="ranking-pdf" classId={classId} query={query} />
        <ExportButton kind="points-xlsx" classId={classId} query={query} />
      </Flex>
      {withPreview && classId && (
        <>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t.reports.preview}
          </Typography.Title>
          <ErrorAlert error={ranking.error} onRetry={() => void ranking.refetch()} />
          <RankingTable items={ranking.data?.items} loading={ranking.isFetching} />
        </>
      )}
    </Flex>
  );
}
