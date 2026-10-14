import { Flex, Select, Typography } from 'antd';
import { useRef } from 'react';
import { t } from '@/shared/i18n';

interface AudioPlayerProps {
  src: string | undefined;
  /** Cho phép đổi tốc độ (chấm bài nghe chậm) */
  speed?: boolean;
  style?: React.CSSProperties;
}

const SPEEDS = [0.5, 0.75, 1, 1.25];

/** Trình phát audio: `<audio controls>` của trình duyệt + chọn tốc độ (không thêm thư viện) */
export function AudioPlayer({ src, speed = false, style }: AudioPlayerProps) {
  const ref = useRef<HTMLAudioElement>(null);
  if (!src) return <Typography.Text type="secondary">{t.media.noFile}</Typography.Text>;
  return (
    <Flex align="center" gap={8} wrap style={style}>
      <audio ref={ref} controls preload="metadata" src={src} style={{ height: 36, maxWidth: '100%' }} />
      {speed && (
        <Select
          size="small"
          defaultValue={1}
          aria-label={t.media.speed}
          options={SPEEDS.map((s) => ({ value: s, label: `${s}x` }))}
          onChange={(v) => {
            if (ref.current) ref.current.playbackRate = v;
          }}
          style={{ width: 80 }}
        />
      )}
    </Flex>
  );
}
