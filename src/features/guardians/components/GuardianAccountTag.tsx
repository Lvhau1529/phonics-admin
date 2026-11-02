import { Tag } from 'antd';
import type { GuardianModel } from '@/features/guardians/models/GuardianModel';
import { t } from '@/shared/i18n';
import { StatusTag } from '@/shared/ui/RoleTag';

/** Trạng thái tài khoản gia đình: chưa có / đã mời / trạng thái tài khoản */
export function GuardianAccountTag({ guardian }: { guardian: GuardianModel }) {
  const state = guardian.accountState;
  if (state === 'NONE') return <Tag>{t.guardians.accountNone}</Tag>;
  if (state === 'INVITED') return <Tag color="processing">{t.guardians.accountInvited}</Tag>;
  return <StatusTag status={state} />;
}
