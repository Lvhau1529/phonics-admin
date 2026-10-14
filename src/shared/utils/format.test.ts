import { describe, expect, it } from 'vitest';
import { t } from '@/shared/i18n';
import { formatDuration } from '@/shared/utils/format';

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
