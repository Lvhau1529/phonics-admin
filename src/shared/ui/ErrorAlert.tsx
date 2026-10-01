import { Alert, Button } from 'antd';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';

interface ErrorAlertProps {
  error: unknown;
  onRetry?: () => void;
}

/** Lỗi tải dữ liệu của trang / tab (message tiếng Việt theo ErrorCode) + nút thử lại */
export function ErrorAlert({ error, onRetry }: ErrorAlertProps) {
  if (!error) return null;
  return (
    <Alert
      type="error"
      showIcon
      message={t.common.errorTitle}
      description={errorMessage(error)}
      action={
        onRetry && (
          <Button size="small" onClick={onRetry}>
            {t.common.retry}
          </Button>
        )
      }
      style={{ marginBottom: 16 }}
    />
  );
}
