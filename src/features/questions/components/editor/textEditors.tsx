import { Button, Flex, Input, InputNumber, Select, Switch, Tag, Typography } from 'antd';
import { blankCount, countBlanks } from '@phonics/contracts';
import {
  AudioField,
  Field,
  ImageField,
  SortableRows,
  WordListInput,
} from '@/features/questions/components/editor/editorBits';
import { newId, type EditorProps } from '@/features/questions/components/editor/types';
import { composeBlanks, parseBlanks } from '@/features/questions/utils/blanks';
import { scrambleWord, shuffleChips } from '@/features/questions/utils/shuffle';
import { Letter, Tile } from '@/features/questions/renderers/common';
import { MediaUpload } from '@/features/media/components/MediaUpload';
import { t } from '@/shared/i18n';

/** 1. Điền âm thiếu, viết từ */
export function MissingSoundEditor({ draft, patch, disabled }: EditorProps) {
  const pattern = (draft.config.pattern as string) ?? '';
  const letters = (draft.answerKey.letters as string[] | undefined) ?? [];
  const blanks = blankCount(pattern);
  return (
    <>
      <ImageField
        value={draft.config.imageMediaId as string | undefined}
        onChange={(id) => patch({ imageMediaId: id })}
        disabled={disabled}
        required
      />
      <AudioField
        value={draft.config.audioMediaId as string | undefined}
        onChange={(id) => patch({ audioMediaId: id })}
        disabled={disabled}
      />
      <Field label={t.questions.pattern} required hint={t.questions.patternHint}>
        <Input
          value={pattern}
          maxLength={30}
          disabled={disabled}
          placeholder="m-a-_"
          onChange={(e) => {
            const next = e.target.value.toLowerCase();
            const n = blankCount(next);
            patch({ pattern: next }, { letters: Array.from({ length: n }, (_, i) => letters[i] ?? '') });
          }}
        />
      </Field>
      <Field label={t.questions.missingLetters} required>
        <Flex gap={8} wrap>
          {Array.from({ length: blanks }, (_, i) => (
            <Input
              key={i}
              value={letters[i] ?? ''}
              maxLength={3}
              disabled={disabled}
              style={{ width: 64, textAlign: 'center' }}
              onChange={(e) => {
                const next = [...letters];
                next[i] = e.target.value.toLowerCase();
                patch(undefined, { letters: next });
              }}
            />
          ))}
          {blanks === 0 && <Typography.Text type="secondary">{t.questions.patternHint}</Typography.Text>}
        </Flex>
      </Field>
      <Field label={t.questions.word} required>
        <Input
          value={(draft.answerKey.word as string) ?? ''}
          maxLength={40}
          disabled={disabled}
          onChange={(e) => patch(undefined, { word: e.target.value })}
          style={{ width: 200 }}
        />
      </Field>
    </>
  );
}

/** 3. Sắp xếp chữ cái thành từ */
export function UnscrambleWordEditor({ draft, patch, disabled }: EditorProps) {
  const word = (draft.answerKey.word as string) ?? '';
  const scrambled = (draft.config.scrambled as string) ?? '';
  const accepted = (draft.answerKey.accepted as string[] | undefined) ?? [];
  return (
    <>
      <ImageField
        value={draft.config.imageMediaId as string | undefined}
        onChange={(id) => patch({ imageMediaId: id })}
        disabled={disabled}
        required
      />
      <Field label={t.questions.word} required>
        <Input
          value={word}
          maxLength={12}
          disabled={disabled}
          style={{ width: 200 }}
          onChange={(e) => {
            const w = e.target.value.toLowerCase();
            patch({ scrambled: scrambleWord(w) }, { word: w });
          }}
        />
      </Field>
      <Field label={t.questions.scrambled} required>
        <Flex gap={8} align="center">
          <Input
            value={scrambled}
            maxLength={12}
            disabled={disabled}
            style={{ width: 160, letterSpacing: 4 }}
            onChange={(e) => patch({ scrambled: e.target.value.toLowerCase() })}
          />
          <Button
            size="small"
            disabled={disabled || !word}
            onClick={() => patch({ scrambled: scrambleWord(word) })}
          >
            {t.questions.reshuffle}
          </Button>
        </Flex>
      </Field>
      <Field label={t.questions.acceptedOrders}>
        <WordListInput
          value={accepted}
          disabled={disabled}
          onChange={(v) => patch(undefined, { accepted: v })}
        />
      </Field>
    </>
  );
}

