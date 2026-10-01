import { CreateTeacherBody, Email, UpdateStudentBody } from '@phonics/contracts';
import type { FormInstance } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api/errors';
import { applyServerErrors, diffValues, parseForm, stripEmpty, zodRule } from '@/shared/utils/zodForm';

describe('zodRule', () => {
  it('bỏ qua giá trị trống (để required lo), từ chối giá trị sai', async () => {
    const rule = zodRule(Email);
    const validator = (rule as { validator: (r: unknown, v: unknown) => Promise<void> }).validator;
    await expect(validator({}, '')).resolves.toBeUndefined();
    await expect(validator({}, undefined)).resolves.toBeUndefined();
    await expect(validator({}, 'a@b.vn')).resolves.toBeUndefined();
    await expect(validator({}, 'không-phải-email')).rejects.toThrow();
  });
});

describe('parseForm', () => {
  it('trả data đã chuẩn hoá (trim, lowercase, default)', () => {
    const result = parseForm(CreateTeacherBody, { email: '  GV@Demo.LOCAL ', displayName: ' Cô Lan ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ email: 'gv@demo.local', displayName: 'Cô Lan', classIds: [] });
    }
  });

  it('gom lỗi theo field (kể cả field lồng nhau) và lỗi của cả form', () => {
    const result = parseForm(UpdateStudentBody, { parent: { email: 'sai' }, displayName: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors)).toEqual(
        expect.arrayContaining(['parent.email', 'displayName']),
      );
    }
    const empty = parseForm(UpdateStudentBody, {});
    expect(empty.success).toBe(false);
    if (!empty.success) expect(empty.formErrors).toHaveLength(1);
  });
});

describe('applyServerErrors', () => {
  it('đưa details của ApiError vào form.setFields; lỗi không có details thì trả false', () => {
    const setFields = vi.fn();
    const form = { setFields } as unknown as FormInstance;
    const withDetails = new ApiError(400, 'VALIDATION_ERROR', 'bad', {
      email: ['Email đã dùng'],
      'parent.phone': ['Sai'],
    });
    expect(applyServerErrors(form, withDetails)).toBe(true);
    expect(setFields).toHaveBeenCalledWith([
      { name: ['email'], errors: ['Email đã dùng'] },
      { name: ['parent', 'phone'], errors: ['Sai'] },
    ]);
    expect(applyServerErrors(form, new ApiError(500, 'INTERNAL', 'x'))).toBe(false);
    expect(applyServerErrors(form, new Error('x'))).toBe(false);
  });
});

describe('stripEmpty / diffValues', () => {
  it('chuỗi rỗng → undefined, có trim; object con cũng được xử lý', () => {
    expect(stripEmpty({ a: '  ', b: ' x ', c: 1, d: { e: '' } })).toEqual({
      a: undefined,
      b: 'x',
      c: 1,
      d: { e: undefined },
    });
  });

  it('chỉ giữ field khác bản gốc', () => {
    expect(diffValues({ a: 1, b: 'x', c: null }, { a: 1, b: 'y', c: null })).toEqual({ b: 'y' });
    expect(diffValues({ a: 1 }, { a: 1 })).toEqual({});
  });
});
