import { Button, Checkbox, Flex, Input, InputNumber, Select, Tag, Typography, theme } from 'antd';
import type { Cell, Direction } from '@phonics/contracts';
import { useState } from 'react';
import { Field, SortableRows } from '@/features/questions/components/editor/editorBits';
import { type EditorProps } from '@/features/questions/components/editor/types';
import { Letter } from '@/features/questions/renderers/common';
import {
  autoArrange,
  buildGrid,
  cellKey,
  entryCells,
  type CrosswordEntry,
} from '@/features/questions/utils/crossword';
import { generateWordSearch, type SearchDirection } from '@/features/questions/utils/wordSearch';
import { MediaUpload } from '@/features/media/components/MediaUpload';
import { t } from '@/shared/i18n';

type CwWord = { number: number; direction: Direction; start: Cell; length: number; clueMediaId?: string };
type CwKey = { number: number; direction: Direction; answer: string };

/** 2. Ô chữ: danh sách từ (đáp án + ảnh gợi ý + vị trí) + lưới xem trước (bấm ô để cho sẵn chữ) */
export function CrosswordEditor({ draft, patch, disabled }: EditorProps) {
  const { token } = theme.useToken();
  const rows = (draft.config.rows as number) ?? 6;
  const cols = (draft.config.cols as number) ?? 6;
  const cwords = (draft.config.words as CwWord[] | undefined) ?? [];
  const keys = (draft.answerKey.words as CwKey[] | undefined) ?? [];
  const prefilled = (draft.config.prefilled as (Cell & { letter: string })[] | undefined) ?? [];
  const entries: CrosswordEntry[] = cwords.map((w) => ({
    number: w.number,
    direction: w.direction,
    start: w.start,
    answer:
      keys.find((k) => k.number === w.number && k.direction === w.direction)?.answer ?? 'x'.repeat(w.length),
  }));
  const { letters, conflicts } = buildGrid(entries, rows, cols);
  const items = cwords.map((w, i) => ({
    id: `${w.number}-${w.direction}-${i}`,
    word: w,
    answer: entries[i].answer,
  }));

  const setAll = (next: { word: CwWord; answer: string }[]) =>
    patch(
      {
        words: next.map((n) => ({
          ...n.word,
          length: Math.max(2, n.answer.replace(/[^a-z]/gi, '').length || n.word.length),
        })),
      },
      { words: next.map((n) => ({ number: n.word.number, direction: n.word.direction, answer: n.answer })) },
    );
  const arrange = () => {
    const placed = autoArrange(
      items.map((it) => ({ number: it.word.number, answer: it.answer })),
      rows,
      cols,
    );
    setAll(
      placed.map((p) => {
        const orig = cwords.find((w) => w.number === p.number)!;
        return {
          word: { ...orig, direction: p.direction, start: p.start, length: p.answer.length },
          answer: p.answer,
        };
      }),
    );
  };
  const togglePrefilled = (c: Cell) => {
    const k = cellKey(c);
    const letter = letters.get(k);
    if (!letter) return;
    const exists = prefilled.some((p) => cellKey(p) === k);
    patch({
      prefilled: exists ? prefilled.filter((p) => cellKey(p) !== k) : [...prefilled, { ...c, letter }],
    });
  };
  const preSet = new Set(prefilled.map(cellKey));
  const numberAt = new Map<string, number>();
  for (const e of entries) numberAt.set(cellKey(entryCells(e)[0]), e.number);

  return (
    <>
      <Flex gap={16}>
        <Field label={t.questions.rows}>
          <InputNumber
            min={2}
            max={12}
            value={rows}
            disabled={disabled}
            onChange={(v) => patch({ rows: v ?? 6 })}
          />
        </Field>
        <Field label={t.questions.cols}>
          <InputNumber
            min={2}
            max={12}
            value={cols}
            disabled={disabled}
            onChange={(v) => patch({ cols: v ?? 6 })}
          />
        </Field>
      </Flex>
      <Field label={t.questions.crosswordWords} required>
        <SortableRows
          items={items}
          onChange={(next) => setAll(next.map((n) => ({ word: n.word, answer: n.answer })))}
          onAdd={() => {
            const number = (cwords.reduce((m, w) => Math.max(m, w.number), 0) || 0) + 1;
            return {
              id: `${number}-across-new`,
              word: { number, direction: 'across' as Direction, start: { r: 0, c: 0 }, length: 2 },
              answer: '',
            } as { id: string; word: CwWord; answer: string };
          }}
          addLabel={t.common.add}
          max={12}
          disabled={disabled}
          render={(it, _i, update) => (
            <Flex gap={8} align="center" wrap>
              <Tag>{it.word.number}</Tag>
              <Input
                value={it.answer}
                maxLength={12}
                disabled={disabled}
                placeholder={t.questions.answer}
                onChange={(e) => update({ answer: e.target.value.toLowerCase().replace(/[^a-z]/g, '') })}
                style={{ width: 130 }}
              />
              <Select<Direction>
                value={it.word.direction}
                disabled={disabled}
                onChange={(d) => update({ word: { ...it.word, direction: d } })}
                options={[
                  { value: 'across', label: t.questions.across },
                  { value: 'down', label: t.questions.down },
                ]}
                style={{ width: 100 }}
              />
              <InputNumber
                min={0}
                max={rows - 1}
                value={it.word.start.r}
                disabled={disabled}
                addonBefore={t.questions.startRow}
                onChange={(v) => update({ word: { ...it.word, start: { ...it.word.start, r: v ?? 0 } } })}
                style={{ width: 120 }}
              />
              <InputNumber
                min={0}
                max={cols - 1}
                value={it.word.start.c}
                disabled={disabled}
                addonBefore={t.questions.startCol}
                onChange={(v) => update({ word: { ...it.word, start: { ...it.word.start, c: v ?? 0 } } })}
                style={{ width: 120 }}
              />
              <MediaUpload
                kind="IMAGE"
                size={48}
                value={it.word.clueMediaId}
                disabled={disabled}
                onChange={(id) => update({ word: { ...it.word, clueMediaId: id } })}
                label={t.questions.clueImage}
              />
            </Flex>
          )}
        />
        <Button size="small" style={{ marginTop: 8 }} disabled={disabled || !items.length} onClick={arrange}>
          {t.questions.autoArrange}
        </Button>
        {conflicts.size > 0 && (
          <Typography.Text type="danger" style={{ display: 'block', marginTop: 4 }}>
            {t.questions.conflicts}
          </Typography.Text>
        )}
      </Field>
      <Field label={t.questions.prefilled}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 32px)`,
            gap: 2,
            padding: 4,
            background: token.colorFillQuaternary,
            borderRadius: token.borderRadius,
            width: 'fit-content',
          }}
        >
          {Array.from({ length: rows * cols }, (_, i) => {
            const c = { r: Math.floor(i / cols), c: i % cols };
            const k = cellKey(c);
            const letter = letters.get(k);
            const pre = preSet.has(k);
            const conflict = conflicts.has(k);
            return (
              <div
                key={k}
                role={letter ? 'button' : undefined}
                onClick={() => !disabled && togglePrefilled(c)}
                style={{
                  position: 'relative',
                  width: 32,
                  height: 32,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: token.borderRadiusSM,
                  background: conflict
                    ? token.colorErrorBg
                    : pre
                      ? token.colorPrimaryBg
                      : letter
                        ? token.colorBgContainer
                        : 'transparent',
                  border: letter ? `1px solid ${pre ? token.colorPrimary : token.colorBorder}` : 'none',
                  cursor: letter && !disabled ? 'pointer' : 'default',
                }}
              >
                {numberAt.has(k) && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 2,
                      fontSize: 8,
                      color: token.colorTextSecondary,
                    }}
                  >
                    {numberAt.get(k)}
                  </span>
                )}
                {letter && <Letter style={{ fontSize: 14, opacity: pre ? 1 : 0.6 }}>{letter}</Letter>}
              </div>
            );
          })}
        </div>
      </Field>
    </>
  );
}

/** 5. Tìm từ trong lưới: word bank (có ảnh) + sinh lưới */
export function WordSearchEditor({ draft, patch, disabled }: EditorProps) {
  const { token } = theme.useToken();
  const rows = (draft.config.rows as number) ?? 6;
  const cols = (draft.config.cols as number) ?? 6;
  const words = (draft.config.words as { word: string; imageMediaId?: string }[] | undefined) ?? [];
  const grid = (draft.config.grid as string[] | undefined) ?? [];
  const placements =
    (draft.answerKey.placements as { word: string; start: Cell; end: Cell }[] | undefined) ?? [];
  const [directions, setDirections] = useState<SearchDirection[]>(['H', 'V']);
  const [failed, setFailed] = useState<string[]>([]);
  const items = words.map((w, i) => ({ id: `w${i}`, ...w }));
  const generate = () => {
    const r = generateWordSearch({ words: words.map((w) => w.word), rows, cols, directions });
    setFailed(r.failed);
    patch({ grid: r.grid }, { placements: r.placements });
  };
  const highlighted = new Set<string>();
  for (const p of placements) {
    const dr = Math.sign(p.end.r - p.start.r);
    const dc = Math.sign(p.end.c - p.start.c);
    const len = Math.max(Math.abs(p.end.r - p.start.r), Math.abs(p.end.c - p.start.c)) + 1;
    for (let i = 0; i < len; i++) highlighted.add(cellKey({ r: p.start.r + dr * i, c: p.start.c + dc * i }));
  }
  return (
    <>
      <Field label={t.questions.wordBank} required>
        <SortableRows
          items={items}
          onChange={(next) =>
            patch({ words: next.map(({ word, imageMediaId }) => ({ word, imageMediaId })) })
          }
          onAdd={() =>
            ({ id: `w${Date.now()}`, word: '' }) as { id: string; word: string; imageMediaId?: string }
          }
          addLabel={t.common.add}
          max={10}
          disabled={disabled}
          render={(w, _i, update) => (
            <Flex gap={12} align="center">
              <MediaUpload
                kind="IMAGE"
                size={48}
                value={w.imageMediaId}
                disabled={disabled}
                onChange={(id) => update({ imageMediaId: id })}
              />
              <Input
                value={w.word}
                maxLength={12}
                disabled={disabled}
                placeholder={t.questions.word}
                onChange={(e) => update({ word: e.target.value.toLowerCase().replace(/[^a-z]/g, '') })}
                style={{ width: 160 }}
              />
            </Flex>
          )}
        />
      </Field>
      <Flex gap={16} align="flex-end" wrap>
        <Field label={t.questions.rows}>
          <InputNumber
            min={3}
            max={12}
            value={rows}
            disabled={disabled}
            onChange={(v) => patch({ rows: v ?? 6 })}
          />
        </Field>
        <Field label={t.questions.cols}>
          <InputNumber
            min={3}
            max={12}
            value={cols}
            disabled={disabled}
            onChange={(v) => patch({ cols: v ?? 6 })}
          />
        </Field>
        <Field label={t.questions.direction}>
          <Checkbox.Group
            value={directions}
            onChange={(v) => setDirections(v as SearchDirection[])}
            options={[
              { value: 'H', label: '→' },
              { value: 'V', label: '↓' },
              { value: 'D', label: '↘' },
            ]}
          />
        </Field>
        <Field label=" ">
          <Button type="primary" disabled={disabled || !words.some((w) => w.word)} onClick={generate}>
            {grid.length ? t.questions.regenerate : t.questions.generateGrid}
          </Button>
        </Field>
      </Flex>
      {failed.length > 0 && <Typography.Text type="danger">{failed.join(', ')}</Typography.Text>}
      {grid.length > 0 && (
        <Field label={t.questions.gridLetters}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 30px)`,
              gap: 2,
              padding: 4,
              background: token.colorFillQuaternary,
              borderRadius: token.borderRadius,
              width: 'fit-content',
            }}
          >
            {grid.flatMap((row, r) =>
              [...row].map((ch, c) => (
                <div
                  key={`${r},${c}`}
                  style={{
                    width: 30,
                    height: 30,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: token.borderRadiusSM,
                    background: highlighted.has(`${r},${c}`) ? token.colorPrimaryBg : token.colorBgContainer,
                  }}
                >
                  <Letter style={{ fontSize: 14 }}>{ch}</Letter>
                </div>
              )),
            )}
          </div>
        </Field>
      )}
    </>
  );
}
