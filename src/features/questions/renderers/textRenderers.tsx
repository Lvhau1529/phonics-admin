import { Flex, Select, Tag, Typography } from 'antd';
import type { AnswerKeyOf, AnswerOf, ConfigOf } from '@phonics/contracts';
import { splitBlanks } from '@/features/questions/utils/blanks';
import {
  Expected,
  Letter,
  LetterInput,
  MediaAudio,
  MediaImage,
  Tile,
  type RendererProps,
} from '@/features/questions/renderers/common';
import { t } from '@/shared/i18n';

/** 1. Điền âm thiếu rồi viết từ: `m-a-_` */
export function MissingSoundRenderer({
  config,
  answerKey,
  answer,
  mode,
  onChange,
  parts,
}: RendererProps<ConfigOf<'MISSING_SOUND'>, AnswerKeyOf<'MISSING_SOUND'>, AnswerOf<'MISSING_SOUND'>>) {
  const review = mode === 'review';
  const editable = mode === 'try';
  const segments = config.pattern.split('-');
  const letters = answer?.letters ?? [];
  // Chỉ số ô trống của từng đoạn (tính trước, không đếm trong lúc render JSX)
  const blankIndex: number[] = [];
  let blankCount = 0;
  for (const seg of segments) blankIndex.push(seg === '_' || seg.includes('_') ? blankCount++ : -1);
  const set = (patch: Partial<AnswerOf<'MISSING_SOUND'>>) =>
    onChange?.({ type: 'MISSING_SOUND', letters, word: answer?.word ?? '', ...patch });
  return (
    <Flex gap={16} align="center" wrap>
      <MediaImage id={config.imageMediaId} size={96} />
      <MediaAudio id={config.audioMediaId} />
      <Flex gap={4} align="center">
        {segments.map((seg, i) => {
          const idx = blankIndex[i];
          if (idx >= 0) {
            return (
              <LetterInput
                key={i}
                value={letters[idx] ?? ''}
                disabled={!editable}
                ok={review ? parts?.letters : undefined}
                onChange={
                  editable
                    ? (v) => {
                        const next = [...letters];
                        next[idx] = v;
                        set({ letters: next });
                      }
                    : undefined
                }
              />
            );
          }
          return <Letter key={i}>{seg}</Letter>;
        })}
        <Letter style={{ margin: '0 8px' }}>→</Letter>
        <LetterInput
          value={answer?.word ?? ''}
          disabled={!editable}
          ok={review ? parts?.word : undefined}
          width={140}
          maxLength={40}
          placeholder="word"
          onChange={editable ? (v) => set({ word: v }) : undefined}
        />
      </Flex>
      {review && answerKey && (
        <Expected>
          {answerKey.letters.join(', ')} → {answerKey.word}
        </Expected>
      )}
    </Flex>
  );
}

/** 3. Sắp xếp chữ cái thành từ: bấm chữ để ghép */
export function UnscrambleWordRenderer({
  config,
  answerKey,
  answer,
  mode,
  onChange,
  parts,
}: RendererProps<ConfigOf<'UNSCRAMBLE_WORD'>, AnswerKeyOf<'UNSCRAMBLE_WORD'>, AnswerOf<'UNSCRAMBLE_WORD'>>) {
  const review = mode === 'review';
  const editable = mode === 'try';
  const word = answer?.word ?? '';
  // Chữ còn trong "kho" = chữ xáo trừ đi chữ đã dùng (theo số lần)
  const remaining = [...config.scrambled];
  for (const ch of word) {
    const i = remaining.indexOf(ch);
    if (i >= 0) remaining.splice(i, 1);
  }
  return (
    <Flex gap={16} align="center" wrap>
      <MediaImage id={config.imageMediaId} size={96} />
      <Flex vertical gap={8}>
        <Flex gap={6}>
          {remaining.map((ch, i) => (
            <Tile
              key={`${ch}-${i}`}
              onClick={editable ? () => onChange?.({ type: 'UNSCRAMBLE_WORD', word: word + ch }) : undefined}
            >
              <Letter>{ch}</Letter>
            </Tile>
          ))}
          {remaining.length === 0 && !editable && !word && <Letter>{config.scrambled}</Letter>}
        </Flex>
        <Flex gap={6} align="center">
          <Letter>→</Letter>
          <Tile
            ok={review ? parts?.word : undefined}
            onClick={
              editable && word
                ? () => onChange?.({ type: 'UNSCRAMBLE_WORD', word: word.slice(0, -1) })
                : undefined
            }
            style={{ minWidth: 120 }}
          >
            <Letter>{word || ' '}</Letter>
          </Tile>
          {review && answerKey && <Expected>{answerKey.word}</Expected>}
        </Flex>
      </Flex>
    </Flex>
  );
}

