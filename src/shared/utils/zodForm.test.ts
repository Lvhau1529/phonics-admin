import { CreateTeacherBody, Email, UpdateStudentBody } from '@phonics/contracts';
import type { FormInstance } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api/errors';
import { sameIds } from '@/shared/utils/ids';
import {
  applyServerErrors,
  diffValues,
  firstParseError,
  parseForm,
  stripEmpty,
  zodRule,
} from '@/shared/utils/zodForm';

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
    const getFieldsError = () => [{ name: ['email'] }, { name: ['parent', 'phone'] }];
    const form = { setFields, getFieldsError } as unknown as FormInstance;
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

  it('details không trùng field nào của form (vd 409 kèm id) → false để báo lỗi chung', () => {
    const setFields = vi.fn();
    const form = {
      setFields,
      getFieldsError: () => [{ name: ['effectiveFrom'] }],
    } as unknown as FormInstance;
    const overlap = new ApiError(409, 'SLOT_ASSIGNMENT_OVERLAP', 'trùng', { assignmentId: ['a1'] });
    expect(applyServerErrors(form, overlap)).toBe(false);
    expect(setFields).not.toHaveBeenCalled();
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

describe('firstParseError', () => {
  it('ưu tiên lỗi cả form, rồi lỗi field đầu tiên, cuối cùng là câu chung', () => {
    expect(firstParseError({ formErrors: ['form'], fieldErrors: { a: ['field'] } })).toBe('form');
    expect(firstParseError({ formErrors: [], fieldErrors: { a: ['field'], b: ['other'] } })).toBe('field');
    expect(firstParseError({ formErrors: [], fieldErrors: {} })).toBeTruthy();
  });
});

describe('sameIds', () => {
  it('so tập id, không xét thứ tự', () => {
    expect(sameIds(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(sameIds(['a'], ['a', 'b'])).toBe(false);
    expect(sameIds(['a', 'b'], ['a', 'c'])).toBe(false);
  });
});
