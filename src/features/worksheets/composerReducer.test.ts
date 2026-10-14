import type { QuestionSummary } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { QuestionSummaryModel } from '@/features/questions/models/QuestionModel';
import {
  composerReducer,
  newSection,
  toStructureBody,
  totalPoints,
  type ComposerState,
} from '@/features/worksheets/composerReducer';

const q = (id: string, points = 1) =>
  new QuestionSummaryModel({
    id,
    type: 'MULTIPLE_CHOICE',
    gradingMode: 'AUTO',
    instruction: `Q ${id}`,
    instructionVi: null,
    points,
    tags: [],
    status: 'PUBLISHED',
    visibility: 'SHARED',
    createdById: 'u',
    createdByName: 'u',
    usedInWorksheets: 0,
    thumbnail: null,
    createdAt: '2026-10-09T00:00:00.000Z',
    updatedAt: '2026-10-09T00:00:00.000Z',
  } satisfies QuestionSummary);

describe('composerReducer', () => {
  const s1 = newSection('Part 1');
  const s2 = newSection('Part 2');
  const base: ComposerState = { sections: [s1, s2], dirty: false };

  it('thêm câu (bỏ trùng), tổng điểm theo override, body PUT', () => {
    let state = composerReducer(base, {
      type: 'addItems',
      sectionKey: s1.key,
      questions: [q('a', 2), q('b')],
    });
    state = composerReducer(state, { type: 'addItems', sectionKey: s2.key, questions: [q('a')] });
    expect(state.sections[0].items).toHaveLength(2);
    expect(state.sections[1].items).toHaveLength(0);
    const itemKey = state.sections[0].items[0].key;
    state = composerReducer(state, { type: 'setPoints', sectionKey: s1.key, itemKey, points: 5 });
    expect(totalPoints(state.sections)).toBe(6);
    expect(state.dirty).toBe(true);
    const body = toStructureBody(state.sections);
    expect(body.sections[0].items[0]).toEqual({ id: undefined, questionId: 'a', pointsOverride: 5 });
  });

  it('xoá Part chuyển câu sang Part trước; không xoá Part cuối cùng', () => {
    let state = composerReducer(base, { type: 'addItems', sectionKey: s2.key, questions: [q('x')] });
    state = composerReducer(state, { type: 'removeSection', key: s2.key });
    expect(state.sections).toHaveLength(1);
    expect(state.sections[0].items.map((it) => it.question.id)).toEqual(['x']);
    expect(composerReducer(state, { type: 'removeSection', key: s1.key }).sections).toHaveLength(1);
  });

  it('di chuyển câu trong Part và sang Part khác', () => {
    let state = composerReducer(base, {
      type: 'addItems',
      sectionKey: s1.key,
      questions: [q('a'), q('b'), q('c')],
    });
    state = composerReducer(state, { type: 'moveItem', sectionKey: s1.key, from: 0, to: 2 });
    expect(state.sections[0].items.map((it) => it.question.id)).toEqual(['b', 'c', 'a']);
    const key = state.sections[0].items[0].key;
    state = composerReducer(state, {
      type: 'moveItemToSection',
      itemKey: key,
      fromKey: s1.key,
      toKey: s2.key,
    });
    expect(state.sections[0].items).toHaveLength(2);
    expect(state.sections[1].items[0].question.id).toBe('b');
  });
});
