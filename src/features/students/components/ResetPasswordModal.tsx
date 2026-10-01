import { App, Form, Input, Modal } from 'antd';
import { Password, ResetPasswordBody, type StudentSummary } from '@phonics/contracts';
import { useEffect } from 'react';
import { useResetPassword } from '@/features/students/hooks';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n/vi';
import { applyFieldErrors, applyServerErrors, parseForm, zodRule } from '@/shared/utils/zodForm';

interface ResetPasswordValues {
  newPassword: string;
}

interface ResetPasswordModalProps {
  student: StudentSummary | undefined;
  onClose: () => void;
}

/** Admin đặt lại mật khẩu cho học sinh */
export function ResetPasswordModal({ student, onClose }: ResetPasswordModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<ResetPasswordValues>();
  const reset = useResetPassword();

  useEffect(() => {
    if (student) form.resetFields();
  }, [student, form]);

  const handleFinish = async (values: ResetPasswordValues) => {
    if (!student) return;
    const parsed = parseForm(ResetPasswordBody, values);
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      await reset.mutateAsync({ id: student.id, body: parsed.data });
      message.success(t.students.passwordReset);
      onClose();
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Modal
      open={!!student}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={reset.isPending}
      title={student ? t.students.resetPasswordTitle(student.displayName) : ''}
      okText={t.common.save}
      cancelText={t.common.cancel}
      destroyOnHidden
    >
      <Form<ResetPasswordValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="newPassword"
          label={t.students.newPassword}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(Password)]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
