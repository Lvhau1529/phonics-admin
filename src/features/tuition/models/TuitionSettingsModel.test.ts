import { describe, expect, it } from 'vitest';
import { TuitionSettingsModel } from '@/features/tuition/models/TuitionSettingsModel';

const empty = {
  orgName: null,
  orgAddress: null,
  orgPhone: null,
  bankBin: null,
  bankName: null,
  accountNo: null,
  accountName: null,
  transferContent: null,
  dueDay: null,
  note: null,
  showSlot: false,
  updatedAt: null,
};

describe('TuitionSettingsModel', () => {
  it('qrReady cần cả mã BIN và số tài khoản', () => {
    expect(new TuitionSettingsModel(empty).qrReady).toBe(false);
    expect(new TuitionSettingsModel({ ...empty, accountNo: '0123456789' }).qrReady).toBe(false);
    expect(new TuitionSettingsModel({ ...empty, accountNo: '0123456789', bankBin: '970436' }).qrReady).toBe(
      true,
    );
  });

  it('usesExtraOptions khi có tên / địa chỉ trung tâm, hạn đóng hoặc bật cột ca', () => {
    expect(new TuitionSettingsModel({ ...empty, accountNo: '0123456789', note: 'x' }).usesExtraOptions).toBe(
      false,
    );
    expect(new TuitionSettingsModel({ ...empty, dueDay: 10 }).usesExtraOptions).toBe(true);
    expect(new TuitionSettingsModel({ ...empty, showSlot: true }).usesExtraOptions).toBe(true);
  });
});
