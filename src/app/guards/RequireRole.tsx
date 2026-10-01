import { Button, Result } from 'antd';
import type { Role } from '@phonics/contracts';
import { Link, Outlet } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAuth } from '@/features/auth/hooks';
import { t } from '@/shared/i18n/vi';

/** Chặn route theo role (đặt dưới RequireAuth). Sai role → 403 thay vì redirect để người dùng hiểu lý do. */
export function RequireRole({ roles }: { roles: readonly Role[] }) {
  const auth = useAuth();
  if (!auth.hasRole(...roles)) {
    return (
      <Result
        status="403"
        title={t.common.forbiddenTitle}
        subTitle={t.common.forbiddenSubtitle}
        extra={
          <Link to={ROUTES.dashboard}>
            <Button type="primary">{t.common.backHome}</Button>
          </Link>
        }
      />
    );
  }
  return <Outlet />;
}
