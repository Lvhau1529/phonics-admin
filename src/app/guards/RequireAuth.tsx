import { Flex, Spin, Typography } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAuth } from '@/features/auth/hooks';
import { t } from '@/shared/i18n/vi';

/** Chặn route cần đăng nhập: đang khôi phục phiên → spinner; chưa đăng nhập → /login (nhớ trang đang vào) */
export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'loading') {
    return (
      <Flex vertical align="center" justify="center" gap={12} style={{ minHeight: '100vh' }}>
        <Spin size="large" />
        <Typography.Text type="secondary">{t.auth.checking}</Typography.Text>
      </Flex>
    );
  }
  if (auth.status !== 'authenticated') {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
