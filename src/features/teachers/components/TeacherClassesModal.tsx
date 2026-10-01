import { App, Modal } from 'antd';
import { SetTeacherClassesBody, type TeacherSummary } from '@phonics/contracts';
import { useState } from 'react';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { useSetTeacherClasses } from '@/features/teachers/hooks';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n/vi';
import { parseForm } from '@/shared/utils/zodForm';

interface TeacherClassesModalProps {
  teacher: TeacherSummary | undefined;
  onClose: () => void;
}

/** Gán danh sách lớp cho một giáo viên (thay thế toàn bộ). Mount lại theo `key={teacher.id}` để reset state. */
export function TeacherClassesModal({ teacher, onClose }: TeacherClassesModalProps) {
  const { message } = App.useApp();
  const [classIds, setClassIds] = useState<string[]>(() => teacher?.classes.map((c) => c.id) ?? []);
  const setClasses = useSetTeacherClasses();

  const handleOk = async () => {
    if (!teacher) return;
    const parsed = parseForm(SetTeacherClassesBody, { classIds });
    if (!parsed.success) {
      message.error(parsed.fieldErrors.classIds?.[0] ?? t.errors.VALIDATION_ERROR);
      return;
    }
    try {
      await setClasses.mutateAsync({ id: teacher.id, body: parsed.data });
      message.success(t.common.updated);
      onClose();
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  return (
    <Modal
      open={!!teacher}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={setClasses.isPending}
      title={teacher ? t.teachers.setClassesTitle(teacher.displayName) : ''}
      okText={t.common.save}
      cancelText={t.common.cancel}
      destroyOnHidden
    >
      <ClassSelect<string[]>
        mode="multiple"
        value={classIds}
        onChange={(v) => setClassIds(v ?? [])}
        style={{ width: '100%' }}
      />
    </Modal>
  );
}
