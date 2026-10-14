import type { WorksheetSectionView, WorksheetStructureBody } from '@phonics/contracts';
import type { QuestionSummaryModel } from '@/features/questions/models/QuestionModel';

/** Câu trong bản nháp cấu trúc: giữ summary để hiển thị, `itemId` = id item có sẵn (undefined = mới) */
export interface DraftItem {
  key: string;
  itemId?: string;
  question: QuestionSummaryModel;
  pointsOverride: number | null;
}

export interface DraftSection {
  key: string;
  sectionId?: string;
  title: string;
  instruction: string;
  items: DraftItem[];
}

export interface ComposerState {
  sections: DraftSection[];
  dirty: boolean;
}

export type ComposerAction =
  | { type: 'reset'; sections: DraftSection[] }
  | { type: 'addSection' }
  | { type: 'updateSection'; key: string; patch: Partial<Pick<DraftSection, 'title' | 'instruction'>> }
  | { type: 'removeSection'; key: string }
  | { type: 'moveSection'; from: number; to: number }
  | { type: 'addItems'; sectionKey: string; questions: QuestionSummaryModel[] }
  | { type: 'removeItem'; sectionKey: string; itemKey: string }
  | { type: 'moveItem'; sectionKey: string; from: number; to: number }
  | { type: 'moveItemToSection'; itemKey: string; fromKey: string; toKey: string }
  | { type: 'setPoints'; sectionKey: string; itemKey: string; points: number | null };

let seq = 0;
const nextKey = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq += 1)}`;

/** Dựng bản nháp từ WorksheetDetail.sections (summary câu nằm trong item) */
export function sectionsFromDetail(
  sections: WorksheetSectionView[],
  toModel: (q: WorksheetSectionView['items'][number]['question']) => QuestionSummaryModel,
): DraftSection[] {
  return sections.map((s) => ({
    key: s.id,
    sectionId: s.id,
    title: s.title,
    instruction: s.instruction ?? '',
    items: s.items.map((it) => ({
      key: it.id,
      itemId: it.id,
      question: toModel(it.question),
      pointsOverride: it.pointsOverride,
    })),
  }));
}

export function newSection(title: string): DraftSection {
  return { key: nextKey('s'), title, instruction: '', items: [] };
}

const move = <T>(arr: T[], from: number, to: number): T[] => {
  const next = [...arr];
  const [m] = next.splice(from, 1);
  next.splice(to, 0, m);
  return next;
};

/** Reducer thuần cho composer (test không cần React) */
export function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
  switch (action.type) {
    case 'reset':
      return { sections: action.sections, dirty: false };
    case 'addSection':
      return { sections: [...state.sections, newSection(`Part ${state.sections.length + 1}`)], dirty: true };
    case 'updateSection':
      return {
        sections: state.sections.map((s) => (s.key === action.key ? { ...s, ...action.patch } : s)),
        dirty: true,
      };
    case 'removeSection': {
      // Câu của Part bị xoá chuyển sang Part trước (hoặc sau) để không mất
      const idx = state.sections.findIndex((s) => s.key === action.key);
      if (idx === -1 || state.sections.length <= 1) return state;
      const removed = state.sections[idx];
      const target = idx > 0 ? idx - 1 : 1;
      const sections = state.sections
        .map((s, i) => (i === target ? { ...s, items: [...s.items, ...removed.items] } : s))
        .filter((s) => s.key !== action.key);
      return { sections, dirty: true };
    }
    case 'moveSection':
      return { sections: move(state.sections, action.from, action.to), dirty: true };
    case 'addItems': {
      const existing = new Set(state.sections.flatMap((s) => s.items.map((it) => it.question.id)));
      const fresh = action.questions.filter((q) => !existing.has(q.id));
      if (!fresh.length) return state;
      return {
        sections: state.sections.map((s) =>
          s.key === action.sectionKey
            ? {
                ...s,
                items: [
                  ...s.items,
                  ...fresh.map((q) => ({ key: nextKey('i'), question: q, pointsOverride: null })),
                ],
              }
            : s,
        ),
        dirty: true,
      };
    }
    case 'removeItem':
      return {
        sections: state.sections.map((s) =>
          s.key === action.sectionKey
            ? { ...s, items: s.items.filter((it) => it.key !== action.itemKey) }
            : s,
        ),
        dirty: true,
      };
    case 'moveItem':
      return {
        sections: state.sections.map((s) =>
          s.key === action.sectionKey ? { ...s, items: move(s.items, action.from, action.to) } : s,
        ),
        dirty: true,
      };
    case 'moveItemToSection': {
      const from = state.sections.find((s) => s.key === action.fromKey);
      const item = from?.items.find((it) => it.key === action.itemKey);
      if (!item || action.fromKey === action.toKey) return state;
      return {
        sections: state.sections.map((s) => {
          if (s.key === action.fromKey)
            return { ...s, items: s.items.filter((it) => it.key !== action.itemKey) };
          if (s.key === action.toKey) return { ...s, items: [...s.items, item] };
          return s;
        }),
        dirty: true,
      };
    }
    case 'setPoints':
      return {
        sections: state.sections.map((s) =>
          s.key === action.sectionKey
            ? {
                ...s,
                items: s.items.map((it) =>
                  it.key === action.itemKey ? { ...it, pointsOverride: action.points } : it,
                ),
              }
            : s,
        ),
        dirty: true,
      };
  }
}

/** Body PUT /worksheets/:id/structure từ bản nháp */
export function toStructureBody(sections: DraftSection[]): WorksheetStructureBody {
  return {
    sections: sections.map((s) => ({
      id: s.sectionId,
      title: s.title,
      instruction: s.instruction.trim() || undefined,
      items: s.items.map((it) => ({
        id: it.itemId,
        questionId: it.question.id,
        pointsOverride: it.pointsOverride ?? undefined,
      })),
    })),
  };
}

export const totalPoints = (sections: DraftSection[]): number =>
  sections.reduce(
    (sum, s) => sum + s.items.reduce((x, it) => x + (it.pointsOverride ?? it.question.points), 0),
    0,
  );
