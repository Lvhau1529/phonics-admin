import type { QuestionAnswer } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import {
  gradePreview,
  parseGameMessage,
  type StudentPreviewItem,
} from '@/features/questions/utils/studentPreview';

const IMAGE = '00000000-0000-4000-8000-000000000001';

const unscramble = (key: string, word: string): StudentPreviewItem => ({
  key,
  instruction: 'Unscramble',
  example: null,
  config: { type: 'UNSCRAMBLE_WORD', imageMediaId: IMAGE, scrambled: [...word].reverse().join('') },
  answerKey: { type: 'UNSCRAMBLE_WORD', word, accepted: [] },
});

describe('gradePreview', () => {
  it('đúng / sai / chưa có đáp án / chấm tay', () => {
    const items: StudentPreviewItem[] = [
      unscramble('a', 'cat'),
      unscramble('b', 'dog'),
      { ...unscramble('c', 'pig'), answerKey: null },
      {
        key: 'd',
        instruction: 'Say it',
        example: null,
        config: { type: 'SPEAK', prompt: 'cat', imageMediaId: IMAGE } as never,
        answerKey: null,
      },
    ];
    const answers: Record<string, QuestionAnswer> = {
      a: { type: 'UNSCRAMBLE_WORD', word: 'CAT' },
      b: { type: 'UNSCRAMBLE_WORD', word: 'god' },
    };
    expect(gradePreview(items, answers)).toEqual({ a: 'right', b: 'wrong', c: 'checking', d: 'checking' });
  });
});

describe('parseGameMessage', () => {
  it('chỉ nhận message đúng kênh + shape', () => {
    expect(parseGameMessage({ channel: 'phonics-preview', type: 'ready' })).toEqual({
      channel: 'phonics-preview',
      type: 'ready',
    });
    expect(parseGameMessage({ channel: 'other', type: 'ready' })).toBeNull();
    expect(
      parseGameMessage({ channel: 'phonics-preview', type: 'check', answers: { a: { type: 'X' } } }),
    ).toBeNull();
    expect(parseGameMessage('hello')).toBeNull();
  });
});
