import { describe, expect, it } from 'vitest';
import {
  composeBlanks,
  composeInlineChoices,
  parseBlanks,
  parseInlineChoices,
  splitBlanks,
  splitInline,
} from '@/features/questions/utils/blanks';
import { checkAnswer } from '@/features/questions/utils/checkAnswer';
import { autoArrange, buildGrid } from '@/features/questions/utils/crossword';
import { scrambleWord, shuffle, shuffleChips } from '@/features/questions/utils/shuffle';
import { cellsBetween, generateWordSearch } from '@/features/questions/utils/wordSearch';

describe('blanks', () => {
  it('parse / compose điền từ', () => {
    expect(parseBlanks('I [[hear]] the [[children]].')).toEqual({
      text: 'I ___ the ___.',
      answers: ['hear', 'children'],
    });
    expect(composeBlanks('I ___ the ___.', ['hear', 'children'])).toBe('I [[hear]] the [[children]].');
    expect(splitBlanks('I ___ the')).toEqual(['I ', null, ' the']);
  });
  it('parse / compose hoàn thành câu chuyện', () => {
    const p = parseInlineChoices('Sam and I [[*like to|like]] taste. [[We|*I]] go.');
    expect(p.text).toBe('Sam and I {{b1}} taste. {{b2}} go.');
    expect(p.blanks).toEqual([
      { id: 'b1', options: ['like to', 'like'], correct: 'like to' },
      { id: 'b2', options: ['We', 'I'], correct: 'I' },
    ]);
    expect(
      composeInlineChoices(p.text, p.blanks, [
        { blankId: 'b1', option: 'like to' },
        { blankId: 'b2', option: 'I' },
      ]),
    ).toBe('Sam and I [[*like to|like]] taste. [[We|*I]] go.');
    expect(splitInline('A {{b1}} b')).toEqual(['A ', { blankId: 'b1' }, ' b']);
  });
});

describe('shuffle', () => {
  it('seed lặp lại được, scramble khác từ gốc, chips khác thứ tự gốc', () => {
    expect(shuffle([1, 2, 3, 4], 7)).toEqual(shuffle([1, 2, 3, 4], 7));
    expect(scrambleWord('ant', 1)).not.toBe('ant');
    expect([...scrambleWord('nest', 3)].sort().join('')).toBe('enst');
    const chips = shuffleChips(['We', 'see', 'the nest.'], 5);
    expect(chips).toHaveLength(3);
    expect(chips).not.toEqual(['We', 'see', 'the nest.']);
  });
});

describe('wordSearch', () => {
  it('đặt đủ từ vào lưới, placement đọc được từ lưới', () => {
    const r = generateWordSearch({
      words: ['net', 'cap', 'mouse'],
      rows: 6,
      cols: 6,
      directions: ['H', 'V'],
      seed: 42,
    });
    expect(r.failed).toEqual([]);
    expect(r.grid).toHaveLength(6);
    for (const p of r.placements) {
      const cells = cellsBetween(p.start, p.end)!;
      expect(cells.map((c) => r.grid[c.r][c.c]).join('')).toBe(p.word);
    }
  });
  it('báo từ không đặt được khi lưới quá nhỏ', () => {
    const r = generateWordSearch({ words: ['alligator'], rows: 3, cols: 3, seed: 1 });
    expect(r.failed).toEqual(['alligator']);
  });
  it('cellsBetween: chỉ đường thẳng', () => {
    expect(cellsBetween({ r: 0, c: 0 }, { r: 0, c: 2 })).toHaveLength(3);
    expect(cellsBetween({ r: 0, c: 0 }, { r: 1, c: 2 })).toBeNull();
  });
});

describe('crossword', () => {
  it('autoArrange giao nhau không xung đột; buildGrid phát hiện xung đột', () => {
    const entries = autoArrange(
      [
        { number: 1, answer: 'map' },
        { number: 2, answer: 'pen' },
      ],
      6,
      6,
    );
    expect(entries).toHaveLength(2);
    expect(buildGrid(entries, 6, 6).conflicts.size).toBe(0);
    const bad = buildGrid(
      [
        { number: 1, direction: 'across', start: { r: 0, c: 0 }, answer: 'map' },
        { number: 2, direction: 'down', start: { r: 0, c: 0 }, answer: 'pen' },
      ],
      3,
      3,
    );
    expect(bad.conflicts.has('0,0')).toBe(true);
  });
});

describe('checkAnswer', () => {
  it('MULTIPLE_CHOICE / FILL_BLANK / WORD_ORDER', () => {
    const mc = checkAnswer(
      {
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'a', text: 'jam' },
          { id: 'b', text: 'ram' },
        ],
      },
      { type: 'MULTIPLE_CHOICE', optionId: 'a' },
      { type: 'MULTIPLE_CHOICE', optionId: 'a' },
    );
    expect(mc.correct).toBe(true);
    const fb = checkAnswer(
      {
        type: 'FILL_BLANK_WORD_BANK',
        wordBank: ['hear', 'see'],
        sentences: [{ id: 's1', text: 'I ___ it. I ___ it.' }],
      },
      {
        type: 'FILL_BLANK_WORD_BANK',
        blanks: [
          { sentenceId: 's1', index: 0, word: 'hear' },
          { sentenceId: 's1', index: 1, word: 'see' },
        ],
      },
      {
        type: 'FILL_BLANK_WORD_BANK',
        blanks: [
          { sentenceId: 's1', index: 0, word: 'Hear' },
          { sentenceId: 's1', index: 1, word: 'hear' },
        ],
      },
    );
    expect(fb.fraction).toBe(0.5);
    expect(fb.parts).toEqual({ 's1:0': true, 's1:1': false });
    const wo = checkAnswer(
      { type: 'WORD_ORDER', words: ['see', 'We', 'the nest.'] },
      { type: 'WORD_ORDER', accepted: [[1, 0, 2]] },
      { type: 'WORD_ORDER', order: [1, 0, 2] },
    );
    expect(wo.correct).toBe(true);
    expect(checkAnswer({ type: 'SPEAK', prompt: 'x' }, { type: 'SPEAK' }, { type: 'SPEAK' }).fraction).toBe(
      0,
    );
  });
});
