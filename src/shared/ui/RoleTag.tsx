import { Tag } from 'antd';
import type { Role, UserStatus } from '@phonics/contracts';
import { t } from '@/shared/i18n';

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'purple',
  TEACHER: 'blue',
  STUDENT: 'green',
  PARENT: 'gold',
};
const STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE: 'success',
  DISABLED: 'default',
  PENDING: 'warning',
  REJECTED: 'error',
};

export function RoleTag({ role }: { role: Role }) {
  return <Tag color={ROLE_COLORS[role]}>{t.role[role]}</Tag>;
}

export function StatusTag({ status }: { status: UserStatus }) {
  return <Tag color={STATUS_COLORS[status]}>{t.userStatus[status]}</Tag>;
}
