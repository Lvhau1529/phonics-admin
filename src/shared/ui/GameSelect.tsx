import { Select, type SelectProps } from 'antd';
import { GAME_IDS, type GameId } from '@phonics/contracts';
import { t } from '@/shared/i18n/vi';

type GameSelectProps = Omit<SelectProps<GameId>, 'options'>;

/** Chọn game trong catalog (id cố định trong contracts) */
export function GameSelect(props: GameSelectProps) {
  return (
    <Select<GameId>
      allowClear
      placeholder={t.common.selectGame}
      style={{ minWidth: 160 }}
      {...props}
      options={GAME_IDS.map((id) => ({ value: id, label: t.gameName[id] }))}
    />
  );
}
