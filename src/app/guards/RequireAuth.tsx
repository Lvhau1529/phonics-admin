import { Navigate, Outlet, useLocation } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAuth } from '@/features/auth/hooks';
import { t } from '@/shared/i18n';
import { FullscreenLoader } from '@/shared/ui/Loading';

/** Chặn route cần đăng nhập: đang khôi phục phiên → spinner; chưa đăng nhập → /login (nhớ trang đang vào) */
export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'loading') {
    return <FullscreenLoader label={t.auth.checking} />;
  }
  if (auth.status !== 'authenticated') {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