/** 4. Tô chữ cái tạo từ rồi viết từ */
export function PickLettersRenderer({
  config,
  answerKey,
  answer,
  mode,
  onChange,
  parts,
}: RendererProps<ConfigOf<'PICK_LETTERS'>, AnswerKeyOf<'PICK_LETTERS'>, AnswerOf<'PICK_LETTERS'>>) {
  const review = mode === 'review';
  const editable = mode === 'try';
  const picked = answer?.letterIds ?? [];
  const set = (patch: Partial<AnswerOf<'PICK_LETTERS'>>) =>
    onChange?.({ type: 'PICK_LETTERS', letterIds: picked, word: answer?.word ?? '', ...patch });
  const toggle = (id: string) =>
    set({ letterIds: picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id] });
  return (
    <Flex gap={16} align="center" wrap>
      <MediaImage id={config.imageMediaId} size={96} />
      <Flex vertical gap={8}>
        <Flex gap={6} wrap style={{ maxWidth: 3 * 56 }}>
          {config.letters.map((l) => {
            const order = picked.indexOf(l.id);
            const inKey = review && answerKey?.letterIds.includes(l.id);
            return (
              <Tile
                key={l.id}
                selected={order >= 0}
                ok={review && order >= 0 ? parts?.letters : review && inKey ? true : undefined}
                badge={order >= 0 ? order + 1 : undefined}
                onClick={editable ? () => toggle(l.id) : undefined}
                style={{ width: 48, height: 48, borderRadius: 24 }}
              >
                <Letter>{l.letter}</Letter>
              </Tile>
            );
          })}
        </Flex>
        <Flex gap={8} align="center">
          <LetterInput
            value={answer?.word ?? ''}
            disabled={!editable}
            ok={review ? parts?.word : undefined}
            width={140}
            maxLength={40}
            placeholder="word"
            onChange={editable ? (v) => set({ word: v }) : undefined}
          />
          {review && answerKey && <Expected>{answerKey.word}</Expected>}
        </Flex>
      </Flex>
    </Flex>
  );
}

/** 10. Điền từ từ word bank */
export function FillBlankRenderer({
  config,
  answerKey,
  answer,
  mode,
  onChange,
  parts,
}: RendererProps<
  ConfigOf<'FILL_BLANK_WORD_BANK'>,
  AnswerKeyOf<'FILL_BLANK_WORD_BANK'>,
  AnswerOf<'FILL_BLANK_WORD_BANK'>
>) {
  const review = mode === 'review';
  const editable = mode === 'try';
  const given = new Map((answer?.blanks ?? []).map((b) => [`${b.sentenceId}:${b.index}`, b.word]));
  const expected = new Map((answerKey?.blanks ?? []).map((b) => [`${b.sentenceId}:${b.index}`, b.word]));
  const setBlank = (sentenceId: string, index: number, word: string | undefined) => {
    const next = new Map(given);
    if (word) next.set(`${sentenceId}:${index}`, word);
    else next.delete(`${sentenceId}:${index}`);
    onChange?.({
      type: 'FILL_BLANK_WORD_BANK',
      blanks: [...next.entries()].map(([k, w]) => {
        const [sid, idx] = k.split(':');
        return { sentenceId: sid, index: Number(idx), word: w };
      }),
    });
  };
  return (
    <Flex vertical gap={12}>
      <Flex gap={6} wrap>
        {config.wordBank.map((w) => (
          <Tag key={w} style={{ fontSize: 14, padding: '2px 10px' }}>
            {w}
          </Tag>
        ))}
      </Flex>
      {config.sentences.map((s, si) => {
        let blankIndex = -1;
        return (
          <Flex key={s.id} gap={12} align="center" wrap>
            <MediaImage id={s.imageMediaId} size={56} />
            <Typography.Text style={{ fontSize: 16, lineHeight: 2.2 }}>
              <span style={{ marginRight: 6 }}>{si + 1}.</span>
              {splitBlanks(s.text).map((part, i) => {
                if (part !== null) return <span key={i}>{part}</span>;
                blankIndex += 1;
                const idx = blankIndex;
                const key = `${s.id}:${idx}`;
                const ok = review ? parts?.[key] : undefined;
                return (
                  <span
                    key={i}
                    style={{ display: 'inline-flex', gap: 4, alignItems: 'center', margin: '0 4px' }}
                  >
                    <Select
                      size="small"
                      allowClear
                      value={given.get(key)}
                      disabled={!editable}
                      status={ok === false ? 'error' : undefined}
                      onChange={(v) => setBlank(s.id, idx, v)}
                      options={config.wordBank.map((w) => ({ value: w, label: w }))}
                      style={{ minWidth: 110 }}
                      placeholder="___"
                    />
                    {review && ok === false && expected.has(key) && <Expected>{expected.get(key)}</Expected>}
                  </span>
                );
              })}
            </Typography.Text>
          </Flex>
        );
      })}
    </Flex>
  );
}

