import { Flex } from 'antd';
import type { GameId } from '@phonics/contracts';
import { useState } from 'react';
import { RankingTable } from '@/features/classes/components/RankingTable';
import { useClassRanking } from '@/features/classes/hooks';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { GameSelect } from '@/shared/ui/GameSelect';
import { RangePicker } from '@/shared/ui/RangePicker';
import { DEFAULT_RANGE, rangeParams, type RangeValue } from '@/shared/utils/range';

interface ClassRankingTabProps {
  classId: string;
}

/** Tab Xếp hạng: lọc khoảng thời gian + game */
export function ClassRankingTab({ classId }: ClassRankingTabProps) {
  const [range, setRange] = useState<RangeValue>(DEFAULT_RANGE);
  const [gameId, setGameId] = useState<GameId>();
  const ranking = useClassRanking(classId, { ...rangeParams(range), gameId });

  return (
    <>
      <Flex gap={8} wrap style={{ marginBottom: 12 }}>
        <RangePicker value={range} onChange={setRange} />
        <GameSelect value={gameId} onChange={setGameId} />
      </Flex>
      <ErrorAlert error={ranking.error} onRetry={() => void ranking.refetch()} />
      <RankingTable items={ranking.data?.items} loading={ranking.isFetching} />
    </>
  );
}