/** 4. Tô chữ cái, viết từ */
export function PickLettersEditor({ draft, patch, disabled }: EditorProps) {
  const letters = (draft.config.letters as { id: string; letter: string }[] | undefined) ?? [];
  const picked = (draft.answerKey.letterIds as string[] | undefined) ?? [];
  const word = (draft.answerKey.word as string) ?? '';
  const setLetters = (items: { id: string; letter: string }[]) =>
    patch({ letters: items }, { letterIds: picked.filter((id) => items.some((l) => l.id === id)) });
  const fillFromWord = () => {
    const base = [...word.toLowerCase().replace(/[^a-z]/g, '')];
    const distractors = 'bdfgjklmpqrstvwxyz'.split('').filter((c) => !base.includes(c));
    const count = Math.max(6, base.length + 2);
    const all = [...base];
    while (all.length < Math.min(9, count))
      all.push(distractors[Math.floor(Math.random() * distractors.length)]);
    const shuffled = shuffleChips(all);
    const items = shuffled.map((l, i) => ({ id: `l${i + 1}`, letter: l }));
    // letterIds theo thứ tự chữ trong từ (chọn lần lượt ô có chữ chưa dùng)
    const used = new Set<string>();
    const ids = base.map((ch) => {
      const hit = items.find((it) => it.letter === ch && !used.has(it.id));
      if (hit) used.add(hit.id);
      return hit?.id ?? '';
    });
    patch({ letters: items }, { letterIds: ids.filter(Boolean) });
  };
  const toggle = (id: string) =>
    patch(undefined, { letterIds: picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id] });
  return (
    <>
      <ImageField
        value={draft.config.imageMediaId as string | undefined}
        onChange={(id) => patch({ imageMediaId: id })}
        disabled={disabled}
        required
      />
      <Field label={t.questions.word} required>
        <Flex gap={8}>
          <Input
            value={word}
            maxLength={9}
            disabled={disabled}
            style={{ width: 160 }}
            onChange={(e) => patch(undefined, { word: e.target.value.toLowerCase() })}
          />
          <Button size="small" disabled={disabled || !word} onClick={fillFromWord}>
            {t.questions.generateGrid}
          </Button>
        </Flex>
      </Field>
      <Field label={t.questions.letterGrid} required hint={t.questions.pickLetterIds}>
        <Flex gap={8} wrap>
          {letters.map((l, i) => {
            const order = picked.indexOf(l.id);
            return (
              <Flex key={l.id} vertical align="center" gap={4}>
                <Tile
                  selected={order >= 0}
                  badge={order >= 0 ? order + 1 : undefined}
                  onClick={disabled ? undefined : () => toggle(l.id)}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                >
                  <Letter>{l.letter}</Letter>
                </Tile>
                <Input
                  value={l.letter}
                  maxLength={3}
                  disabled={disabled}
                  size="small"
                  style={{ width: 48, textAlign: 'center' }}
                  onChange={(e) =>
                    setLetters(
                      letters.map((x, j) => (j === i ? { ...x, letter: e.target.value.toLowerCase() } : x)),
                    )
                  }
                />
              </Flex>
            );
          })}
          <Button
            size="small"
            disabled={disabled || letters.length >= 9}
            onClick={() => setLetters([...letters, { id: newId('l', letters), letter: '' }])}
          >
            +
          </Button>
          <Button
            size="small"
            disabled={disabled || letters.length <= 4}
            onClick={() => setLetters(letters.slice(0, -1))}
          >
            −
          </Button>
        </Flex>
      </Field>
    </>
  );
}

