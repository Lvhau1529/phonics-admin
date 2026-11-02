import {
  QuestionAnswer,
  type MediaMap,
  type QuestionAnswerKey,
  type QuestionConfig,
  type QuestionExample,
} from '@phonics/contracts';
import { z } from 'zod';
import { checkAnswer } from '@/features/questions/utils/checkAnswer';

/**
 * Giao thức postMessage với màn xem trước `#/preview` của app học sinh (bản gốc + mô tả ở phonics-game
 * `modules/homework/models/preview.ts` — đổi một bên thì đổi cả hai):
 *   game → admin `ready` / `check` (câu trả lời thử) · admin → game `load` (nội dung) / `results` (kết quả).
 */
export const PREVIEW_CHANNEL = 'phonics-preview';

/** Một câu gửi sang app học sinh */
export interface StudentPreviewItem {
  /** Khoá ổn định trong phiếu: câu trả lời thử được giữ khi config không đổi */
  key: string;
  instruction: string;
  example: QuestionExample | null;
  config: QuestionConfig;
  answerKey: QuestionAnswerKey | null;
}

export interface StudentPreviewContent {
  title: string;
  items: StudentPreviewItem[];
  media: MediaMap;
}

/** Kết quả từng câu = mép khung câu ở màn xem lại của app */
export type PreviewTone = 'right' | 'almost' | 'wrong' | 'checking';

export type AdminMessage =
  | ({ channel: typeof PREVIEW_CHANNEL; type: 'load' } & StudentPreviewContent)
  | { channel: typeof PREVIEW_CHANNEL; type: 'results'; results: Record<string, PreviewTone> };

const GameMessage = z.discriminatedUnion('type', [
  z.object({ channel: z.literal(PREVIEW_CHANNEL), type: z.literal('ready') }),
  z.object({
    channel: z.literal(PREVIEW_CHANNEL),
    type: z.literal('check'),
    answers: z.record(z.string(), QuestionAnswer),
  }),
]);
export type GameMessage = z.infer<typeof GameMessage>;

/** Message hợp lệ từ app học sinh; khác kênh / sai shape → null */
export function parseGameMessage(data: unknown): GameMessage | null {
  const parsed = GameMessage.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** Dạng chấm tay (ghi âm / tô chữ) → giáo viên chấm sau, app hiện "đang chấm" */
const MANUAL: ReadonlySet<QuestionConfig['type']> = new Set(['SPEAK', 'TRACE_AND_READ']);

/** Chấm thử mọi câu bằng checkAnswer (giống tab "Thử làm"; điểm thật do API tính khi nộp) */
export function gradePreview(
  items: StudentPreviewItem[],
  answers: Record<string, QuestionAnswer>,
): Record<string, PreviewTone> {
  const results: Record<string, PreviewTone> = {};
  for (const item of items) {
    if (MANUAL.has(item.config.type) || !item.answerKey) {
      results[item.key] = 'checking';
      continue;
    }
    const result = checkAnswer(item.config, item.answerKey, answers[item.key] ?? null);
    results[item.key] = result.correct ? 'right' : result.fraction > 0 ? 'almost' : 'wrong';
  }
  return results;
}
