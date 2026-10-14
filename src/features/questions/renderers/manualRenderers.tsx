import { AudioOutlined, EditOutlined } from '@ant-design/icons';
import { Alert, Flex, Image, Tag, Typography, theme } from 'antd';
import type { AnswerKeyOf, AnswerOf, ConfigOf } from '@phonics/contracts';
import { useMediaMap } from '@/features/media/mediaMap';
import { AudioPlayer } from '@/features/media/components/AudioPlayer';
import { Letter, MediaAudio, MediaImage, type RendererProps } from '@/features/questions/renderers/common';
import { t } from '@/shared/i18n';

/** Ghi âm của học sinh (review) hoặc ô giữ chỗ (preview / try) */
function RecordingBlock({
  mediaId,
  mode,
}: {
  mediaId: string | null | undefined;
  mode: RendererProps<unknown, unknown, unknown>['mode'];
}) {
  const ref = useMediaMap().get(mediaId);
  if (mode !== 'review') {
    return (
      <Tag icon={<AudioOutlined />} color="processing">
        {t.media.recording}
      </Tag>
    );
  }
  if (!ref) return <Typography.Text type="secondary">{t.media.noRecording}</Typography.Text>;
  return (
    <Flex align="center" gap={8}>
      <AudioOutlined />
      <AudioPlayer src={ref.url} speed />
    </Flex>
  );
}

function TraceBlock({
  mediaId,
  mode,
}: {
  mediaId: string | null | undefined;
  mode: RendererProps<unknown, unknown, unknown>['mode'];
}) {
  const { token } = theme.useToken();
  const ref = useMediaMap().get(mediaId);
  if (mode !== 'review') {
    return (
      <Tag icon={<EditOutlined />} color="processing">
        {t.media.trace}
      </Tag>
    );
  }
  if (!ref) return <Typography.Text type="secondary">{t.media.noTrace}</Typography.Text>;
  return (
    <Image
      src={ref.url}
      height={120}
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
      }}
    />
  );
}

/** 13. Tô chữ và đọc to: câu với phần tô nét đứt; review hiện PNG + ghi âm */
export function TraceAndReadRenderer({
  config,
  answerKey,
  answer,
  mode,
}: RendererProps<ConfigOf<'TRACE_AND_READ'>, AnswerKeyOf<'TRACE_AND_READ'>, AnswerOf<'TRACE_AND_READ'>>) {
  const { token } = theme.useToken();
  const idx = config.sentence.indexOf(config.tracePart);
  const before = idx >= 0 ? config.sentence.slice(0, idx) : config.sentence;
  const after = idx >= 0 ? config.sentence.slice(idx + config.tracePart.length) : '';
  return (
    <Flex vertical gap={10}>
      <Flex gap={12} align="center" wrap>
        <MediaImage id={config.imageMediaId} size={80} />
        <Typography.Text style={{ fontSize: 22, fontFamily: 'Andika, "Comic Sans MS", sans-serif' }}>
          {before}
          <span
            style={{
              color: 'transparent',
              WebkitTextStroke: `1px ${token.colorTextTertiary}`,
              letterSpacing: 2,
              borderBottom: `1px dashed ${token.colorBorder}`,
            }}
          >
            {idx >= 0 ? config.tracePart : ''}
          </span>
          {after}
        </Typography.Text>
        <MediaAudio id={config.modelAudioMediaId} />
      </Flex>
      <Flex gap={16} wrap>
        {config.requireTrace && <TraceBlock mediaId={answer?.traceMediaId} mode={mode} />}
        {config.requireRecording && <RecordingBlock mediaId={answer?.recordingMediaId} mode={mode} />}
      </Flex>
      {mode !== 'review' && <Alert type="info" showIcon message={t.questions.manualPreview} />}
      {mode === 'review' && answerKey?.rubric && (
        <Typography.Text type="secondary">
          {t.questions.rubric}: {answerKey.rubric}
        </Typography.Text>
      )}
    </Flex>
  );
}

/** 14. Nói / đọc từ: ảnh + câu nhắc; review hiện ghi âm */
export function SpeakRenderer({
  config,
  answerKey,
  answer,
  mode,
}: RendererProps<ConfigOf<'SPEAK'>, AnswerKeyOf<'SPEAK'>, AnswerOf<'SPEAK'>>) {
  return (
    <Flex vertical gap={10}>
      <Flex gap={12} align="center" wrap>
        <MediaImage id={config.imageMediaId} size={96} />
        <Letter>{config.prompt}</Letter>
        <MediaAudio id={config.modelAudioMediaId} />
      </Flex>
      <RecordingBlock mediaId={answer?.recordingMediaId} mode={mode} />
      {mode !== 'review' && <Alert type="info" showIcon message={t.questions.manualPreview} />}
      {mode === 'review' && answerKey?.rubric && (
        <Typography.Text type="secondary">
          {t.questions.rubric}: {answerKey.rubric}
        </Typography.Text>
      )}
    </Flex>
  );
}