/** 10. Điền từ từ word bank: nhập câu với [[từ]] */
export function FillBlankEditor({ draft, patch, disabled }: EditorProps) {
  const wordBank = (draft.config.wordBank as string[] | undefined) ?? [];
  const sentences =
    (draft.config.sentences as { id: string; text: string; imageMediaId?: string }[] | undefined) ?? [];
  const blanks =
    (draft.answerKey.blanks as { sentenceId: string; index: number; word: string }[] | undefined) ?? [];
  const rawOf = (s: { id: string; text: string }) =>
    composeBlanks(
      s.text,
      blanks
        .filter((b) => b.sentenceId === s.id)
        .sort((a, b) => a.index - b.index)
        .map((b) => b.word),
    );
  const setRaw = (id: string, raw: string) => {
    const parsed = parseBlanks(raw);
    patch(
      { sentences: sentences.map((s) => (s.id === id ? { ...s, text: parsed.text } : s)) },
      {
        blanks: [
          ...blanks.filter((b) => b.sentenceId !== id),
          ...parsed.answers.map((word, index) => ({ sentenceId: id, index, word })),
        ],
      },
    );
  };
  const bankSet = new Set(wordBank.map((w) => w.toLowerCase()));
  const items = sentences.map((s) => ({ ...s, raw: rawOf(s) }));
  return (
    <>
      <Field label={t.questions.wordBank} required hint={t.questions.wordBankHint}>
        <WordListInput value={wordBank} disabled={disabled} onChange={(v) => patch({ wordBank: v })} />
      </Field>
      <Field label={t.questions.sentences} required hint={t.questions.sentenceHint}>
        <SortableRows
          items={items}
          onChange={(next) => patch({ sentences: next.map(({ raw: _raw, ...s }) => s) })}
          onAdd={() => ({ id: newId('s', sentences), text: '', raw: '' }) as (typeof items)[number]}
          addLabel={t.questions.addSentence}
          max={10}
          disabled={disabled}
          render={(s) => {
            const missing = blanks.filter((b) => b.sentenceId === s.id && !bankSet.has(b.word.toLowerCase()));
            return (
              <Flex gap={12} align="flex-start">
                <MediaUpload
                  kind="IMAGE"
                  size={56}
                  value={s.imageMediaId}
                  disabled={disabled}
                  onChange={(id) =>
                    patch({
                      sentences: sentences.map((x) => (x.id === s.id ? { ...x, imageMediaId: id } : x)),
                    })
                  }
                />
                <Flex vertical gap={4} style={{ flex: 1 }}>
                  <Input
                    value={s.raw}
                    maxLength={240}
                    disabled={disabled}
                    placeholder="I [[hear]] the children."
                    onChange={(e) => setRaw(s.id, e.target.value)}
                  />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {countBlanks(s.text)} ___
                    {missing.length > 0 && (
                      <>
                        {' · '}
                        <Tag color="warning">
                          {t.questions.notInBank}: {missing.map((m) => m.word).join(', ')}
                        </Tag>
                      </>
                    )}
                  </Typography.Text>
                </Flex>
              </Flex>
            );
          }}
        />
      </Field>
    </>
  );
}

/** 11. Sắp xếp từ thành câu */
export function WordOrderEditor({ draft, patch, disabled }: EditorProps) {
  const words = (draft.config.words as string[] | undefined) ?? [];
  const accepted = (draft.answerKey.accepted as number[][] | undefined) ?? [];
  const sentence = accepted[0]?.map((i) => words[i]).join(' ') ?? '';
  const extras = accepted.slice(1).map((o) => o.map((i) => words[i]).join(' '));
  /** Câu → thẻ (tách theo khoảng trắng), xáo thứ tự, primary = index theo câu */
  const applySentence = (value: string) => {
    const tokens = value.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return patch({ words: [] }, { accepted: [] });
    const shuffled = shuffleChips(tokens);
    const used = new Set<number>();
    const primary = tokens.map((tk) => {
      const idx = shuffled.findIndex((w, i) => w === tk && !used.has(i));
      used.add(idx);
      return idx;
    });
    patch({ words: shuffled }, { accepted: [primary] });
  };
  const toOrder = (value: string): number[] | null => {
    const tokens = value.trim().split(/\s+/).filter(Boolean);
    const used = new Set<number>();
    const order = tokens.map((tk) => {
      const idx = words.findIndex((w, i) => w === tk && !used.has(i));
      used.add(idx);
      return idx;
    });
    return order.length === words.length && !order.includes(-1) ? order : null;
  };
  const extraItems = extras.map((text, i) => ({ id: `a${i}`, text }));
  return (
    <>
      <ImageField
        value={draft.config.imageMediaId as string | undefined}
        onChange={(id) => patch({ imageMediaId: id })}
        disabled={disabled}
      />
      <Field label={t.questions.sentence} required>
        <Input
          defaultValue={sentence}
          key={sentence}
          maxLength={200}
          disabled={disabled}
          placeholder="We see the nest."
          onBlur={(e) => applySentence(e.target.value)}
          onPressEnter={(e) => applySentence(e.currentTarget.value)}
        />
      </Field>
      <Field label={t.questions.chips}>
        <Flex gap={6} wrap align="center">
          {words.map((w, i) => (
            <Tag key={`${w}-${i}`} style={{ fontSize: 14 }}>
              {w}
            </Tag>
          ))}
          <Button
            size="small"
            disabled={disabled || words.length < 2}
            onClick={() => applySentence(sentence)}
          >
            {t.questions.reshuffle}
          </Button>
          <Select
            size="small"
            allowClear
            placeholder={t.questions.endPunctuation}
            value={draft.config.endPunctuation as string | undefined}
            disabled={disabled}
            onChange={(v) => patch({ endPunctuation: v })}
            options={['.', '?', '!'].map((p) => ({ value: p, label: p }))}
            style={{ width: 120 }}
          />
        </Flex>
      </Field>
      <Field label={t.questions.acceptedOrders}>
        <SortableRows
          items={extraItems}
          onChange={(items) => {
            const orders = items.map((it) => toOrder(it.text)).filter((o): o is number[] => !!o);
            patch(undefined, { accepted: [accepted[0] ?? [], ...orders].filter((o) => o.length) });
          }}
          onAdd={() => ({ id: `a${Date.now()}`, text: '' })}
          addLabel={t.questions.addAccepted}
          max={4}
          disabled={disabled}
          render={(it, i) => (
            <Input
              defaultValue={it.text}
              key={it.text}
              disabled={disabled}
              placeholder={sentence}
              onBlur={(e) => {
                const order = toOrder(e.target.value);
                const next = [...accepted];
                if (order) next[i + 1] = order;
                else next.splice(i + 1, 1);
                patch(undefined, { accepted: next });
              }}
            />
          )}
        />
      </Field>
    </>
  );
}

