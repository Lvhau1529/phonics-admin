import { Tag } from 'antd';
import type { RateSource } from '@phonics/contracts';
import { t } from '@/shared/i18n';

const COLORS: Record<RateSource, string | undefined> = {
  STUDENT_SLOT: 'blue',
  STUDENT: 'blue',
  SLOT: undefined,
  NONE: 'warning',
};

/** Nguồn đơn giá áp dụng: riêng học sinh / mặc định ca / chưa có giá (cảnh báo) */
export function RateSourceTag({ source }: { source: RateSource }) {
  return <Tag color={COLORS[source]}>{t.rateSource[source]}</Tag>;
}
