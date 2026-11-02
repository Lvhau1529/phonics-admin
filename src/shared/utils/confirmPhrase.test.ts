import { describe, expect, it } from 'vitest';
import { matchesConfirmPhrase } from '@/shared/utils/confirmPhrase';

describe('matchesConfirmPhrase', () => {
  it('khớp không phân biệt dấu, hoa thường, khoảng trắng thừa', () => {
    expect(matchesConfirmPhrase('xoa', 'XÓA')).toBe(true);
    expect(matchesConfirmPhrase('Xoá', 'XÓA')).toBe(true);
    expect(matchesConfirmPhrase('  doi   gia ', 'ĐỔI GIÁ')).toBe(true);
    expect(matchesConfirmPhrase('delete', 'DELETE')).toBe(true);
  });

  it('không khớp khi thiếu / sai chữ hoặc để trống', () => {
    expect(matchesConfirmPhrase('', 'XÓA')).toBe(false);
    expect(matchesConfirmPhrase('xo', 'XÓA')).toBe(false);
    expect(matchesConfirmPhrase('doigia', 'ĐỔI GIÁ')).toBe(false);
  });
});
