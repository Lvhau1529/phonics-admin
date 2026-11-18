import { describe, expect, it } from 'vitest';
import { calendarRange, mondayOf, shiftAnchor } from '@/features/attendance/components/calendarRange';

describe('calendarRange', () => {
  it('thứ Hai của tuần (CN thuộc tuần trước)', () => {
    expect(mondayOf('2026-11-18')).toBe('2026-11-16');
    expect(mondayOf('2026-11-16')).toBe('2026-11-16');
    expect(mondayOf('2026-11-22')).toBe('2026-11-16');
  });

  it('tuần: T2–CN', () => {
    const r = calendarRange('week', '2026-11-18');
    expect([r.from, r.to, r.days.length]).toEqual(['2026-11-16', '2026-11-22', 7]);
  });

  it('tháng: đủ tuần phủ tháng, tối đa 42 ngày (giới hạn API)', () => {
    const nov = calendarRange('month', '2026-11-18');
    expect([nov.from, nov.to]).toEqual(['2026-10-26', '2026-12-06']);
    expect(nov.days.length).toBe(42);
    // 02/2027 bắt đầu Thứ Hai, 28 ngày → đúng 4 tuần
    expect(calendarRange('month', '2027-02-10').days.length).toBe(28);
  });

  it('lùi / tiến theo chế độ', () => {
    expect(shiftAnchor('week', '2026-11-18', 1)).toBe('2026-11-25');
    expect(shiftAnchor('month', '2026-11-18', -1)).toBe('2026-10-18');
  });
});
