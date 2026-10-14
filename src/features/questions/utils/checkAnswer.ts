import type { QuestionAnswer, QuestionAnswerKey, QuestionConfig } from '@phonics/contracts';

/**
 * Bản sao gọn luật chấm của API (modules/submissions/grading) để "Thử làm" ở editor cho kết quả ngay.
 * Chỉ để hiển thị — điểm thật do API tính khi học sinh nộp.
 */
export interface CheckResult {
  fraction: number;
  correct: boolean;
  /** Phần nào đúng (tuỳ dạng), client tô màu */
  parts: Record<string, boolean>;
}

const norm = (s: string | null | undefined): string =>
  (s ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}']/gu, '')
    .trim();
const same = (a: string | null | undefined, b: string | null | undefined) =>
  norm(a) !== '' && norm(a) === norm(b);
const ratio = (ok: number, total: number) => (total > 0 ? ok / total : 0);
const done = (fraction: number, parts: Record<string, boolean>): CheckResult => ({
  fraction,
  correct: fraction === 1,
  parts,
});
const NONE: CheckResult = { fraction: 0, correct: false, parts: {} };

export function checkAnswer(
  config: QuestionConfig,
  key: QuestionAnswerKey,
  answer: QuestionAnswer | null | undefined,
): CheckResult {
  if (!answer || answer.type !== config.type || key.type !== config.type) return NONE;
  switch (config.type) {
    case 'MISSING_SOUND': {
      if (key.type !== 'MISSING_SOUND' || answer.type !== 'MISSING_SOUND') return NONE;
      const letters = key.letters.every((l, i) => same(answer.letters[i], l));
      const word = same(answer.word, key.word);
      return done((letters ? 0.5 : 0) + (word ? 0.5 : 0), { letters, word });
    }
    case 'CROSSWORD': {
      if (key.type !== 'CROSSWORD' || answer.type !== 'CROSSWORD') return NONE;
      const given = new Map(answer.cells.map((c) => [`${c.r},${c.c}`, c.letter.toLowerCase()]));
      const pre = new Map(config.prefilled.map((p) => [`${p.r},${p.c}`, p.letter.toLowerCase()]));
      const parts: Record<string, boolean> = {};
      let ok = 0;
      for (const kw of key.words) {
        const cw = config.words.find((w) => w.number === kw.number && w.direction === kw.direction);
        const word = norm(kw.answer);
        let correct = !!cw && word.length === cw.length;
        for (let i = 0; cw && i < cw.length && correct; i++) {
          const r = cw.direction === 'down' ? cw.start.r + i : cw.start.r;
          const c = cw.direction === 'across' ? cw.start.c + i : cw.start.c;
          if ((pre.get(`${r},${c}`) ?? given.get(`${r},${c}`) ?? '') !== word[i]) correct = false;
        }
        parts[`${kw.number}-${kw.direction}`] = correct;
        if (correct) ok++;
      }
      return done(ratio(ok, key.words.length), parts);
    }
    case 'UNSCRAMBLE_WORD': {
      if (key.type !== 'UNSCRAMBLE_WORD' || answer.type !== 'UNSCRAMBLE_WORD') return NONE;
      const correct = [key.word, ...key.accepted].some((w) => same(answer.word, w));
      return done(correct ? 1 : 0, { word: correct });
    }
    case 'PICK_LETTERS': {
      if (key.type !== 'PICK_LETTERS' || answer.type !== 'PICK_LETTERS') return NONE;
      const expected = new Set(key.letterIds);
      const got = new Set(answer.letterIds);
      const letters = expected.size === got.size && [...expected].every((id) => got.has(id));
      const word = same(answer.word, key.word);
      return done((letters ? 0.5 : 0) + (word ? 0.5 : 0), { letters, word });
    }
    case 'WORD_SEARCH': {
      if (key.type !== 'WORD_SEARCH' || answer.type !== 'WORD_SEARCH') return NONE;
      const sameCell = (a: { r: number; c: number }, b: { r: number; c: number }) =>
        a.r === b.r && a.c === b.c;
      const parts: Record<string, boolean> = {};
      let ok = 0;
      for (const p of key.placements) {
        const found = answer.found.some(
          (f) =>
            same(f.word, p.word) &&
            ((sameCell(f.start, p.start) && sameCell(f.end, p.end)) ||
              (sameCell(f.start, p.end) && sameCell(f.end, p.start))),
        );
        parts[p.word] = found;
        if (found) ok++;
      }
      return done(ratio(ok, key.placements.length), parts);
    }
    case 'ODD_ONE_OUT':
    case 'MULTIPLE_CHOICE': {
      if (key.type !== config.type || answer.type !== config.type) return NONE;
      const correct =
        (answer as { optionId: string | null }).optionId === (key as { optionId: string }).optionId;
      return done(correct ? 1 : 0, { option: correct });
    }
    case 'PATTERN_NEXT': {
      if (key.type !== 'PATTERN_NEXT' || answer.type !== 'PATTERN_NEXT') return NONE;
      const option = answer.optionId === key.optionId;
      if (!config.requireWord || !key.word) return done(option ? 1 : 0, { option });
      const word = same(answer.word, key.word);
      return done((option ? 0.5 : 0) + (word ? 0.5 : 0), { option, word });
    }
    case 'NUMBER_PICTURES': {
      if (key.type !== 'NUMBER_PICTURES' || answer.type !== 'NUMBER_PICTURES') return NONE;
      const given = new Map(answer.numbers.map((n) => [n.imageId, n.number]));
      const parts: Record<string, boolean> = {};
      let ok = 0;
      for (const kn of key.numbers) {
        const correct = given.get(kn.imageId) === kn.number;
        parts[kn.imageId] = correct;
        if (correct) ok++;
      }
      const numbers = ratio(ok, key.numbers.length);
      if (!config.writeWord) return done(numbers, parts);
      const wordBy = new Map(config.words.map((w) => [w.number, w.word]));
      const words = new Map((answer.words ?? []).map((w) => [w.imageId, w.word]));
      let okW = 0;
      for (const kn of key.numbers) {
        const correct = same(words.get(kn.imageId), wordBy.get(kn.number));
        parts[`${kn.imageId}:word`] = correct;
        if (correct) okW++;
      }
      return done(0.5 * numbers + 0.5 * ratio(okW, key.numbers.length), parts);
    }
    case 'FILL_BLANK_WORD_BANK': {
      if (key.type !== 'FILL_BLANK_WORD_BANK' || answer.type !== 'FILL_BLANK_WORD_BANK') return NONE;
      const given = new Map(answer.blanks.map((b) => [`${b.sentenceId}:${b.index}`, b.word]));
      const parts: Record<string, boolean> = {};
      let ok = 0;
      for (const kb of key.blanks) {
        const id = `${kb.sentenceId}:${kb.index}`;
        const correct = same(given.get(id), kb.word);
        parts[id] = correct;
        if (correct) ok++;
      }
      return done(ratio(ok, key.blanks.length), parts);
    }
    case 'WORD_ORDER': {
      if (key.type !== 'WORD_ORDER' || answer.type !== 'WORD_ORDER') return NONE;
      const correct = key.accepted.some(
        (o) => o.length === answer.order.length && o.every((x, i) => x === answer.order[i]),
      );
      return done(correct ? 1 : 0, { order: correct });
    }
    case 'INLINE_CHOICE': {
      if (key.type !== 'INLINE_CHOICE' || answer.type !== 'INLINE_CHOICE') return NONE;
      const given = new Map(answer.picks.map((p) => [p.blankId, p.option]));
      const parts: Record<string, boolean> = {};
      let ok = 0;
      for (const kp of key.picks) {
        const correct = given.get(kp.blankId) === kp.option;
        parts[kp.blankId] = correct;
        if (correct) ok++;
      }
      return done(ratio(ok, key.picks.length), parts);
    }
    default:
      return NONE;
  }
}
