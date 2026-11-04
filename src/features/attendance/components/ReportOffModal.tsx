import { Alert, App, Form, Input, Modal, Typography } from 'antd';
import { type ZodType } from 'zod';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { applyFieldErrors, applyServerErrors, parseForm } from '@/shared/utils/zodForm';

interface ReportOffModalProps<T> {
  open: boolean;
  title: string;
  hint: string;
  /** Cảnh báo thêm (vd buổi đã xác nhận) */
  warning?: string;
  loading: boolean;
  /** Body gửi API (gate bằng schema contracts trước khi gọi) */
  schema: ZodType<T>;
  toBody: (reason: string) => unknown;
  /** Gửi body đã parse; lỗi ném ra sẽ hiện trên form / message */
  onSubmit: (body: T) => Promise<void>;
  onClose: () => void;
}

/** Báo nghỉ một buổi: nhập lý do rồi huỷ (dùng ở trang buổi và trang duyệt nhanh qua mail) */
export function ReportOffModal<T>({
  open,
  title,
  hint,
  warning,
  loading,
  schema,
  toBody,
  onSubmit,
  onClose,
}: ReportOffModalProps<T>) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ reason: string }>();

  const handleFinish = async ({ reason }: { reason: string }) => {
    const parsed = parseForm(schema, toBody(reason ?? ''));
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      await onSubmit(parsed.data);
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t.attendance.reportOff}
      okButtonProps={{ danger: true }}
      cancelText={t.common.close}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">{hint}</Typography.Paragraph>
      {warning && <Alert type="warning" showIcon message={warning} style={{ marginBottom: 16 }} />}
      <Form<{ reason: string }> form={form} layout="vertical" onFinish={handleFinish} preserve={false}>
        <Form.Item
          name="reason"
          label={t.attendance.cancelReason}
          rules={[{ required: true, whitespace: true, message: t.common.requiredField }]}
        >
          <Input maxLength={200} autoFocus placeholder={t.attendance.reportOffReasonPlaceholder} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
