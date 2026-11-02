import { describe, expect, it } from 'vitest';
import { t } from '@/shared/i18n';
import {
  formatDuration,
  formatMoney,
  formatPriceInput,
  parsePriceInput,
  shortList,
} from '@/shared/utils/format';

describe('formatDuration', () => {
  it('không có giá trị → chuỗi "không có"', () => {
    expect(formatDuration(null)).toBe(t.common.none);
    expect(formatDuration(undefined)).toBe(t.common.none);
  });

  it('m:ss, giây luôn hai chữ số', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(5_000)).toBe('0:05');
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(600_000)).toBe('10:00');
  });

  it('làm tròn tới giây gần nhất', () => {
    expect(formatDuration(1_499)).toBe('0:01');
    expect(formatDuration(1_500)).toBe('0:02');
    expect(formatDuration(59_500)).toBe('1:00');
  });

  it('phút không quay vòng sau 59', () => {
    expect(formatDuration(3_605_000)).toBe('60:05');
    expect(formatDuration(4_500_000)).toBe('75:00');
  });
});

describe('formatMoney', () => {
  it('tiền VND không phần lẻ, rỗng → —', () => {
    expect(formatMoney(150_000)).toMatch(/150[.,]000/);
    expect(formatMoney(150_000)).toContain('₫');
    expect(formatMoney(null)).toBe(t.common.none);
  });
});

describe('shortList', () => {
  it('giữ tối đa 2 tên, phần còn lại thành "+n"; rỗng → none', () => {
    expect(shortList(['Cô Lan'])).toBe('Cô Lan');
    expect(shortList(['Cô Lan', 'Thầy Minh'])).toBe('Cô Lan, Thầy Minh');
    expect(shortList(['Cô Lan', 'Thầy Minh', 'Mr. Nam', 'Ms. Lan'])).toBe('Cô Lan, Thầy Minh +2');
    expect(shortList([])).toBe(t.common.none);
  });
});

describe('formatPriceInput / parsePriceInput', () => {
  it('ô trống giữ trống (không thành 0), có số thì bỏ dấu phân cách', () => {
    expect(formatPriceInput('')).toBe('');
    expect(formatPriceInput(undefined)).toBe('');
    expect(formatPriceInput(150_000)).toMatch(/150[.,]000/);
    expect(parsePriceInput('')).toBe('');
    expect(parsePriceInput('150.000')).toBe(150_000);
    expect(parsePriceInput('0')).toBe(0);
  });
});
