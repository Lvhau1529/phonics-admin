import { describe, expect, it } from 'vitest';
import { TuitionNoticeModel } from '@/features/tuition/models/TuitionNoticeModel';
import { TuitionSettingsModel } from '@/features/tuition/models/TuitionSettingsModel';

const notice = {
  key: 'g1',
  guardianId: 'g1',
  guardianName: 'Chị Lan',
  phone: '+84912345678',
  students: [
    {
      id: 's1',
      vietnameseName: 'Nguyễn Văn An',
      englishName: 'Andy',
      className: 'K2A',
      confirmedTotal: 600_000,
      pendingTotal: 200_000,
    },
  ],
  confirmedTotal: 600_000,
  pendingTotal: 200_000,
  transferContent: 'HP T11 2026 ANDY',
};

const settings = new TuitionSettingsModel({
  orgName: null,
  orgAddress: null,
  orgPhone: null,
  bankBin: '970436',
  bankName: 'Vietcombank',
  accountNo: '0123456789',
  accountName: 'NGUYEN THI HOA',
  transferContent: null,
  dueDay: 10,
  note: null,
  showSlot: false,
  noticeTemplate: null,
  updatedAt: null,
});

describe('TuitionNoticeModel', () => {
  it('SĐT hiển thị, link Zalo, tổng tạm tính', () => {
    const m = new TuitionNoticeModel(notice);
    expect(m.phoneText).toBe('0912 345 678');
    expect(m.zaloUrl).toBe('https://zalo.me/0912345678');
    expect(m.phoneIssue).toBeNull();
    expect(m.attendanceTotal).toBe(800_000);
    expect(m.studentNames).toBe('Nguyễn Văn An (Andy)');
  });

  it('phân loại SĐT không mở Zalo được', () => {
    expect(new TuitionNoticeModel({ ...notice, phone: null }).phoneIssue).toBe('missing');
    expect(new TuitionNoticeModel({ ...notice, phone: '+8491234' }).phoneIssue).toBe('invalid');
    expect(new TuitionNoticeModel({ ...notice, phone: '+842438261234' }).phoneIssue).toBe('notMobile');
  });

  it('soạn tin nhắn theo mẫu + cài đặt chuyển khoản', () => {
    const text = new TuitionNoticeModel(notice).message({
      template:
        'Bé {students}: {amount} ({month}), hạn {dueDate}\nSTK {accountNo} {bank}\nND: {transferContent}',
      month: '2026-11',
      amount: 800_000,
      dueDate: '2026-12-10',
      settings,
    });
    expect(text).toBe(
      'Bé Nguyễn Văn An (Andy): 800.000đ (11/2026), hạn 10/12/2026\nSTK 0123456789 Vietcombank\nND: HP T11 2026 ANDY',
    );
  });
});
