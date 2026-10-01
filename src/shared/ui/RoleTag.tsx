import { Tag } from 'antd';
import type { Role, UserStatus } from '@phonics/contracts';
import { t } from '@/shared/i18n';

const ROLE_COLORS: Record<Role, string> = { ADMIN: 'purple', TEACHER: 'blue', STUDENT: 'green' };

export function RoleTag({ role }: { role: Role }) {
  return <Tag color={ROLE_COLORS[role]}>{t.role[role]}</Tag>;
}

export function StatusTag({ status }: { status: UserStatus }) {
  return <Tag color={status === 'ACTIVE' ? 'success' : 'default'}>{t.userStatus[status]}</Tag>;
}
