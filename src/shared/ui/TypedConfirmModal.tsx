import { Alert, Input, Modal, Typography } from 'antd';
import { useState, type ReactNode } from 'react';
import { t } from '@/shared/i18n';
import { matchesConfirmPhrase } from '@/shared/utils/confirmPhrase';

interface TypedConfirmModalProps {
  open: boolean;
  title: ReactNode;
  /** Cảnh báo hậu quả thao tác (hiện trên cùng) */
  warning: ReactNode;
  /** Cụm phải gõ lại để mở nút xác nhận — không phân biệt dấu / hoa thường */
  phrase: string;
  okText: string;
  danger?: boolean;
  loading?: boolean;
  onOk: () => void;
  onCancel: () => void;
  /** Nội dung thêm (form sửa giá…) giữa cảnh báo và ô gõ xác nhận */
  children?: ReactNode;
}

/** Hộp thoại cho thao tác nhạy cảm (xoá lịch, đổi đơn giá): chỉ bấm được xác nhận sau khi gõ đúng cụm yêu cầu */
export function TypedConfirmModal({
  open,
  title,
  warning,
  phrase,
  okText,
  danger,
  loading,
  onOk,
  onCancel,
  children,
}: TypedConfirmModalProps) {
  const [typed, setTyped] = useState('');
  const matched = matchesConfirmPhrase(typed, phrase);

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      onOk={onOk}
      okText={okText}
      cancelText={t.common.cancel}
      okButtonProps={{ danger, disabled: !matched }}
      confirmLoading={loading}
      afterClose={() => setTyped('')}
      destroyOnHidden
    >
      <Alert type="warning" showIcon message={warning} style={{ marginBottom: 16 }} />
      {children}
      <Typography.Text strong>{t.common.typeToConfirm(phrase)}</Typography.Text>
      <Input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        onPressEnter={() => matched && onOk()}
        placeholder={phrase}
        autoComplete="off"
        aria-label={t.common.typeToConfirm(phrase)}
        style={{ marginTop: 8 }}
      />
      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
        {t.common.typedConfirmHint}
      </Typography.Text>
    </Modal>
  );
}
