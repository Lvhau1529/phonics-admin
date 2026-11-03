import type { ExtraRate, ExtraSlot, SlotAssignment } from '@phonics/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appliedRateText,
  lastSessionBefore,
  ExtraRateModel,
  ExtraSlotModel,
  isActiveOn,
  slotLabel,
  SlotAssignmentModel,
} from '@/features/extra-slots/models/ExtraSlotModel';
import { t } from '@/shared/i18n';
import { formatDate, formatMoney } from '@/shared/utils/format';

const slotDto: ExtraSlot = {
  id: 'x1',
  name: 'Phonics nâng cao',
  weekday: 2,
  startTime: '18:00',
  endTime: '19:30',
  startsOn: null,
  endsOn: null,
  archivedAt: null,
  room: null,
  capacity: 2,
  class: null,
  teachers: [],
  studentCount: 2,
  defaultPrice: null,
  nextSessionDate: '2026-11-03',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const rateDto: ExtraRate = {
  id: 'r1',
  studentId: null,
  slotId: 'x1',
  pricePerSession: 150_000,
  effectiveFrom: '2026-10-01',
  effectiveTo: null,
  note: null,
  createdBy: null,
  createdAt: '2026-10-01T00:00:00.000Z',
};

describe('ExtraSlotModel', () => {
  it('nhãn thứ / giờ / sĩ số / giá', () => {
    const slot = new ExtraSlotModel(slotDto);
    expect(slot.timeRange).toBe('18:00–19:30');
    expect(slot.timeText).toBe(`${t.weekdayShort[2]} 18:00–19:30`);
    expect(slot.label).toBe(slotLabel(slotDto));
    expect(slot.weekdayLabel).toBe(t.weekday[2]);
    expect(slot.isFull).toBe(true);
    expect(slot.teacherNames).toBe(t.extraSlots.noTeachers);
    expect(slot.defaultPriceText).toBeNull();
    expect(new ExtraSlotModel({ ...slotDto, defaultPrice: 150_000 }).defaultPriceText).toContain(
      formatMoney(150_000),
    );
  });
});

describe('SlotAssignmentModel', () => {
  const dto: SlotAssignment = {
    id: 'a1',
    studentId: 's1',
    slot: slotDto,
    effectiveFrom: '2026-10-01',
    effectiveTo: '2026-11-01',
    note: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  it('khoảng ngày nửa mở [from, to)', () => {
    expect(isActiveOn(dto, '2026-10-01')).toBe(true);
    expect(isActiveOn(dto, '2026-10-31')).toBe(true);
    expect(isActiveOn(dto, '2026-11-01')).toBe(false);
    expect(isActiveOn({ ...dto, effectiveTo: null }, '2030-01-01')).toBe(true);
  });

  it('trạng thái theo ngày + còn mở để rời / chuyển ca', () => {
    const a = new SlotAssignmentModel(dto);
    expect(a.statusOn('2026-09-30')).toBe('upcoming');
    expect(a.statusOn('2026-10-15')).toBe('active');
    expect(a.statusOn('2026-11-01')).toBe('ended');
    expect(a.isOpen('2026-10-15')).toBe(true);
    expect(a.isOpen('2026-11-01')).toBe(false);
    expect(new SlotAssignmentModel({ ...dto, effectiveTo: null }).toText).toBe(t.common.none);
  });
});

describe('ExtraRateModel', () => {
  it('đang áp dụng / đã dừng / bị thay thế từ đầu', () => {
    expect(new ExtraRateModel(rateDto).state).toBe('current');
    expect(new ExtraRateModel({ ...rateDto, effectiveTo: '2026-11-01' }).state).toBe('ended');
    expect(new ExtraRateModel({ ...rateDto, effectiveTo: '2026-10-01' }).state).toBe('superseded');
  });

  describe('theo hôm nay (05/11/2026)', () => {
    afterEach(() => vi.useRealTimers());
    const at = () => vi.useFakeTimers({ now: new Date('2026-11-05T05:00:00Z'), toFake: ['Date'] });

    it('có hạn trong tương lai vẫn đang áp dụng; chưa tới ngày bắt đầu → sắp áp dụng', () => {
      at();
      const own = { ...rateDto, studentId: 's1', slotId: null };
      expect(new ExtraRateModel({ ...own, effectiveTo: '2026-12-01' }).state).toBe('current');
      expect(new ExtraRateModel({ ...own, effectiveFrom: '2026-12-01' }).state).toBe('upcoming');
      expect(new ExtraRateModel({ ...own, effectiveTo: '2026-11-05' }).state).toBe('ended');
    });

    it('chỉ giá riêng học sinh chưa hết mới kết thúc được; hiện ngày hết', () => {
      at();
      const own = new ExtraRateModel({ ...rateDto, studentId: 's1', effectiveTo: '2026-12-01' });
      expect(own.canEnd).toBe(true);
      expect(own.endsText).toBe(t.extraSlots.rateEndsFrom(formatDate('2026-12-01')));
      expect(new ExtraRateModel(rateDto).canEnd).toBe(false);
      expect(new ExtraRateModel({ ...rateDto, studentId: 's1', effectiveTo: '2026-11-01' }).canEnd).toBe(
        false,
      );
    });
  });

  it('nguồn giá theo phạm vi', () => {
    expect(new ExtraRateModel(rateDto).source).toBe('SLOT');
    expect(new ExtraRateModel({ ...rateDto, studentId: 's1', slotId: null }).source).toBe('STUDENT');
    expect(new ExtraRateModel({ ...rateDto, studentId: 's1' }).source).toBe('STUDENT_SLOT');
  });

  it('chưa có giá → nhãn cảnh báo thay vì 0đ', () => {
    expect(appliedRateText({ pricePerSession: 0, source: 'NONE', rateId: null })).toBe(t.rateSource.NONE);
    // Giá 0đ đã đặt = miễn phí, khác "chưa có giá"
    expect(appliedRateText({ pricePerSession: 0, source: 'STUDENT', rateId: 'r3' })).toBe(t.extraSlots.free);
    expect(appliedRateText({ pricePerSession: 120_000, source: 'STUDENT', rateId: 'r2' })).toBe(
      formatMoney(120_000),
    );
  });
});

describe('ngày ngừng ca', () => {
  it('buổi cuối là cùng thứ ngay trước ngày ngừng; không còn buổi thì null', () => {
    // Ca Thứ Ba, ngừng từ Thứ Ba 01/12/2026 → buổi cuối 24/11
    expect(lastSessionBefore({ weekday: 2, startsOn: null }, '2026-12-01', '2026-11-03')).toBe('2026-11-24');
    // Ngừng từ Thứ Tư 02/12 → buổi cuối Thứ Ba 01/12
    expect(lastSessionBefore({ weekday: 2, startsOn: null }, '2026-12-02', '2026-11-03')).toBe('2026-12-01');
    expect(lastSessionBefore({ weekday: 2, startsOn: null }, '2026-11-04', '2026-11-04')).toBeNull();
  });

  it('getter: hẹn ngừng, buổi tới, giá 0 trên thẻ', () => {
    const slot = new ExtraSlotModel({ ...slotDto, endsOn: '2026-12-01', defaultPrice: 0 });
    expect(slot.isStopping).toBe(true);
    expect(slot.stopsText).toBe(t.extraSlots.stopsFrom(formatDate('2026-12-01')));
    expect(slot.nextSessionText).toBe(`${t.weekdayShort[2]} ${formatDate('2026-11-03')}`);
    expect(slot.defaultPriceText).toBe(t.extraSlots.free);
    const ended = new ExtraSlotModel({
      ...slotDto,
      archivedAt: '2026-11-03T00:00:00.000Z',
      nextSessionDate: null,
    });
    expect(ended.isStopping).toBe(false);
    expect(ended.nextSessionText).toBe(t.extraSlots.noNextSession);
  });
});
