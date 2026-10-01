import { LogoutOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Descriptions, Flex, Form, Input, Popconfirm, Row } from 'antd';
import {
  ChangePasswordBody,
  DisplayName,
  Password,
  UpdateProfileBody,
  type AvatarKey,
} from '@phonics/contracts';
import { useEffect } from 'react';
import { authApi } from '@/features/auth/api';
import { setCurrentUser, signOut } from '@/features/auth/authStore';
import { useAuth } from '@/features/auth/hooks';
import { useMutation } from '@tanstack/react-query';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n/vi';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { AvatarSelect } from '@/shared/ui/AvatarSelect';
import { PageHeader } from '@/shared/ui/PageHeader';
import { RoleTag } from '@/shared/ui/RoleTag';
import {
  applyFieldErrors,
  applyServerErrors,
  diffValues,
  parseForm,
  stripEmpty,
  zodRule,
} from '@/shared/utils/zodForm';
import { formatDateTime } from '@/shared/utils/format';

interface ProfileValues {
  displayName: string;
  avatarKey: AvatarKey;
}

interface PasswordValues {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export function ProfilePage() {
  const { message } = App.useApp();
  const auth = useAuth();
  const user = auth.user!;
  const [profileForm] = Form.useForm<ProfileValues>();
  const [passwordForm] = Form.useForm<PasswordValues>();

  useEffect(() => {
    profileForm.setFieldsValue({ displayName: user.displayName, avatarKey: user.avatarKey });
  }, [user, profileForm]);

  const updateProfile = useMutation({ mutationFn: authApi.updateProfile, onSuccess: setCurrentUser });
  const changePassword = useMutation({ mutationFn: authApi.changePassword });

  const handleProfile = async (raw: ProfileValues) => {
    const diff = diffValues(
      { displayName: user.displayName, avatarKey: user.avatarKey },
      stripEmpty({ ...raw }),
    );
    if (Object.keys(diff).length === 0) return void message.info(t.common.noChanges);
    const parsed = parseForm(UpdateProfileBody, diff);
    if (!parsed.success) return applyFieldErrors(profileForm, parsed.fieldErrors);
    try {
      await updateProfile.mutateAsync(parsed.data);
      message.success(t.common.updated);
    } catch (error) {
      if (!applyServerErrors(profileForm, error)) message.error(errorMessage(error));
    }
  };

  const handlePassword = async (raw: PasswordValues) => {
    if (raw.newPassword !== raw.confirmPassword) {
      return applyFieldErrors(passwordForm, { confirmPassword: [t.profile.passwordMismatch] });
    }
    const parsed = parseForm(
      ChangePasswordBody,
      stripEmpty({ currentPassword: raw.currentPassword, newPassword: raw.newPassword }),
    );
    if (!parsed.success) return applyFieldErrors(passwordForm, parsed.fieldErrors);
    try {
      await changePassword.mutateAsync(parsed.data);
      message.success(t.profile.passwordChanged);
      // Server thu hồi mọi phiên sau khi đổi mật khẩu → đăng xuất cục bộ
      await signOut();
    } catch (error) {
      if (!applyServerErrors(passwordForm, error)) message.error(errorMessage(error));
    }
  };

  return (
    <>
      <PageHeader title={t.profile.title} />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.profile.info}>
            <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
              <AvatarImg avatarKey={user.avatarKey} name={user.displayName} size={56} />
              <Descriptions size="small" column={1}>
                <Descriptions.Item label={t.common.email}>{user.email}</Descriptions.Item>
                <Descriptions.Item label={t.common.status}>
                  <RoleTag role={user.role} /> {t.provider[user.provider]}
                </Descriptions.Item>
                <Descriptions.Item label={t.common.createdAt}>
                  {formatDateTime(user.createdAt)}
                </Descriptions.Item>
              </Descriptions>
            </Flex>
            <Form<ProfileValues> form={profileForm} layout="vertical" onFinish={handleProfile}>
              <Form.Item
                name="displayName"
                label={t.profile.displayName}
                rules={[{ required: true, message: t.common.requiredField }, zodRule(DisplayName)]}
              >
                <Input maxLength={30} />
              </Form.Item>
              <Form.Item name="avatarKey" label={t.profile.avatar}>
                <AvatarSelect />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={updateProfile.isPending}>
                {t.common.save}
              </Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t.profile.changePassword} style={{ marginBottom: 16 }}>
            <Form<PasswordValues> form={passwordForm} layout="vertical" onFinish={handlePassword}>
              <Form.Item
                name="currentPassword"
                label={t.profile.currentPassword}
                extra={t.profile.currentPasswordHint}
              >
                <Input.Password autoComplete="current-password" />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label={t.profile.newPassword}
                rules={[{ required: true, message: t.common.requiredField }, zodRule(Password)]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label={t.profile.confirmPassword}
                rules={[{ required: true, message: t.common.requiredField }]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={changePassword.isPending}>
                {t.profile.changePassword}
              </Button>
            </Form>
          </Card>
          <Card title={t.profile.sessions}>
            <Flex gap={8} wrap>
              <Button icon={<LogoutOutlined />} onClick={() => void signOut()}>
                {t.profile.signOutThis}
              </Button>
              <Popconfirm
                title={t.profile.confirmSignOutAll}
                onConfirm={() => void signOut(true)}
                okText={t.common.confirm}
                cancelText={t.common.cancel}
              >
                <Button danger icon={<LogoutOutlined />}>
                  {t.profile.signOutAll}
                </Button>
              </Popconfirm>
            </Flex>
          </Card>
        </Col>
      </Row>
    </>
  );
}

export default ProfilePage;
