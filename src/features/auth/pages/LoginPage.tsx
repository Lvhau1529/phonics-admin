import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Flex, Form, Grid, Input, Typography } from 'antd';
import { Email, LoginBody } from '@phonics/contracts';
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AuthStatus, login, loginWithGoogle, useAuth } from '@/features/auth/authStore';
import { errorMessage, isApiError } from '@/shared/api/errors';
import { GOOGLE_CLIENT_ID } from '@/shared/config';
import { t } from '@/shared/i18n';
import { THEME_COLORS } from '@/shared/theme/theme';
import { useThemeMode } from '@/shared/theme/themeStore';
import { BrandMark } from '@/shared/ui/BrandMark';
import { GoogleSignInButton } from '@/shared/ui/GoogleSignInButton';
import { LangSwitch } from '@/shared/ui/LangSwitch';
import { ThemeSwitch } from '@/shared/ui/ThemeSwitch';
import { applyFieldErrors, applyServerErrors, parseForm, zodRule } from '@/shared/utils/zodForm';

interface LoginValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm<LoginValues>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Yêu cầu tài khoản đang chờ duyệt (403 ACCOUNT_PENDING) — báo dạng thông tin, không phải lỗi */
  const [pending, setPending] = useState<string | null>(null);
  const mode = useThemeMode();
  const colors = THEME_COLORS[mode];
  // Mobile: thu padding thẻ để ô nhập / nút Google có đủ bề ngang (vẫn chừa lề hai bên)
  const screens = Grid.useBreakpoint();
  const cardPadding = screens.sm === false ? 20 : 32;

  useEffect(() => {
    document.title = t.app.title(t.auth.loginTitle);
  }, []);

  if (auth.status === AuthStatus.AUTHENTICATED) {
    const from = (location.state as { from?: string } | null)?.from ?? ROUTES.dashboard;
    return <Navigate to={from} replace />;
  }

  const goBack = () => {
    const from = (location.state as { from?: string } | null)?.from ?? ROUTES.dashboard;
    navigate(from, { replace: true });
  };

  const handleGoogle = async (idToken: string) => {
    setError(null);
    setPending(null);
    setSubmitting(true);
    try {
      await loginWithGoogle(idToken);
      goBack();
    } catch (err) {
      if (isApiError(err) && err.code === 'ACCOUNT_PENDING') setPending(errorMessage(err));
      else setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async (values: LoginValues) => {
    setError(null);
    setPending(null);
    const parsed = parseForm(LoginBody, values);
    if (!parsed.success) {
      applyFieldErrors(form, parsed.fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await login(parsed.data);
      goBack();
    } catch (err) {
      if (!applyServerErrors(form, err)) setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: colors.bgLayout,
        padding: '72px 16px 16px',
      }}
    >
      {/* Ngôn ngữ + sáng / tối ở góc trên bên phải, giống header trong app */}
      <Flex gap={12} style={{ position: 'absolute', top: 16, right: 16 }}>
        <LangSwitch />
        <ThemeSwitch />
      </Flex>
      <Card style={{ width: '100%', maxWidth: 420 }} styles={{ body: { padding: cardPadding } }}>
        <Flex vertical align="center" gap={8} style={{ marginBottom: 28 }}>
          <BrandMark size={52} />
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t.app.name}
          </Typography.Title>
          <Typography.Text type="secondary">{t.auth.loginSubtitle}</Typography.Text>
        </Flex>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        {pending && <Alert type="info" showIcon message={pending} style={{ marginBottom: 16 }} />}
        <Form<LoginValues> form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label={t.auth.email}
            rules={[{ required: true, message: t.common.requiredField }, zodRule(Email)]}
          >
            <Input prefix={<MailOutlined />} autoComplete="username" autoFocus />
          </Form.Item>
          <Form.Item
            name="password"
            label={t.auth.password}
            rules={[{ required: true, message: t.common.requiredField }]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
            {t.auth.submit}
          </Button>
        </Form>
        {GOOGLE_CLIENT_ID && (
          <>
            <Divider plain>{t.auth.or}</Divider>
            <Flex vertical align="center" gap={8} style={{ width: '100%' }}>
              <GoogleSignInButton
                onCredential={(idToken) => void handleGoogle(idToken)}
                disabled={submitting}
              />
              <Typography.Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
                {t.auth.googleHint}
              </Typography.Text>
            </Flex>
          </>
        )}
      </Card>
    </Flex>
  );
}
