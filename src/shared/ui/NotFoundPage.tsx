import { Button, Result } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { t } from '@/shared/i18n';

/** Trang 404 trong AppShell */
export function NotFoundPage() {
  return (
    <Result
      status="404"
      title={t.common.notFoundTitle}
      subTitle={t.common.notFoundSubtitle}
      extra={
        <Link to={ROUTES.dashboard}>
          <Button type="primary">{t.common.backHome}</Button>
        </Link>
      }
    />
  );
}
