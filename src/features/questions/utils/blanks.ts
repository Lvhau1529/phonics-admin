import { BLANK_TOKEN, inlinePlaceholder } from '@phonics/contracts';

/**
 * Cú pháp nhập của giáo viên:
 *  - Điền từ: "I [[hear]] the children." → text "I ___ the children." + đáp án ["hear"]
 *  - Hoàn thành câu chuyện: "Sam and I [[*like to|like]] taste." → text "Sam and I {{b1}} taste." + blank {options, đúng}
 * Các hàm thuần, có hàm ngược để mở lại editor từ config / answerKey đã lưu.
 */

const BRACKET_RE = /\[\[([^\]]*)\]\]/g;

export interface ParsedBlanks {
  text: string;
  answers: string[];
}

/** "I [[hear]] the ___." → { text: "I ___ the ___.", answers: ["hear"] } (chỗ trống trần giữ nguyên, không có đáp án) */
export function parseBlanks(raw: string): ParsedBlanks {
  const answers: string[] = [];
  const text = raw.replace(BRACKET_RE, (_m, inner: string) => {
    answers.push(inner.trim());
    return BLANK_TOKEN;
  });
  return { text, answers };
}

/** Ngược lại: text có ___ + đáp án theo thứ tự → "I [[hear]] the children." */
export function composeBlanks(text: string, answers: readonly string[]): string {
  let i = 0;
  return text.split(BLANK_TOKEN).reduce((acc, part, idx) => {
    if (idx === 0) return part;
    const answer = answers[i++];
    return `${acc}${answer !== undefined ? `[[${answer}]]` : BLANK_TOKEN}${part}`;
  }, '');
}

export interface InlineBlankDraft {
  id: string;
  options: string[];
  /** Lựa chọn đúng (đánh dấu *) — có thể thiếu khi giáo viên chưa đánh dấu */
  correct: string | null;
}

export interface ParsedInlineChoices {
  text: string;
  blanks: InlineBlankDraft[];
}

/** "Sam and I [[*like to|like]] taste the corns." → text với {{b1}} + danh sách blank */
export function parseInlineChoices(raw: string): ParsedInlineChoices {
  const blanks: InlineBlankDraft[] = [];
  const text = raw.replace(BRACKET_RE, (_m, inner: string) => {
    const id = `b${blanks.length + 1}`;
    let correct: string | null = null;
    const options = inner
      .split('|')
      .map((o) => o.trim())
      .filter(Boolean)
      .map((o) => {
        if (o.startsWith('*')) {
          const clean = o.slice(1).trim();
          correct = clean;
          return clean;
        }
        return o;
      });
    blanks.push({ id, options, correct });
    return inlinePlaceholder(id);
  });
  return { text, blanks };
}

/** Ngược lại: config.text ({{b1}}) + blanks + picks → cú pháp [[*a|b]] */
export function composeInlineChoices(
  text: string,
  blanks: readonly { id: string; options: readonly string[] }[],
  picks: readonly { blankId: string; option: string }[],
): string {
  const correct = new Map(picks.map((p) => [p.blankId, p.option]));
  let out = text;
  for (const b of blanks) {
    const inner = b.options.map((o) => (o === correct.get(b.id) ? `*${o}` : o)).join('|');
    out = out.replace(inlinePlaceholder(b.id), `[[${inner}]]`);
  }
  return out;
}

/** Tách câu thành các đoạn text / chỗ trống để render: "I ___ the" → ['I ', null, ' the'] */
export function splitBlanks(text: string): (string | null)[] {
  const parts = text.split(BLANK_TOKEN);
  const out: (string | null)[] = [];
  parts.forEach((p, i) => {
    if (i > 0) out.push(null);
    if (p) out.push(p);
  });
  return out;
}

/** Tách đoạn văn theo {{id}} → text | { blankId } */
export function splitInline(text: string): (string | { blankId: string })[] {
  const out: (string | { blankId: string })[] = [];
  const re = /\{\{([^}]+)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ blankId: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
