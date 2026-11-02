import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Segmented, Spin, Typography, theme } from 'antd';
import { useEffect, useRef, useState } from 'react';
import {
  gradePreview,
  parseGameMessage,
  PREVIEW_CHANNEL,
  type AdminMessage,
  type StudentPreviewContent,
} from '@/features/questions/utils/studentPreview';
import { GAME_ORIGIN, GAME_PREVIEW_URL, GAME_URL } from '@/shared/config';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useElementWidth } from '@/shared/hooks/useElementWidth';
import { t } from '@/shared/i18n';

type Device = 'phone' | 'tablet';

/** Kích thước màn (CSS px) của thiết bị giả lập; khung co lại cho vừa chỗ */
const DEVICES: Record<Device, { width: number; height: number; radius: number }> = {
  phone: { width: 390, height: 780, radius: 28 },
  tablet: { width: 768, height: 1024, radius: 20 },
};

/** Không nhận `ready` sau chừng này → app học sinh không chạy / sai cấu hình */
const CONNECT_TIMEOUT_MS = 10_000;

const post = (frame: HTMLIFrameElement | null, message: AdminMessage) =>
  frame?.contentWindow?.postMessage(message, GAME_ORIGIN);

interface StudentAppPreviewProps extends StudentPreviewContent {
  /** Chiều cao tối đa của khung (px) — vd khi nằm trong cột Affix */
  maxHeight?: number;
}

/**
 * Nhúng màn `#/preview` của app học sinh (iframe) để xem câu / phiếu đúng như học sinh thấy: admin gửi nội dung
 * qua postMessage (gửi lại khi nháp đổi), app gửi câu trả lời khi bấm CHECK → admin chấm bằng checkAnswer.
 */
export function StudentAppPreview({ title, items, media, maxHeight = 720 }: StudentAppPreviewProps) {
  const { token } = theme.useToken();
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const boxWidth = useElementWidth(box);
  const [device, setDevice] = useState<Device>('phone');
  const [status, setStatus] = useState<'connecting' | 'ready' | 'unreachable'>('connecting');
  const [attempt, setAttempt] = useState(0);
  // Gõ liên tục trong editor → chỉ gửi khi dừng tay
  const content = useDebouncedValue(JSON.stringify({ title, items, media }), 250);
  const latest = useRef<StudentPreviewContent>({ title, items, media });

  useEffect(() => {
    latest.current = JSON.parse(content) as StudentPreviewContent;
    if (status === 'ready')
      post(frame.current, { channel: PREVIEW_CHANNEL, type: 'load', ...latest.current });
  }, [content, status]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== GAME_ORIGIN || event.source !== frame.current?.contentWindow) return;
      const message = parseGameMessage(event.data);
      if (!message) return;
      if (message.type === 'ready') {
        // App mở / tải lại: luôn gửi lại nội dung (effect trên chỉ chạy khi status đổi)
        setStatus('ready');
        post(frame.current, { channel: PREVIEW_CHANNEL, type: 'load', ...latest.current });
        return;
      }
      post(frame.current, {
        channel: PREVIEW_CHANNEL,
        type: 'results',
        results: gradePreview(latest.current.items, message.answers),
      });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (status !== 'connecting') return undefined;
    const timer = setTimeout(() => setStatus('unreachable'), CONNECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status, attempt]);

  const reload = () => {
    setStatus('connecting');
    setAttempt((n) => n + 1);
  };

  const size = DEVICES[device];
  const scale = boxWidth > 0 ? Math.min(1, boxWidth / size.width, maxHeight / size.height) : 0;

  return (
    <Flex vertical gap={8}>
      <Flex justify="space-between" align="center" gap={8} wrap>
        <Segmented<Device>
          size="small"
          value={device}
          onChange={setDevice}
          options={[
            { value: 'phone', label: t.questions.studentAppPhone },
            { value: 'tablet', label: t.questions.studentAppTablet },
          ]}
        />
        <Button size="small" type="text" icon={<ReloadOutlined />} onClick={reload}>
          {t.questions.studentAppReload}
        </Button>
      </Flex>
      {status === 'unreachable' && (
        <Alert
          type="warning"
          showIcon
          message={t.questions.studentAppUnreachable(GAME_URL)}
          action={
            <Button size="small" onClick={reload}>
              {t.common.retry}
            </Button>
          }
        />
      )}
      <div ref={box} style={{ width: '100%' }}>
        <div
          style={{
            position: 'relative',
            width: size.width * scale,
            height: size.height * scale,
            margin: '0 auto',
            overflow: 'hidden',
            borderRadius: size.radius * scale,
            border: `6px solid ${token.colorBorder}`,
            boxSizing: 'content-box',
            background: token.colorFillTertiary,
          }}
        >
          {scale > 0 && (
            <iframe
              key={attempt}
              ref={frame}
              title={t.questions.studentApp}
              src={GAME_PREVIEW_URL}
              allow="microphone; autoplay"
              style={{
                width: size.width,
                height: size.height,
                border: 0,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            />
          )}
          {status === 'connecting' && (
            <Flex
              align="center"
              justify="center"
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            >
              <Spin />
            </Flex>
          )}
        </div>
      </div>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {t.questions.studentAppHint}
      </Typography.Text>
    </Flex>
  );
}
