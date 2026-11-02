import { Tag } from 'antd';
import type { AttendanceMark, AttendanceSessionStatus } from '@phonics/contracts';
import { t } from '@/shared/i18n';

const STATUS_COLORS: Record<AttendanceSessionStatus, string | undefined> = {
  PENDING: 'gold',
  CONFIRMED: 'green',
  CANCELLED: undefined,
};

/** Trạng thái buổi: chờ xác nhận / đã xác nhận / đã huỷ */
export function AttendanceStatusTag({ status }: { status: AttendanceSessionStatus }) {
  return <Tag color={STATUS_COLORS[status]}>{t.attendanceStatus[status]}</Tag>;
}

const MARK_COLORS: Record<AttendanceMark, string | undefined> = {
  PRESENT: 'green',
  ABSENT: 'red',
  EXCUSED: 'blue',
};

/** Điểm danh của một học sinh (chế độ chỉ xem) */
export function AttendanceMarkTag({ mark }: { mark: AttendanceMark }) {
  return <Tag color={MARK_COLORS[mark]}>{t.attendanceMark[mark]}</Tag>;
}
