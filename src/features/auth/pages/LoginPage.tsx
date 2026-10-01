import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { Email, LoginBody } from '@phonics/contracts';
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { login } from '@/features/auth/authStore';
import { useAuth } from '@/features/auth/hooks';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n/vi';
import { COLOR_SIDER } from '@/shared/theme';
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

  useEffect(() => {
    document.title = t.app.title(t.auth.loginTitle);
  }, []);

  if (auth.status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from ?? ROUTES.dashboard;
    return <Navigate to={from} replace />;
  }

  const handleFinish = async (values: LoginValues) => {
    setError(null);
    const parsed = parseForm(LoginBody, values);
    if (!parsed.success) {
      applyFieldErrors(form, parsed.fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await login(parsed.data);
      const from = (location.state as { from?: string } | null)?.from ?? ROUTES.dashboard;
      navigate(from, { replace: true });
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
      style={{ minHeight: '100vh', background: COLOR_SIDER, padding: 16 }}
    >
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Flex vertical align="center" gap={4} style={{ marginBottom: 24 }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t.app.name}
          </Typography.Title>
          <Typography.Text type="secondary">{t.auth.loginSubtitle}</Typography.Text>
        </Flex>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
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
          <Button type="primary" htmlType="submit" block loading={submitting}>
            {t.auth.submit}
          </Button>
        </Form>
      </Card>
    </Flex>
  );
}
