import { App, Form, Input, Modal } from 'antd';
import { MoveClassBody, type StudentSummary } from '@phonics/contracts';
import { useEffect } from 'react';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { useMoveClass } from '@/features/students/hooks';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { applyFieldErrors, applyServerErrors, parseForm, stripEmpty } from '@/shared/utils/zodForm';

interface MoveClassValues {
  classId?: string;
  note?: string;
}

interface MoveClassModalProps {
  student: StudentSummary | undefined;
  onClose: () => void;
}

/** Chuyển học sinh sang lớp khác (quyền class.changeStudentClass) */
export function MoveClassModal({ student, onClose }: MoveClassModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<MoveClassValues>();
  const move = useMoveClass();

  useEffect(() => {
    if (student) form.resetFields();
  }, [student, form]);

  const handleFinish = async (raw: MoveClassValues) => {
    if (!student) return;
    const parsed = parseForm(MoveClassBody, stripEmpty({ ...raw }));
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      await move.mutateAsync({ id: student.id, body: parsed.data });
      message.success(t.students.moved);
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
      confirmLoading={move.isPending}
      title={student ? t.students.moveClassTitle(student.displayName) : ''}
      okText={t.students.moveClass}
      cancelText={t.common.cancel}
      destroyOnHidden
    >
      <Form<MoveClassValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="classId"
          label={t.students.moveClassTarget}
          rules={[{ required: true, message: t.common.requiredField }]}
        >
          <ClassSelect excludeId={student?.class?.id} allowClear={false} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="note" label={`${t.common.note} ${t.common.optional}`}>
          <Input maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
