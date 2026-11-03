import type {
  AttendanceRecord,
  AttendanceSessionDetail,
  DigestSession,
  SlotAssignment,
} from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import {
  affectedDelta,
  AttendanceSessionDetailModel,
  DigestSessionModel,
  sessionDateText,
  signedMoney,
} from '@/features/attendance/models/AttendanceSessionModel';
import { SlotAssignmentModel } from '@/features/extra-slots/models/ExtraSlotModel';
import { t } from '@/shared/i18n';
import { formatDate, formatDateTime, formatMoney } from '@/shared/utils/format';

const record = (over: Partial<AttendanceRecord>): AttendanceRecord => ({
  studentId: 's1',
  displayName: 'Andy',
  vietnameseName: 'Nguyễn Văn An',
  englishName: 'Andy',
  avatarKey: 'tiger',
  mark: 'PRESENT',
  charged: true,
  unitPrice: 120_000,
  missingRate: false,
  source: 'SNAPSHOT',
  note: null,
  updatedAt: '2026-11-03T12:00:00.000Z',
  ...over,
});

const sessionDto: AttendanceSessionDetail = {
  id: 'a1',
  slot: {
    id: 'x1',
    name: 'Phonics T3',
    weekday: 2,
    startTime: '18:00',
    endTime: '19:30',
    startsOn: null,
    endsOn: null,
    archivedAt: null,
  },
  date: '2026-11-03',
  startTime: '18:00',
  endTime: '19:30',
  startsAt: '2026-11-03T11:00:00.000Z',
  endsAt: '2026-11-03T12:30:00.000Z',
  teachers: [],
  status: 'CONFIRMED',
  studentCount: 3,
  presentCount: 2,
  recordsVersion: 1,
  missingRateCount: 0,
  confirmedBy: { id: 't1', displayName: 'Cô Lan' },
  confirmedAt: '2026-11-03T14:05:00.000Z',
  confirmedVia: 'EMAIL',
  cancelReason: null,
  note: null,
  records: [
    record({}),
    record({ studentId: 's2', mark: 'ABSENT', charged: false }),
    record({ studentId: 's3', unitPrice: 100_000, source: 'MANUAL' }),
  ],
  canEdit: true,
  canEditBilling: false,
};

describe('AttendanceSessionModel', () => {
  it('nhãn, có mặt / sĩ số, người xác nhận', () => {
    const s = new AttendanceSessionDetailModel(sessionDto);
    expect(s.title).toBe('Phonics T3');
    expect(s.presentText).toBe('2 / 3');
    expect(s.statusLabel).toBe(t.attendanceStatus.CONFIRMED);
    expect(s.confirmedText).toBe(
      `Cô Lan · ${formatDateTime('2026-11-03T14:05:00.000Z')} · ${t.confirmedVia.EMAIL}`,
    );
    expect(s.editable).toBe(true);
    expect(s.records[2].isManual).toBe(true);
    expect(s.records[1].markLabel).toBe(t.attendanceMark.ABSENT);
  });

  it('tổng tiền chỉ tính bản ghi có tính phí; không xem được giá → null', () => {
    expect(new AttendanceSessionDetailModel(sessionDto).chargedTotal).toBe(220_000);
    const hidden = { ...sessionDto, records: sessionDto.records.map((r) => ({ ...r, unitPrice: null })) };
    expect(new AttendanceSessionDetailModel(hidden).chargedTotal).toBeNull();
  });

  it('buổi bù (không ca) và buổi huỷ không sửa được', () => {
    const makeUp = new AttendanceSessionDetailModel({ ...sessionDto, slot: null, status: 'CANCELLED' });
    expect(makeUp.isMakeUp).toBe(true);
    expect(makeUp.title).toBe(t.attendance.makeUp);
    expect(makeUp.editable).toBe(false);
    expect(makeUp.confirmedText).not.toBeNull();
  });

  it('ngày kèm thứ: 03/11/2026 là Thứ Ba, Chủ nhật là ISO 7', () => {
    expect(sessionDateText('2026-11-03')).toBe(`${t.weekdayShort[2]} ${formatDate('2026-11-03')}`);
    expect(sessionDateText('2026-11-08')).toBe(`${t.weekdayShort[7]} ${formatDate('2026-11-08')}`);
  });
});

describe('DigestSessionModel', () => {
  const dto: DigestSession = {
    id: 'a1',
    slotName: null,
    date: '2026-11-03',
    startTime: '18:00',
    endTime: '19:30',
    studentCount: 8,
    presentCount: 7,
    status: 'PENDING',
    changed: false,
    confirmedByName: null,
    confirmedAt: null,
  };

  it('chỉ duyệt được buổi còn chờ và danh sách chưa đổi', () => {
    expect(new DigestSessionModel(dto).canConfirm).toBe(true);
    expect(new DigestSessionModel({ ...dto, changed: true }).canConfirm).toBe(false);
    expect(new DigestSessionModel({ ...dto, status: 'CONFIRMED' }).canConfirm).toBe(false);
    expect(new DigestSessionModel(dto).title).toBe(t.attendance.makeUp);
    expect(new DigestSessionModel(dto).countText).toBe(t.attendance.countText(8, 7));
    expect(new DigestSessionModel(dto).confirmedText).toBeNull();
  });
});

describe('ảnh hưởng của sửa lịch / giá', () => {
  it('chênh lệch chỉ tính bản ghi có tính phí', () => {
    const records = [
      {
        sessionId: 'a',
        studentId: 's',
        date: '2026-10-01',
        oldPrice: 100_000,
        newPrice: 120_000,
        charged: true,
      },
      {
        sessionId: 'b',
        studentId: 's',
        date: '2026-10-08',
        oldPrice: 100_000,
        newPrice: 120_000,
        charged: false,
      },
      {
        sessionId: 'c',
        studentId: 's',
        date: '2026-10-15',
        oldPrice: 150_000,
        newPrice: 120_000,
        charged: true,
      },
    ];
    expect(affectedDelta(records)).toBe(-10_000);
    expect(signedMoney(20_000)).toBe(`+${formatMoney(20_000)}`);
    expect(signedMoney(-10_000)).toBe(formatMoney(-10_000));
  });

  it('response lịch không kèm affectedSessions → rỗng', () => {
    const dto: SlotAssignment = {
      id: 'g1',
      studentId: 's1',
      slot: sessionDto.slot!,
      effectiveFrom: '2026-10-01',
      effectiveTo: null,
      note: null,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };
    expect(new SlotAssignmentModel(dto).affectedSessions).toEqual([]);
    const affected = [{ sessionId: 'a', date: '2026-10-06', slotName: 'Phonics T3', change: 'ADD' as const }];
    expect(new SlotAssignmentModel({ ...dto, affectedSessions: affected }).affectedSessions).toEqual(
      affected,
    );
  });
});
