import { App, Form, Input, Modal } from 'antd';
import { RejectFamilyBody } from '@phonics/contracts';
import { FamiliesService } from '@/features/families/api/familiesService';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { applyFieldErrors, applyServerErrors, parseForm, zodRule } from '@/shared/utils/zodForm';

interface RejectFamilyModalProps {
  /** Id đơn (tài khoản đăng ký) */
  familyId: string;
  /** Bé bị từ chối; undefined = cả đơn (mọi bé chờ trong phạm vi người duyệt) */
  studentIds: string[] | undefined;
  onClose: () => void;
}

/** Từ chối bé / cả đơn kèm lý do (gửi mail cho phụ huynh) */
export function RejectFamilyModal({ familyId, studentIds, onClose }: RejectFamilyModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ reason: string }>();
  const reject = FamiliesService.useReject();

  const handleFinish = async (values: { reason: string }) => {
    const parsed = parseForm(RejectFamilyBody, { studentIds, reason: values.reason });
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      const res = await reject.mutateAsync({ id: familyId, body: parsed.data });
      message.success(t.families.rejected(res.rejected.length));
      onClose();
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Modal
      open
      onCancel={onClose}
      title={studentIds ? t.families.rejectSelected(studentIds.length) : t.families.rejectAll}
      okText={t.families.reject}
      okButtonProps={{ danger: true }}
      cancelText={t.common.cancel}
      confirmLoading={reject.isPending}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="reason"
          label={t.families.rejectReason}
          rules={[
            { required: true, message: t.common.requiredField },
            zodRule(RejectFamilyBody.shape.reason),
          ]}
        >
          <Input.TextArea rows={3} maxLength={300} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
}
