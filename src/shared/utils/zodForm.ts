/**
 * Cầu nối antd Form ↔ zod (contracts):
 *  - `zodRule(schema)`: rule validate một field bằng schema của field đó (vd `zodRule(Email)`);
 *  - `parseForm(schema, values)`: gate toàn bộ body trước khi gọi API, lỗi theo field;
 *  - `applyServerErrors(form, error)`: lỗi `details` của API → `form.setFields`.
 */
import type { FormInstance } from 'antd';
import type { Rule } from 'antd/es/form';
import type { z, ZodType } from 'zod';
import { isApiError } from '@/shared/api/errors';
import { t } from '@/shared/i18n';

export type FieldErrors = Record<string, string[]>;

export type ParseResult<T> =
  { success: true; data: T } | { success: false; fieldErrors: FieldErrors; formErrors: string[] };

const isBlank = (value: unknown): boolean =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/** Rule antd: giá trị trống thì bỏ qua (để `required` lo), có giá trị thì phải qua schema */
export function zodRule(schema: ZodType, options: { allowEmpty?: boolean } = {}): Rule {
  const { allowEmpty = true } = options;
  return {
    validator: (_rule, value: unknown) => {
      if (allowEmpty && isBlank(value)) return Promise.resolve();
      const result = schema.safeParse(value);
      if (result.success) return Promise.resolve();
      return Promise.reject(new Error(result.error.issues[0]?.message ?? t.common.invalidValue));
    },
  };
}

/** Gom issue của zod theo đường dẫn field (`parent.email`); path rỗng = lỗi của cả form */
export function groupIssues(error: z.ZodError): { fieldErrors: FieldErrors; formErrors: string[] } {
  const fieldErrors: FieldErrors = {};
  const formErrors: string[] = [];
  for (const issue of error.issues) {
    const path = issue.path.map(String).join('.');
    if (!path) {
      formErrors.push(issue.message);
      continue;
    }
    (fieldErrors[path] ??= []).push(issue.message);
  }
  return { fieldErrors, formErrors };
}

/** Validate body bằng schema contracts trước khi gửi API */
export function parseForm<T>(schema: ZodType<T>, values: unknown): ParseResult<T> {
  const result = schema.safeParse(values);
  if (result.success) return { success: true, data: result.data };
  return { success: false, ...groupIssues(result.error) };
}

/** `entries.0.points` → ['entries', 0, 'points'] (Form.List dùng chỉ số số) */
const toNamePath = (path: string): (string | number)[] =>
  path.split('.').map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg));

/** Đưa lỗi theo field vào antd Form (`a.b` → name ['a', 'b']) */
export function applyFieldErrors(form: FormInstance, fieldErrors: FieldErrors): void {
  form.setFields(Object.entries(fieldErrors).map(([name, errors]) => ({ name: toNamePath(name), errors })));
}

/** Lỗi validate của API (400 VALIDATION_ERROR có `details`) → form. Trả về true nếu đã map được. */
export function applyServerErrors(form: FormInstance, error: unknown): boolean {
  if (!isApiError(error) || !error.details || Object.keys(error.details).length === 0) return false;
  applyFieldErrors(form, error.details);
  return true;
}

/**
 * Chuẩn hoá giá trị form trước khi parse: chuỗi rỗng → undefined (schema `.optional()` không nhận '').
 * Chỉ xử lý cấp một và object con một cấp (parent contact).
 */
export function stripEmpty<T extends Record<string, unknown>>(values: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      out[key] = trimmed === '' ? undefined : trimmed;
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      out[key] = stripEmpty(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

/** Chỉ giữ các field có giá trị khác bản gốc (PATCH body partial; refine "cần ít nhất một trường") */
export function diffValues<T extends Record<string, unknown>>(original: Partial<T>, next: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(next) as (keyof T)[]) {
    const a = original[key];
    const b = next[key];
    if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) out[key] = b;
  }
  return out;
}