/** 8. Đánh số hình */
export function NumberPicturesEditor({ draft, patch, disabled }: EditorProps) {
  const words = (draft.config.words as { number: number; word: string }[] | undefined) ?? [];
  const images = (draft.config.images as { id: string; mediaId?: string }[] | undefined) ?? [];
  const numbers = (draft.answerKey.numbers as { imageId: string; number: number }[] | undefined) ?? [];
  const wordItems = words.map((w) => ({ id: `w${w.number}`, ...w }));
  const setWords = (items: { id: string; number: number; word: string }[]) =>
    patch({ words: items.map((it, i) => ({ number: i + 1, word: it.word })) });
  const setNumber = (imageId: string, number: number | null) =>
    patch(undefined, {
      numbers: [...numbers.filter((n) => n.imageId !== imageId), ...(number ? [{ imageId, number }] : [])],
    });
  return (
    <>
      <Field label={t.questions.words} required>
        <SortableRows
          items={wordItems}
          onChange={setWords}
          onAdd={() => ({ id: `w${words.length + 1}`, number: words.length + 1, word: '' })}
          addLabel={t.common.add}
          max={12}
          disabled={disabled}
          render={(w, i, update) => (
            <Flex gap={8} align="center">
              <Tag>{i + 1}</Tag>
              <Input
                value={w.word}
                maxLength={40}
                disabled={disabled}
                placeholder={t.questions.word}
                onChange={(e) => update({ word: e.target.value })}
                style={{ width: 200 }}
              />
            </Flex>
          )}
        />
      </Field>
      <Field label={t.questions.images} required hint={t.questions.imageNumber}>
        <SortableRows
          items={images}
          onChange={(items) =>
            patch(
              { images: items },
              { numbers: numbers.filter((n) => items.some((im) => im.id === n.imageId)) },
            )
          }
          onAdd={() => ({ id: newId('img', images) }) as { id: string; mediaId?: string }}
          addLabel={t.questions.addImage}
          max={12}
          disabled={disabled}
          render={(im, _i, update) => (
            <Flex gap={12} align="center">
              <MediaUpload
                kind="IMAGE"
                size={64}
                value={im.mediaId}
                disabled={disabled}
                onChange={(id) => update({ mediaId: id })}
              />
              <Select
                allowClear
                placeholder="#"
                value={numbers.find((n) => n.imageId === im.id)?.number}
                disabled={disabled}
                onChange={(v) => setNumber(im.id, v ?? null)}
                options={words.map((w) => ({ value: w.number, label: `${w.number}. ${w.word}` }))}
                style={{ width: 180 }}
              />
            </Flex>
          )}
        />
      </Field>
      <AudioField
        label={t.questions.listenMode}
        value={draft.config.audioMediaId as string | undefined}
        onChange={(id) => patch({ audioMediaId: id })}
        disabled={disabled}
      />
      <Flex gap={24} wrap>
        <Field label={t.questions.writeWord}>
          <Switch
            checked={!!draft.config.writeWord}
            disabled={disabled}
            onChange={(v) => patch({ writeWord: v })}
          />
        </Field>
        <Field label={t.questions.showWordBank}>
          <Switch
            checked={draft.config.showWordBank !== false}
            disabled={disabled}
            onChange={(v) => patch({ showWordBank: v })}
          />
        </Field>
      </Flex>
      <InputNumber style={{ display: 'none' }} />
    </>
  );
}
