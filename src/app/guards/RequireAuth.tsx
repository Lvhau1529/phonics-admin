import { Navigate, Outlet, useLocation } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AuthStatus, useAuth } from '@/features/auth/authStore';
import { t } from '@/shared/i18n';
import { FullscreenLoader } from '@/shared/ui/Loading';

/** Chặn route cần đăng nhập: đang khôi phục phiên → spinner; chưa đăng nhập → /login (nhớ trang đang vào) */
export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === AuthStatus.LOADING) {
    return <FullscreenLoader label={t.auth.checking} />;
  }
  if (auth.status !== AuthStatus.AUTHENTICATED) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
