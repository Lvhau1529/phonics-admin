import { Flex, Select, Typography } from 'antd';
import type { AnswerKeyOf, AnswerOf, ConfigOf } from '@phonics/contracts';
import { splitInline } from '@/features/questions/utils/blanks';
import {
  Expected,
  Letter,
  LetterInput,
  MediaImage,
  Tile,
  type RendererProps,
} from '@/features/questions/renderers/common';

/** 9. Khoanh đáp án đúng: ảnh / câu dẫn + 2–4 lựa chọn chữ */
export function MultipleChoiceRenderer({
  config,
  answerKey,
  answer,
  mode,
  onChange,
  parts,
}: RendererProps<ConfigOf<'MULTIPLE_CHOICE'>, AnswerKeyOf<'MULTIPLE_CHOICE'>, AnswerOf<'MULTIPLE_CHOICE'>>) {
  const review = mode === 'review';
  const selected = answer?.optionId ?? null;
  return (
    <Flex vertical gap={8}>
      <Flex gap={12} align="center" wrap>
        <MediaImage id={config.imageMediaId} size={120} />
        {config.prompt && <Typography.Text strong>{config.prompt}</Typography.Text>}
      </Flex>
      <Flex gap={8} wrap>
        {config.options.map((o, i) => (
          <Tile
            key={o.id}
            selected={selected === o.id}
            ok={
              review && selected === o.id
                ? parts?.option
                : review && answerKey?.optionId === o.id
                  ? true
                  : undefined
            }
            onClick={
              mode === 'try' ? () => onChange?.({ type: 'MULTIPLE_CHOICE', optionId: o.id }) : undefined
            }
            style={{ padding: '8px 14px' }}
          >
            <Typography.Text strong>{String.fromCharCode(65 + i)}.</Typography.Text>
            <Typography.Text>{o.text}</Typography.Text>
          </Tile>
        ))}
      </Flex>
    </Flex>
  );
}

/** 6. Gạch hình khác loại */
export function OddOneOutRenderer({
  config,
  answerKey,
  answer,
  mode,
  onChange,
  parts,
}: RendererProps<ConfigOf<'ODD_ONE_OUT'>, AnswerKeyOf<'ODD_ONE_OUT'>, AnswerOf<'ODD_ONE_OUT'>>) {
  const review = mode === 'review';
  const selected = answer?.optionId ?? null;
  return (
    <Flex gap={8} wrap>
      {config.options.map((o) => (
        <Tile
          key={o.id}
          selected={selected === o.id}
          ok={
            review && selected === o.id
              ? parts?.option
              : review && answerKey?.optionId === o.id
                ? true
                : undefined
          }
          onClick={mode === 'try' ? () => onChange?.({ type: 'ODD_ONE_OUT', optionId: o.id }) : undefined}
        >
          <Flex vertical align="center" gap={4}>
            <MediaImage id={o.mediaId} size={88} />
            {o.label && <Typography.Text style={{ fontSize: 12 }}>{o.label}</Typography.Text>}
          </Flex>
        </Tile>
      ))}
    </Flex>
  );
}