/** 11. Sắp xếp từ thành câu: bấm thẻ để xếp, bấm trong câu để bỏ */
export function WordOrderRenderer({
  config,
  answerKey,
  answer,
  mode,
  onChange,
  parts,
}: RendererProps<ConfigOf<'WORD_ORDER'>, AnswerKeyOf<'WORD_ORDER'>, AnswerOf<'WORD_ORDER'>>) {
  const review = mode === 'review';
  const editable = mode === 'try';
  const order = answer?.order ?? [];
  const remaining = config.words.map((_, i) => i).filter((i) => !order.includes(i));
  const expectedSentence = answerKey?.accepted[0]?.map((i) => config.words[i]).join(' ');
  return (
    <Flex gap={16} align="flex-start" wrap>
      <MediaImage id={config.imageMediaId} size={96} />
      <Flex vertical gap={10} style={{ flex: 1, minWidth: 240 }}>
        <Flex gap={6} wrap>
          {remaining.map((i) => (
            <Tile
              key={i}
              onClick={editable ? () => onChange?.({ type: 'WORD_ORDER', order: [...order, i] }) : undefined}
              style={{ padding: '6px 12px' }}
            >
              <Letter style={{ fontSize: 16 }}>{config.words[i]}</Letter>
            </Tile>
          ))}
        </Flex>
        <Flex gap={6} wrap align="center">
          <Letter>→</Letter>
          {order.map((i, pos) => (
            <Tile
              key={`${i}-${pos}`}
              ok={review ? parts?.order : undefined}
              selected
              onClick={
                editable
                  ? () => onChange?.({ type: 'WORD_ORDER', order: order.filter((_, p) => p !== pos) })
                  : undefined
              }
              style={{ padding: '6px 12px' }}
            >
              <Letter style={{ fontSize: 16 }}>{config.words[i]}</Letter>
            </Tile>
          ))}
          {order.length === 0 && (
            <Typography.Text type="secondary">
              {'_'.repeat(12)}
              {config.endPunctuation ?? ''}
            </Typography.Text>
          )}
        </Flex>
        {review && expectedSentence && <Expected>{expectedSentence}</Expected>}
      </Flex>
    </Flex>
  );
}

/** 8. Đánh số hình (nghe / đọc) rồi viết từ */
export function NumberPicturesRenderer({
  config,
  answerKey,
  answer,
  mode,
  onChange,
  parts,
}: RendererProps<ConfigOf<'NUMBER_PICTURES'>, AnswerKeyOf<'NUMBER_PICTURES'>, AnswerOf<'NUMBER_PICTURES'>>) {
  const review = mode === 'review';
  const editable = mode === 'try';
  const numbers = new Map((answer?.numbers ?? []).map((n) => [n.imageId, n.number]));
  const words = new Map((answer?.words ?? []).map((w) => [w.imageId, w.word]));
  const expected = new Map((answerKey?.numbers ?? []).map((n) => [n.imageId, n.number]));
  const wordBy = new Map(config.words.map((w) => [w.number, w.word]));
  const emit = (n: Map<string, number | null>, w: Map<string, string>) =>
    onChange?.({
      type: 'NUMBER_PICTURES',
      numbers: config.images.map((im) => ({ imageId: im.id, number: n.get(im.id) ?? null })),
      words: config.writeWord
        ? config.images.map((im) => ({ imageId: im.id, word: w.get(im.id) ?? '' }))
        : undefined,
    });
  const showBank = config.showWordBank || !config.audioMediaId;
  return (
    <Flex vertical gap={12}>
      <Flex gap={12} align="center" wrap>
        <MediaAudio id={config.audioMediaId} />
        {showBank && (
          <Flex gap={6} wrap>
            {config.words.map((w) => (
              <Tag key={w.number} style={{ fontSize: 14 }}>
                {w.number}. {w.word}
              </Tag>
            ))}
          </Flex>
        )}
      </Flex>
      <Flex gap={10} wrap>
        {config.images.map((im) => {
          const ok = review ? parts?.[im.id] : undefined;
          const okWord = review ? parts?.[`${im.id}:word`] : undefined;
          return (
            <Tile key={im.id} ok={ok} style={{ flexDirection: 'column', padding: 8 }}>
              <Select
                size="small"
                allowClear
                value={numbers.get(im.id) ?? undefined}
                disabled={!editable}
                onChange={(v) => {
                  const next = new Map(numbers);
                  if (v === undefined) next.delete(im.id);
                  else next.set(im.id, v);
                  emit(next, words);
                }}
                options={config.words.map((w) => ({ value: w.number, label: String(w.number) }))}
                style={{ width: 64 }}
                placeholder="#"
              />
              <MediaImage id={im.mediaId} size={80} />
              {config.writeWord && (
                <LetterInput
                  value={words.get(im.id) ?? ''}
                  disabled={!editable}
                  ok={okWord}
                  width={96}
                  maxLength={40}
                  placeholder="word"
                  onChange={(v) => {
                    const next = new Map(words);
                    next.set(im.id, v);
                    emit(numbers, next);
                  }}
                />
              )}
              {review && ok === false && expected.has(im.id) && (
                <Expected>
                  {expected.get(im.id)}
                  {config.writeWord ? ` ${wordBy.get(expected.get(im.id)!) ?? ''}` : ''}
                </Expected>
              )}
            </Tile>
          );
        })}
      </Flex>
      {!showBank && !review && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t.questions.listenMode}
        </Typography.Text>
      )}
    </Flex>
  );
}
