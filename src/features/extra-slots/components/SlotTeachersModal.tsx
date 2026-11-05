import { App, Form, Modal } from 'antd';
import { SetSlotTeachersBody } from '@phonics/contracts';
import { useEffect } from 'react';
import { ExtraSlotsService } from '@/features/extra-slots/api/extraSlotsService';
import type { ExtraSlotModel } from '@/features/extra-slots/models/ExtraSlotModel';
import { TeacherSelect } from '@/features/teachers/components/TeacherSelect';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { firstParseError, parseForm } from '@/shared/utils/zodForm';

interface TeachersFormValues {
  teacherIds?: string[];
}

/** Thay toàn bộ giáo viên của ca (admin) */
export function SlotTeachersModal({
  slot,
  onClose,
}: {
  slot: ExtraSlotModel | undefined;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<TeachersFormValues>();
  const setTeachers = ExtraSlotsService.useSetTeachers();

  useEffect(() => {
    if (slot) form.setFieldsValue({ teacherIds: slot.teachers.map((tc) => tc.id) });
  }, [slot, form]);

  const handleFinish = async (values: TeachersFormValues) => {
    if (!slot) return;
    const parsed = parseForm(SetSlotTeachersBody, { teacherIds: values.teacherIds ?? [] });
    if (!parsed.success) return void message.error(firstParseError(parsed));
    try {
      await setTeachers.mutateAsync({ id: slot.id, body: parsed.data });
      message.success(t.common.updated);
      onClose();
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  return (
    <Modal
      open={!!slot}
      title={slot ? `${t.extraSlots.setTeachers} · ${slot.name}` : t.extraSlots.setTeachers}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t.common.save}
      cancelText={t.common.cancel}
      confirmLoading={setTeachers.isPending}
      forceRender
    >
      <Form<TeachersFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="teacherIds" label={t.extraSlots.teachers}>
          <TeacherSelect mode="multiple" style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