/** 7. Quy luật: chuỗi hình + "?" → chọn hình tiếp theo (+ viết từ) */
export function PatternNextRenderer({
  config,
  answerKey,
  answer,
  mode,
  onChange,
  parts,
}: RendererProps<ConfigOf<'PATTERN_NEXT'>, AnswerKeyOf<'PATTERN_NEXT'>, AnswerOf<'PATTERN_NEXT'>>) {
  const review = mode === 'review';
  const editable = mode === 'try';
  const selected = answer?.optionId ?? null;
  const chosen = config.options.find((o) => o.id === selected);
  const set = (patch: Partial<AnswerOf<'PATTERN_NEXT'>>) =>
    onChange?.({ type: 'PATTERN_NEXT', optionId: answer?.optionId ?? null, word: answer?.word, ...patch });
  return (
    <Flex vertical gap={12}>
      <Flex gap={6} align="center" wrap>
        {config.sequence.map((id, i) => (
          <MediaImage key={`${id}-${i}`} id={id} size={64} />
        ))}
        <Tile ok={review ? parts?.option : undefined} selected={!!chosen} style={{ width: 68, height: 68 }}>
          {chosen ? <MediaImage id={chosen.mediaId} size={56} /> : <Letter>?</Letter>}
        </Tile>
      </Flex>
      <Flex gap={8} wrap>
        {config.options.map((o) => (
          <Tile
            key={o.id}
            selected={selected === o.id}
            ok={review && answerKey?.optionId === o.id ? true : undefined}
            onClick={editable ? () => set({ optionId: o.id }) : undefined}
          >
            <Flex vertical align="center" gap={4}>
              <MediaImage id={o.mediaId} size={72} />
              {o.word && <Typography.Text style={{ fontSize: 12 }}>{o.word}</Typography.Text>}
            </Flex>
          </Tile>
        ))}
      </Flex>
      {config.requireWord && (
        <Flex gap={8} align="center">
          <LetterInput
            value={answer?.word ?? ''}
            onChange={editable ? (v) => set({ word: v }) : undefined}
            disabled={!editable}
            ok={review ? parts?.word : undefined}
            width={140}
            maxLength={40}
            placeholder="word"
          />
          {review && answerKey?.word && <Expected>{answerKey.word}</Expected>}
        </Flex>
      )}
    </Flex>
  );
}

/** 12. Hoàn thành câu chuyện: đoạn văn với chỗ trống chọn inline */
export function InlineChoiceRenderer({
  config,
  answerKey,
  answer,
  mode,
  onChange,
  parts,
}: RendererProps<ConfigOf<'INLINE_CHOICE'>, AnswerKeyOf<'INLINE_CHOICE'>, AnswerOf<'INLINE_CHOICE'>>) {
  const review = mode === 'review';
  const editable = mode === 'try';
  const picks = new Map((answer?.picks ?? []).map((p) => [p.blankId, p.option]));
  const correct = new Map((answerKey?.picks ?? []).map((p) => [p.blankId, p.option]));
  const pick = (blankId: string, option: string | null) => {
    const next = new Map(picks);
    next.set(blankId, option);
    onChange?.({
      type: 'INLINE_CHOICE',
      picks: [...next.entries()].map(([id, o]) => ({ blankId: id, option: o })),
    });
  };
  const blanks = new Map(config.blanks.map((b) => [b.id, b]));
  return (
    <Flex vertical gap={12}>
      {config.imageMediaIds.length > 0 && (
        <Flex gap={6} wrap>
          {config.imageMediaIds.map((id, i) => (
            <MediaImage key={`${id}-${i}`} id={id} size={80} />
          ))}
        </Flex>
      )}
      <Typography.Paragraph style={{ fontSize: 16, lineHeight: 2.4, marginBottom: 0 }}>
        {splitInline(config.text).map((part, i) => {
          if (typeof part === 'string') return <span key={i}>{part}</span>;
          const blank = blanks.get(part.blankId);
          const ok = review ? parts?.[part.blankId] : undefined;
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: '0 4px' }}>
              <Select
                size="small"
                value={picks.get(part.blankId) ?? undefined}
                placeholder={blank?.options.join(' / ')}
                disabled={!editable}
                status={ok === false ? 'error' : undefined}
                onChange={(v) => pick(part.blankId, v)}
                options={(blank?.options ?? []).map((o) => ({ value: o, label: o }))}
                style={{ minWidth: 110 }}
              />
              {review && correct.has(part.blankId) && ok === false && (
                <Expected>{correct.get(part.blankId)}</Expected>
              )}
            </span>
          );
        })}
      </Typography.Paragraph>
    </Flex>
  );
}
