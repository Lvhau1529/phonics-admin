import { describe, expect, it } from 'vitest';
import { StudentTuitionModel, TuitionSlotModel } from '@/features/tuition/models/TuitionModel';
import { setLang } from '@/shared/i18n';

const month = (m: string, confirmed: number, pending: number, present: number, absent = 0) => ({
  month: m,
  confirmedTotal: confirmed,
  pendingTotal: pending,
  chargedCount: present,
  presentCount: present,
  absentCount: absent,
  excusedCount: 0,
  studentCount: present + absent ? 1 : 0,
});

describe('TuitionModel', () => {
  it('tổng tạm tính, tỉ lệ có mặt, trung bình theo tháng có điểm danh, tháng có điểm danh', () => {
    setLang('vi');
    const m = new StudentTuitionModel({
      from: '2026-09',
      to: '2026-11',
      months: [
        month('2026-09', 300_000, 0, 3, 1),
        month('2026-10', 0, 0, 0),
        month('2026-11', 100_000, 200_000, 3),
      ],
      totals: { ...month('x', 400_000, 200_000, 6, 1), studentCount: 1 },
    });
    expect(m.totals.total).toBe(600_000);
    expect(m.totals.avgPerMonth).toBe(300_000);
    expect(m.totals.attendanceRate).toBeCloseTo(6 / 7);
    expect(m.activeMonths.map((x) => x.month)).toEqual(['2026-09', '2026-11']);
    expect(m.months[0]?.label).toBe('09/2026');
    expect(m.months[0]?.shortLabel).toBe('09/26');
    expect(m.months[1]?.attendanceRate).toBeNull();
  });

  it('ca null = buổi bù', () => {
    setLang('vi');
    const s = new TuitionSlotModel({ ...month('x', 0, 0, 1), slotId: null, slotName: null });
    expect(s.label).toBe('Buổi bù');
  });
});
