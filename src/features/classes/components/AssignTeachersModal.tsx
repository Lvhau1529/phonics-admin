import { App, Modal } from 'antd';
import { SetClassTeachersBody } from '@phonics/contracts';
import { useState } from 'react';
import { useSetClassTeachers } from '@/features/classes/hooks';
import type { ClassModel } from '@/features/classes/models/ClassModel';
import { TeacherSelect } from '@/features/teachers/components/TeacherSelect';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { parseForm } from '@/shared/utils/zodForm';

interface AssignTeachersModalProps {
  cls: ClassModel | undefined;
  onClose: () => void;
}

/** Gán giáo viên cho lớp (ADMIN, thay thế toàn bộ danh sách). Mount lại theo `key={cls.id}` để reset state. */
export function AssignTeachersModal({ cls, onClose }: AssignTeachersModalProps) {
  const { message } = App.useApp();
  const [teacherIds, setTeacherIds] = useState<string[]>(() => cls?.teacherIds ?? []);
  const setTeachers = useSetClassTeachers();

  const handleOk = async () => {
    if (!cls) return;
    const parsed = parseForm(SetClassTeachersBody, { teacherIds });
    if (!parsed.success)
      return void message.error(parsed.fieldErrors.teacherIds?.[0] ?? t.errors.VALIDATION_ERROR);
    try {
      await setTeachers.mutateAsync({ id: cls.id, body: parsed.data });
      message.success(t.common.updated);
      onClose();
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  return (
    <Modal
      open={!!cls}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={setTeachers.isPending}
      title={cls ? t.classes.assignTeachersTitle(cls.name) : ''}
      okText={t.common.save}
      cancelText={t.common.cancel}
      destroyOnHidden
    >
      <TeacherSelect
        mode="multiple"
        value={teacherIds}
        onChange={(v) => setTeacherIds((v as string[] | undefined) ?? [])}
        style={{ width: '100%' }}
      />
    </Modal>
  );
}
