import type { RangePreset } from '@phonics/contracts';

/** Giá trị khoảng thời gian: preset của API hoặc tuỳ chọn from/to (ngày YYYY-MM-DD) */
export interface RangeValue {
  range: RangePreset;
  from?: string;
  to?: string;
}

export const DEFAULT_RANGE: RangeValue = { range: 'all' };

/** Tham số gửi API: preset, hoặc from/to khi tuỳ chọn (from/to ghi đè range phía server) */
export function rangeParams(value: RangeValue): { range?: RangePreset; from?: string; to?: string } {
  if (value.from && value.to) return { from: value.from, to: value.to };
  return { range: value.range };
}
