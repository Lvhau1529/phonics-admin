import { EditOutlined, SwapOutlined, UserAddOutlined } from '@ant-design/icons';
import { App, Button, Descriptions, Drawer, Flex, Popconfirm, Skeleton, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { GuardiansService } from '@/features/guardians/api/guardiansService';
import { ConvertFamilyModal } from '@/features/guardians/components/ConvertFamilyModal';
import { GuardianAccountTag } from '@/features/guardians/components/GuardianAccountTag';
import { GuardianChildrenTable } from '@/features/guardians/components/GuardianChildrenTable';
import { GuardianFormDrawer } from '@/features/guardians/components/GuardianFormDrawer';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatDateTime } from '@/shared/utils/format';

interface GuardianDetailDrawerProps {
  guardianId: string | undefined;
  onClose: () => void;
}

/** Chi tiết phụ huynh: liên hệ, tài khoản gia đình, các con; tạo tài khoản / chuyển sang tài khoản gia đình */
export function GuardianDetailDrawer({ guardianId, onClose }: GuardianDetailDrawerProps) {
  const { message } = App.useApp();
  const detail = GuardiansService.useDetail(guardianId);
  const createAccount = GuardiansService.useCreateFamilyAccount();
  const [editing, setEditing] = useState(false);
  const [converting, setConverting] = useState(false);
  const g = detail.data;

  const handleCreateAccount = async () => {
    if (!g) return;
    try {
      const res = await createAccount.mutateAsync(g.id);
      message.success(
        `${t.guardians.accountCreated}. ${res.inviteSent ? t.guardians.inviteSent : t.guardians.inviteNotSent}`,
      );
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  return (
    <Drawer
      open={!!guardianId}
      onClose={onClose}
      title={g?.fullName ?? t.guardians.title}
      width={760}
      destroyOnHidden
      extra={
        g && (
          <Flex gap={8} wrap>
            <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
              {t.common.edit}
            </Button>
            {!g.account && (
              <Popconfirm
                title={t.guardians.createAccountConfirm(g.email ?? '')}
                disabled={!g.canCreateAccount}
                onConfirm={() => handleCreateAccount()}
                okText={t.common.confirm}
                cancelText={t.common.cancel}
              >
                <Tooltip title={g.canCreateAccount ? undefined : t.guardians.createAccountNeedsEmail}>
                  <Button
                    icon={<UserAddOutlined />}
                    disabled={!g.canCreateAccount}
                    loading={createAccount.isPending}
                  >
                    {t.guardians.createAccount}
                  </Button>
                </Tooltip>
              </Popconfirm>
            )}
            <Button type="primary" icon={<SwapOutlined />} onClick={() => setConverting(true)}>
              {t.guardians.convert}
            </Button>
          </Flex>
        )
      }
    >
      {detail.isLoading && <Skeleton active />}
      <ErrorAlert error={detail.error} onRetry={() => void detail.refetch()} />
      {g && (
        <Flex vertical gap={16}>
          <Descriptions size="small" column={{ xs: 1, sm: 2 }} bordered>
            <Descriptions.Item label={t.common.email}>{g.email ?? t.common.none}</Descriptions.Item>
            <Descriptions.Item label={t.guardians.phone}>{g.phoneText || t.common.none}</Descriptions.Item>
            <Descriptions.Item label={t.guardians.account}>
              <GuardianAccountTag guardian={g} />
            </Descriptions.Item>
            <Descriptions.Item label={t.guardians.lastLogin}>{g.lastLoginText}</Descriptions.Item>
            <Descriptions.Item label={t.common.createdAt}>{formatDateTime(g.createdAt)}</Descriptions.Item>
            <Descriptions.Item label={t.common.note} span={2}>
              <Typography.Text type={g.note ? undefined : 'secondary'}>
                {g.note ?? t.common.none}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t.guardians.children}
          </Typography.Title>
          <GuardianChildrenTable items={g.children} />
        </Flex>
      )}
      <GuardianFormDrawer open={editing} guardian={g} onClose={() => setEditing(false)} />
      {converting && g && <ConvertFamilyModal key={g.id} guardian={g} onClose={() => setConverting(false)} />}
    </Drawer>
  );
}
