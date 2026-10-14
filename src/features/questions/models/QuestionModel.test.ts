import type { QuestionView } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { QuestionModel } from '@/features/questions/models/QuestionModel';
import { setLang } from '@/shared/i18n';

const M = '11111111-1111-4111-8111-111111111111';
const dto: QuestionView = {
  id: '22222222-2222-4222-8222-222222222222',
  type: 'SPEAK',
  gradingMode: 'MANUAL',
  instruction: 'Say the word.',
  instructionVi: null,
  points: 2,
  tags: ['nn'],
  status: 'DRAFT',
  visibility: 'SHARED',
  createdById: 'owner',
  createdByName: 'Cô Lan',
  usedInWorksheets: 1,
  thumbnail: { id: M, url: 'https://x/m.png', kind: 'IMAGE' },
  createdAt: '2026-10-09T00:00:00.000Z',
  updatedAt: '2026-10-09T00:00:00.000Z',
  example: null,
  config: { type: 'SPEAK', prompt: 'Say: nest', imageMediaId: M },
  answerKey: { type: 'SPEAK' },
  media: { [M]: { id: M, url: 'https://x/m.png', kind: 'IMAGE' } },
};

describe('QuestionModel', () => {
  it('getter nhãn / cờ / quyền sửa', () => {
    setLang('en');
    const q = new QuestionModel(dto);
    expect(q.typeLabel).toBe('Say the word');
    expect(q.isManual).toBe(true);
    expect(q.isPublished).toBe(false);
    expect(q.statusColor).toBe('warning');
    expect(q.thumbnailUrl).toBe('https://x/m.png');
    expect(q.canEditBy('owner', false)).toBe(true);
    expect(q.canEditBy('other', false)).toBe(false);
    expect(q.canEditBy('other', true)).toBe(true);
    expect(q.config.type).toBe('SPEAK');
  });
});
