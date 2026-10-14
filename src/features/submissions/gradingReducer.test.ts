import type { SubmissionDetail } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import {
  gradingReducer,
  initialGrading,
  isGradingDirty,
  pendingManualCount,
  toGradeBody,
} from '@/features/submissions/gradingReducer';
import { SubmissionModel } from '@/features/submissions/models/SubmissionModel';

const submission = () =>
  new SubmissionModel({
    id: 's1',
    assignmentId: 'a1',
    studentId: 'st1',
    studentName: 'Bi',
    attemptNo: 1,
    status: 'SUBMITTED',
    startedAt: '2026-10-09T01:00:00.000Z',
    submittedAt: '2026-10-09T01:10:00.000Z',
    gradedAt: null,
    gradedById: null,
    gradedByName: null,
    autoScore: 1,
    manualScore: null,
    totalScore: null,
    maxScore: 2,
    percent: null,
    durationMs: 600000,
    late: false,
    updatedAt: '2026-10-09T01:10:00.000Z',
    pendingManual: 1,
    media: {},
    worksheet: {
      worksheetId: 'w1',
      title: 'W',
      subject: 'PHONICS',
      topic: null,
      grade: null,
      week: null,
      day: null,
      kind: 'WORKSHEET',
      maxScore: 2,
      snapshotAt: '2026-10-09T00:00:00.000Z',
      sections: [
        {
          id: 'sec1',
          order: 0,
          title: 'Part 1',
          instruction: null,
          items: [
            {
              worksheetItemId: 'i1',
              order: 0,
              points: 1,
              question: {
                id: 'q1',
                type: 'MULTIPLE_CHOICE',
                gradingMode: 'AUTO',
                instruction: 'Circle',
                instructionVi: null,
                example: null,
                config: {
                  type: 'MULTIPLE_CHOICE',
                  options: [
                    { id: 'o1', text: 'a' },
                    { id: 'o2', text: 'b' },
                  ],
                },
                answerKey: { type: 'MULTIPLE_CHOICE', optionId: 'o1' },
              },
            },
            {
              worksheetItemId: 'i2',
              order: 1,
              points: 1,
              question: {
                id: 'q2',
                type: 'SPEAK',
                gradingMode: 'MANUAL',
                instruction: 'Say',
                instructionVi: null,
                example: null,
                config: { type: 'SPEAK', prompt: 'nut' },
                answerKey: { type: 'SPEAK' },
              },
            },
          ],
        },
      ],
    },
    answers: [
      {
        worksheetItemId: 'i1',
        questionType: 'MULTIPLE_CHOICE',
        maxPoints: 1,
        answer: { type: 'MULTIPLE_CHOICE', optionId: 'o1' },
        isCorrect: true,
        autoScore: 1,
        manualScore: null,
        score: 1,
        teacherNote: null,
        gradeDetail: { option: true },
        gradedAt: null,
        answerKey: { type: 'MULTIPLE_CHOICE', optionId: 'o1' },
      },
      {
        worksheetItemId: 'i2',
        questionType: 'SPEAK',
        maxPoints: 1,
        answer: { type: 'SPEAK', recordingMediaId: 'm1' },
        isCorrect: null,
        autoScore: null,
        manualScore: null,
        score: null,
        teacherNote: null,
        gradeDetail: null,
        gradedAt: null,
        answerKey: { type: 'SPEAK' },
      },
    ],
  } satisfies SubmissionDetail);

describe('gradingReducer', () => {
  it('ban đầu không dirty, còn 1 câu chấm tay', () => {
    const s = submission();
    const state = initialGrading(s);
    expect(isGradingDirty(state)).toBe(false);
    expect(pendingManualCount(state, s)).toBe(1);
  });

  it('đặt điểm câu chấm tay → body chỉ chứa câu đó; chốt được khi đủ điểm', () => {
    const s = submission();
    let state = initialGrading(s);
    state = gradingReducer(state, { type: 'setScore', worksheetItemId: 'i2', manualScore: 0.75 });
    state = gradingReducer(state, { type: 'setNote', worksheetItemId: 'i2', teacherNote: ' Good ' });
    expect(isGradingDirty(state)).toBe(true);
    expect(pendingManualCount(state, s)).toBe(0);
    expect(toGradeBody(state, s, true)).toEqual({
      items: [{ worksheetItemId: 'i2', manualScore: 0.75, teacherNote: 'Good' }],
      finalize: true,
    });
  });

  it('chỉ thêm nhận xét cho câu tự chấm → giữ autoScore; câu chấm tay chưa điểm thì bỏ qua', () => {
    const s = submission();
    let state = initialGrading(s);
    state = gradingReducer(state, { type: 'setNote', worksheetItemId: 'i1', teacherNote: 'Nice' });
    state = gradingReducer(state, { type: 'setNote', worksheetItemId: 'i2', teacherNote: 'Louder' });
    expect(toGradeBody(state, s, false).items).toEqual([
      { worksheetItemId: 'i1', manualScore: 1, teacherNote: 'Nice' },
    ]);
  });
});
