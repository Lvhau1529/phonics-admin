import type { QuestionType } from '@phonics/contracts';

/**
 * Bản nháp nội dung câu hỏi trong editor: config / answerKey lỏng kiểu (đang nhập dở), chỉ được validate bằng
 * contracts (`CreateQuestionBody`) lúc lưu. `type` luôn nằm trong cả hai object theo discriminated union.
 */
export interface QuestionDraft {
  type: QuestionType;
  config: Record<string, unknown>;
  answerKey: Record<string, unknown>;
}

export interface EditorProps {
  draft: QuestionDraft;
  /** Ghi đè một phần config / answerKey (giữ `type`) */
  patch: (config?: Record<string, unknown>, answerKey?: Record<string, unknown>) => void;
  disabled?: boolean;
}

/** Id ngắn cho lựa chọn / ảnh / câu (ổn định trong một câu hỏi) */
export const newId = (prefix: string, existing: readonly { id: string }[] = []): string => {
  let n = existing.length + 1;
  while (existing.some((e) => e.id === `${prefix}${n}`)) n += 1;
  return `${prefix}${n}`;
};

/** Config / answerKey khởi tạo cho từng dạng (đủ để preview không crash) */
export function emptyDraft(type: QuestionType): QuestionDraft {
  const base = { type };
  switch (type) {
    case 'MISSING_SOUND':
      return { type, config: { ...base, pattern: '' }, answerKey: { ...base, letters: [], word: '' } };
    case 'CROSSWORD':
      return {
        type,
        config: { ...base, rows: 6, cols: 6, words: [], prefilled: [] },
        answerKey: { ...base, words: [] },
      };
    case 'UNSCRAMBLE_WORD':
      return { type, config: { ...base, scrambled: '' }, answerKey: { ...base, word: '', accepted: [] } };
    case 'PICK_LETTERS':
      return { type, config: { ...base, letters: [] }, answerKey: { ...base, letterIds: [], word: '' } };
    case 'WORD_SEARCH':
      return {
        type,
        config: { ...base, rows: 6, cols: 6, grid: [], words: [] },
        answerKey: { ...base, placements: [] },
      };
    case 'ODD_ONE_OUT':
      return { type, config: { ...base, options: [] }, answerKey: { ...base, optionId: '' } };
    case 'PATTERN_NEXT':
      return {
        type,
        config: { ...base, sequence: [], options: [], requireWord: false },
        answerKey: { ...base, optionId: '' },
      };
    case 'NUMBER_PICTURES':
      return {
        type,
        config: { ...base, words: [], images: [], writeWord: false, showWordBank: true },
        answerKey: { ...base, numbers: [] },
      };
    case 'MULTIPLE_CHOICE':
      return { type, config: { ...base, options: [] }, answerKey: { ...base, optionId: '' } };
    case 'FILL_BLANK_WORD_BANK':
      return { type, config: { ...base, wordBank: [], sentences: [] }, answerKey: { ...base, blanks: [] } };
    case 'WORD_ORDER':
      return { type, config: { ...base, words: [] }, answerKey: { ...base, accepted: [] } };
    case 'INLINE_CHOICE':
      return {
        type,
        config: { ...base, imageMediaIds: [], text: '', blanks: [] },
        answerKey: { ...base, picks: [] },
      };
    case 'TRACE_AND_READ':
      return {
        type,
        config: { ...base, sentence: '', tracePart: '', requireTrace: true, requireRecording: true },
        answerKey: { ...base },
      };
    case 'SPEAK':
      return { type, config: { ...base, prompt: '' }, answerKey: { ...base } };
  }
}
