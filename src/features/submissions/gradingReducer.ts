import type { GradeSubmissionBody } from '@phonics/contracts';
import type { SubmissionModel } from '@/features/submissions/models/SubmissionModel';

/** Điểm / nhận xét đang nhập cho một câu (chỉ câu chấm tay có manualScore) */
export interface GradeDraft {
  manualScore: number | null;
  teacherNote: string;
}

export interface GradingState {
  drafts: Record<string, GradeDraft>;
  /** Giá trị gốc từ server để tính diff */
  original: Record<string, GradeDraft>;
}

export type GradingAction =
  | { type: 'reset'; submission: SubmissionModel }
  | { type: 'setScore'; worksheetItemId: string; manualScore: number | null }
  | { type: 'setNote'; worksheetItemId: string; teacherNote: string };

export function draftsOf(submission: SubmissionModel): Record<string, GradeDraft> {
  const out: Record<string, GradeDraft> = {};
  for (const a of submission.answers) {
    out[a.worksheetItemId] = { manualScore: a.manualScore, teacherNote: a.teacherNote ?? '' };
  }
  return out;
}

export const initialGrading = (submission?: SubmissionModel): GradingState => {
  const drafts = submission ? draftsOf(submission) : {};
  return { drafts, original: drafts };
};

export function gradingReducer(state: GradingState, action: GradingAction): GradingState {
  switch (action.type) {
    case 'reset':
      return initialGrading(action.submission);
    case 'setScore':
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.worksheetItemId]: {
            ...(state.drafts[action.worksheetItemId] ?? { teacherNote: '' }),
            manualScore: action.manualScore,
          },
        },
      };
    case 'setNote':
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.worksheetItemId]: {
            ...(state.drafts[action.worksheetItemId] ?? { manualScore: null }),
            teacherNote: action.teacherNote,
          },
        },
      };
  }
}

const changed = (a: GradeDraft | undefined, b: GradeDraft): boolean =>
  !a || a.manualScore !== b.manualScore || a.teacherNote.trim() !== b.teacherNote.trim();

/** Các câu đã sửa so với gốc */
export const changedItemIds = (state: GradingState): string[] =>
  Object.keys(state.drafts).filter((id) => changed(state.original[id], state.drafts[id]));

export const isGradingDirty = (state: GradingState): boolean => changedItemIds(state).length > 0;

/**
 * Body PUT grade: chỉ gửi câu có thay đổi và đã có điểm (API yêu cầu manualScore). Câu tự chấm cũng gửi được nếu GV
 * muốn ghi đè điểm / thêm nhận xét: khi chỉ có nhận xét (chưa đặt điểm tay) thì giữ điểm tự chấm hiện tại.
 */
export function toGradeBody(
  state: GradingState,
  submission: SubmissionModel,
  finalize: boolean,
): GradeSubmissionBody {
  const byId = new Map(submission.answers.map((a) => [a.worksheetItemId, a]));
  const items: GradeSubmissionBody['items'] = [];
  for (const id of changedItemIds(state)) {
    const d = state.drafts[id];
    const answer = byId.get(id);
    const score = d.manualScore ?? (answer && !answer.isManual ? answer.autoScore : null);
    if (score === null || score === undefined) continue;
    items.push({ worksheetItemId: id, manualScore: score, teacherNote: d.teacherNote.trim() || null });
  }
  return { items, finalize };
}

/** Còn câu chấm tay nào chưa có điểm (tính cả bản nháp) → chưa chốt được */
export const pendingManualCount = (state: GradingState, submission: SubmissionModel): number =>
  submission.answers.filter(
    (a) => a.isManual && (state.drafts[a.worksheetItemId]?.manualScore ?? null) === null,
  ).length;
