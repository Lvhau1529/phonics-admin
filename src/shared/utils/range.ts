import { RangePreset } from '@phonics/contracts';
import { type ValueOf } from '@/shared/types';

/** Giá trị khoảng thời gian: preset của API hoặc tuỳ chọn from/to (ngày YYYY-MM-DD) */
export interface RangeValue {
  range: RangePreset;
  from?: string;
  to?: string;
}

/** Lựa chọn của RangePicker: preset của API + `custom` (chỉ phía client, gửi from/to) */
export const RangeOption = { ...RangePreset.enum, CUSTOM: 'custom' } as const;
export type RangeOption = ValueOf<typeof RangeOption>;

export const DEFAULT_RANGE: RangeValue = { range: RangePreset.enum.all };

/** Tham số gửi API: preset, hoặc from/to khi tuỳ chọn (from/to ghi đè range phía server) */
export function rangeParams(value: RangeValue): { range?: RangePreset; from?: string; to?: string } {
  if (value.from && value.to) return { from: value.from, to: value.to };
  return { range: value.range };
}
