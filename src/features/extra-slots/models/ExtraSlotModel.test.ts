import type { ExtraRate, ExtraSlot, SlotAssignment } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import {
  appliedRateText,
  ExtraRateModel,
  ExtraSlotModel,
  isActiveOn,
  slotLabel,
  SlotAssignmentModel,
} from '@/features/extra-slots/models/ExtraSlotModel';
import { t } from '@/shared/i18n';
import { formatMoney } from '@/shared/utils/format';

const slotDto: ExtraSlot = {
  id: 'x1',
  name: 'Phonics nâng cao',
  weekday: 2,
  startTime: '18:00',
  endTime: '19:30',
  archivedAt: null,
  room: null,
  capacity: 2,
  class: null,
  teachers: [],
  studentCount: 2,
  defaultPrice: null,
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

  it('nguồn giá theo phạm vi', () => {
    expect(new ExtraRateModel(rateDto).source).toBe('SLOT');
    expect(new ExtraRateModel({ ...rateDto, studentId: 's1', slotId: null }).source).toBe('STUDENT');
    expect(new ExtraRateModel({ ...rateDto, studentId: 's1' }).source).toBe('STUDENT_SLOT');
  });

  it('chưa có giá → nhãn cảnh báo thay vì 0đ', () => {
    expect(appliedRateText({ pricePerSession: 0, source: 'NONE', rateId: null })).toBe(t.rateSource.NONE);
    expect(appliedRateText({ pricePerSession: 120_000, source: 'STUDENT', rateId: 'r2' })).toBe(
      formatMoney(120_000),
    );
  });
});
