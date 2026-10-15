import { Button, Result } from 'antd';
import type { Permission } from '@phonics/contracts';
import { Link, Outlet } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAuth } from '@/features/auth/authStore';
import { t } from '@/shared/i18n';

/** Chặn route theo quyền (đặt dưới RequireAuth). ADMIN luôn pass; thiếu quyền → 403 giải thích thay vì redirect. */
export function RequirePermission({ permission }: { permission: Permission }) {
  const auth = useAuth();
  if (!auth.can(permission)) {
    return (
      <Result
        status="403"
        title={t.common.forbiddenTitle}
        subTitle={`${t.common.forbiddenSubtitle} (${t.permissionLabel[permission]})`}
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
