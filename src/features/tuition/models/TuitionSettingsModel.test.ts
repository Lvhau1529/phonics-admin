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
});
