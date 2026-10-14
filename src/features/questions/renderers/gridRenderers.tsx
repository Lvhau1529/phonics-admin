import { Flex, Tag, Typography, theme } from 'antd';
import type { AnswerKeyOf, AnswerOf, Cell, ConfigOf } from '@phonics/contracts';
import { useState } from 'react';
import {
  Expected,
  Letter,
  LetterInput,
  MediaImage,
  type RendererProps,
} from '@/features/questions/renderers/common';
import { cellKey, entryCells } from '@/features/questions/utils/crossword';
import { cellsBetween } from '@/features/questions/utils/wordSearch';
import { t } from '@/shared/i18n';

/** 2. Ô chữ: lưới ô nhập + gợi ý ảnh theo số */
export function CrosswordRenderer({
  config,
  answerKey,
  answer,
  mode,
  onChange,
  parts,
}: RendererProps<ConfigOf<'CROSSWORD'>, AnswerKeyOf<'CROSSWORD'>, AnswerOf<'CROSSWORD'>>) {
  const { token } = theme.useToken();
  const review = mode === 'review';
  const editable = mode === 'try';
  const prefilled = new Map(config.prefilled.map((p) => [cellKey(p), p.letter]));
  const given = new Map((answer?.cells ?? []).map((c) => [cellKey(c), c.letter]));
  const keyWords = new Map((answerKey?.words ?? []).map((w) => [`${w.number}-${w.direction}`, w.answer]));
  // Ô nào thuộc từ nào (để tô màu đúng / sai theo từ khi review) + số đầu từ
  const cellWords = new Map<string, string[]>();
  const numberAt = new Map<string, number>();
  for (const w of config.words) {
    const cells = entryCells({ direction: w.direction, start: w.start, answer: 'x'.repeat(w.length) });
    const id = `${w.number}-${w.direction}`;
    cells.forEach((c, i) => {
      cellWords.set(cellKey(c), [...(cellWords.get(cellKey(c)) ?? []), id]);
      if (i === 0) numberAt.set(cellKey(c), w.number);
    });
  }
  const setCell = (c: Cell, letter: string) => {
    const next = new Map(given);
    const k = cellKey(c);
    if (letter) next.set(k, letter.slice(-1));
    else next.delete(k);
    onChange?.({
      type: 'CROSSWORD',
      cells: [...next.entries()].map(([k2, l]) => {
        const [r, cc] = k2.split(',').map(Number);
        return { r, c: cc, letter: l };
      }),
    });
  };
  const cellOk = (k: string): boolean | undefined => {
    if (!review || !parts) return undefined;
    const ids = cellWords.get(k) ?? [];
    if (!ids.length) return undefined;
    return ids.every((id) => parts[id]);
  };
  return (
    <Flex gap={16} align="flex-start" wrap>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.cols}, 36px)`,
          gap: 2,
          padding: 4,
          background: token.colorFillQuaternary,
          borderRadius: token.borderRadius,
        }}
      >
        {Array.from({ length: config.rows * config.cols }, (_, i) => {
          const c = { r: Math.floor(i / config.cols), c: i % config.cols };
          const k = cellKey(c);
          const active = cellWords.has(k);
          if (!active) return <div key={k} style={{ width: 36, height: 36 }} />;
          const pre = prefilled.get(k);
          return (
            <div key={k} style={{ position: 'relative', width: 36, height: 36 }}>
              {numberAt.has(k) && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 2,
                    fontSize: 9,
                    zIndex: 1,
                    color: token.colorTextSecondary,
                  }}
                >
                  {numberAt.get(k)}
                </span>
              )}
              <LetterInput
                value={pre ?? given.get(k) ?? ''}
                disabled={!editable || !!pre}
                ok={pre ? undefined : cellOk(k)}
                width={36}
                maxLength={1}
                onChange={editable && !pre ? (v) => setCell(c, v) : undefined}
              />
            </div>
          );
        })}
      </div>
      <Flex vertical gap={6}>
        {(['across', 'down'] as const).map((dir) => {
          const list = config.words.filter((w) => w.direction === dir).sort((a, b) => a.number - b.number);
          if (!list.length) return null;
          return (
            <Flex key={dir} vertical gap={4}>
              <Typography.Text strong>
                {dir === 'across' ? t.questions.across : t.questions.down}
              </Typography.Text>
              <Flex gap={8} wrap>
                {list.map((w) => {
                  const id = `${w.number}-${w.direction}`;
                  const ok = review ? parts?.[id] : undefined;
                  return (
                    <Flex key={id} vertical align="center" gap={2}>
                      <Tag color={ok === true ? 'success' : ok === false ? 'error' : undefined}>
                        {w.number}
                      </Tag>
                      <MediaImage id={w.clueMediaId} size={56} />
                      {review && ok === false && keyWords.has(id) && <Expected>{keyWords.get(id)}</Expected>}
                    </Flex>
                  );
                })}
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </Flex>
  );
}

/** 5. Tìm từ trong lưới: bấm ô đầu rồi ô cuối để khoanh */
export function WordSearchRenderer({
  config,
  answerKey,
  answer,
  mode,
  onChange,
  parts,
}: RendererProps<ConfigOf<'WORD_SEARCH'>, AnswerKeyOf<'WORD_SEARCH'>, AnswerOf<'WORD_SEARCH'>>) {
  const { token } = theme.useToken();
  const review = mode === 'review';
  const editable = mode === 'try';
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const found = answer?.found ?? [];
  const foundCells = new Map<string, boolean | undefined>();
  for (const f of found) {
    const cells = cellsBetween(f.start, f.end) ?? [];
    for (const c of cells) foundCells.set(cellKey(c), review ? parts?.[f.word] : undefined);
  }
  // Review: tô ô của từ chưa tìm được theo placement đúng (màu xám)
  const missedCells = new Set<string>();
  if (review && answerKey) {
    for (const p of answerKey.placements) {
      if (parts?.[p.word]) continue;
      for (const c of cellsBetween(p.start, p.end) ?? []) missedCells.add(cellKey(c));
    }
  }
  const click = (c: Cell) => {
    if (!editable) return;
    if (!anchor) return setAnchor(c);
    const cells = cellsBetween(anchor, c);
    setAnchor(null);
    if (!cells) return;
    const word = cells.map((x) => config.grid[x.r][x.c]).join('');
    const reversed = [...word].reverse().join('');
    const match = config.words.find(
      (w) => w.word.toLowerCase() === word || w.word.toLowerCase() === reversed,
    );
    if (!match) return;
    const entry = { word: match.word, start: anchor, end: c };
    onChange?.({ type: 'WORD_SEARCH', found: [...found.filter((f) => f.word !== match.word), entry] });
  };
  const foundWords = new Set(found.map((f) => f.word.toLowerCase()));
  return (
    <Flex gap={16} align="flex-start" wrap>
      <Flex vertical gap={8}>
        <Flex gap={8} wrap>
          {config.words.map((w) => {
            const done = foundWords.has(w.word.toLowerCase());
            const ok = review ? parts?.[w.word] : undefined;
            return (
              <Flex key={w.word} vertical align="center" gap={2}>
                <MediaImage id={w.imageMediaId} size={48} />
                <Tag
                  color={ok === true || (!review && done) ? 'success' : ok === false ? 'error' : undefined}
                >
                  <span style={{ textDecoration: done ? 'line-through' : undefined }}>{w.word}</span>
                </Tag>
              </Flex>
            );
          })}
        </Flex>
      </Flex>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.cols}, 34px)`,
          gap: 2,
          padding: 4,
          background: token.colorFillQuaternary,
          borderRadius: token.borderRadius,
        }}
      >
        {config.grid.flatMap((row, r) =>
          [...row].map((ch, c) => {
            const k = cellKey({ r, c });
            const isAnchor = anchor?.r === r && anchor?.c === c;
            const ok = foundCells.get(k);
            const inFound = foundCells.has(k);
            const bg =
              ok === true
                ? token.colorSuccessBg
                : ok === false
                  ? token.colorErrorBg
                  : inFound || isAnchor
                    ? token.colorPrimaryBg
                    : missedCells.has(k)
                      ? token.colorWarningBg
                      : token.colorBgContainer;
            return (
              <div
                key={k}
                role={editable ? 'button' : undefined}
                onClick={() => click({ r, c })}
                style={{
                  width: 34,
                  height: 34,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: token.borderRadiusSM,
                  background: bg,
                  cursor: editable ? 'pointer' : 'default',
                  border: isAnchor
                    ? `2px solid ${token.colorPrimary}`
                    : `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Letter style={{ fontSize: 16 }}>{ch}</Letter>
              </div>
            );
          }),
        )}
      </div>
    </Flex>
  );
}
