import { Alert, App, List, Modal, Skeleton, Typography } from 'antd';
import { AccountDeleteService } from '@/features/account-delete/api/accountDeleteService';
import { type DeleteTargetKind } from '@/features/account-delete/api/accountDeleteRepository';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { TypedConfirmModal } from '@/shared/ui/TypedConfirmModal';
import { formatNumber } from '@/shared/utils/format';

export interface DeleteTarget {
  kind: DeleteTargetKind;
  id: string;
  name: string;
}

interface DeleteAccountModalProps {
  target: DeleteTarget | undefined;
  onClose: () => void;
  /** Sau khi xoá (vd trang chi tiết chuyển về danh sách) */
  onDeleted?: () => void;
}

/**
 * Xoá (mềm) học sinh / giáo viên / phụ huynh (admin): ẩn khỏi hệ thống, khoá đăng nhập, gỡ liên kết đang có; dữ liệu
 * cũ giữ trong DB. Hiện liên kết sẽ gỡ, gõ lại tên để xác nhận. API cũ còn chặn xoá → nhánh `blockers` báo lý do.
 */
export function DeleteAccountModal({ target, onClose, onDeleted }: DeleteAccountModalProps) {
  const { message } = App.useApp();
  const preview = AccountDeleteService.usePreview(target?.kind ?? 'student', target?.id);
  const remove = AccountDeleteService.useRemove();
  const data = preview.data;

  if (target && data && !data.canDelete)
    return (
      <Modal
        open
        title={t.accountDelete.title(target.name)}
        onCancel={onClose}
        onOk={onClose}
        okText={t.common.close}
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Alert
          type="error"
          showIcon
          message={t.accountDelete.blockedTitle}
          description={
            <>
              <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                {data.blockers.map((b) => (
                  <li key={b}>{t.accountDelete.blocker[b]}</li>
                ))}
              </ul>
              {t.accountDelete.blockedHint}
            </>
          }
        />
      </Modal>
    );

  const handleOk = async () => {
    if (!target || !data) return;
    try {
      await remove.mutateAsync({ kind: target.kind, id: target.id });
      message.success(t.accountDelete.deleted(target.name));
      onClose();
      onDeleted?.();
    } catch (error) {
      message.error(errorMessage(error));
      void preview.refetch();
    }
  };

  return (
    <TypedConfirmModal
      open={!!target}
      title={target ? t.accountDelete.title(target.name) : undefined}
      warning={target?.kind === 'guardian' ? t.accountDelete.guardianWarning : t.accountDelete.warning}
      phrase={target?.name ?? ''}
      okText={t.accountDelete.action}
      danger
      disabled={!data}
      loading={remove.isPending}
      onOk={() => void handleOk()}
      onCancel={onClose}
    >
      <ErrorAlert error={preview.error} onRetry={() => void preview.refetch()} />
      {!data && !preview.error && <Skeleton active paragraph={{ rows: 2 }} title={false} />}
      {data && (
        <div style={{ marginBottom: 16 }}>
          <Alert type="info" showIcon message={t.accountDelete.keptNote} style={{ marginBottom: 12 }} />
          <Typography.Text type="secondary">
            {data.impact.length ? t.accountDelete.impactTitle : t.accountDelete.noImpact}
          </Typography.Text>
          {data.impact.length > 0 && (
            <List
              size="small"
              dataSource={data.impact}
              renderItem={(row) => (
                <List.Item extra={<Typography.Text strong>{formatNumber(row.count)}</Typography.Text>}>
                  {t.accountDelete.impact[row.key]}
                </List.Item>
              )}
            />
          )}
        </div>
      )}
    </TypedConfirmModal>
  );
}
