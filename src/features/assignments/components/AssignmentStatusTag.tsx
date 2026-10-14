import { Tag } from 'antd';
import type { AssignmentStatus } from '@phonics/contracts';
import { t } from '@/shared/i18n';

const COLORS: Record<AssignmentStatus, string> = {
  SCHEDULED: 'processing',
  OPEN: 'success',
  CLOSED: 'default',
};

export function AssignmentStatusTag({ status }: { status: AssignmentStatus }) {
  return <Tag color={COLORS[status]}>{t.assignmentStatus[status]}</Tag>;
}
