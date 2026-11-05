import { App, Button, Drawer, Flex, Form, Input, Select, Typography } from 'antd';
import {
  EnglishName,
  UpdateStudentBody,
  VietnameseName,
  type UserStatus,
  type AvatarKey,
} from '@phonics/contracts';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/authStore';
import { StudentsService } from '@/features/students/api/studentsService';
import type { StudentDetailModel } from '@/features/students/models/StudentDetailModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { AvatarSelect } from '@/shared/ui/AvatarSelect';
import { EDITABLE_STATUSES, isEditableStatus } from '@/shared/utils/status';
import {
  applyFieldErrors,
  applyServerErrors,
  diffValues,
  parseForm,
  stripEmpty,
  zodRule,
} from '@/shared/utils/zodForm';

interface StudentFormValues {
  vietnameseName: string;
  englishName?: string;
  avatarKey: AvatarKey;
  status?: UserStatus;
  notes?: string;
}

interface StudentFormDrawerProps {
  open: boolean;
  student: StudentDetailModel;
  onClose: () => void;
}

/** Sửa học sinh: ADMIN mọi trường; giáo viên (students.edit) chỉ tên + avatar. Phụ huynh sửa ở thẻ Phụ huynh */
export function StudentFormDrawer({ open, student, onClose }: StudentFormDrawerProps) {
  const { message } = App.useApp();
  const auth = useAuth();
  const [form] = Form.useForm<StudentFormValues>();
  const update = StudentsService.useUpdate();
  const full = auth.isAdmin;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      vietnameseName: student.vietnameseName,
      englishName: student.englishName ?? undefined,
      avatarKey: student.avatarKey,
      status: student.status,
      notes: student.notes ?? undefined,
    });
  }, [open, student, form]);

  const handleFinish = async (raw: StudentFormValues) => {
    const values = stripEmpty({ ...raw });
    const next: Record<string, unknown> = {
      vietnameseName: values.vietnameseName,
      // Ô trống = xoá tên tiếng Anh (null), không phải "không đổi"
      englishName: values.englishName ?? null,
      avatarKey: values.avatarKey,
    };
    const original: Record<string, unknown> = {
      vietnameseName: student.vietnameseName,
      englishName: student.englishName,
      avatarKey: student.avatarKey,
    };
    if (full) {
      Object.assign(next, { status: values.status, notes: values.notes ?? null });
      Object.assign(original, { status: student.status, notes: student.notes });
    }
    const diff = diffValues(original, next);
    if (Object.keys(diff).length === 0) return void message.info(t.common.noChanges);
    const parsed = parseForm(UpdateStudentBody, diff);
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      await update.mutateAsync({ id: student.id, body: parsed.data });
      message.success(t.common.updated);
      onClose();
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t.students.edit}
      width={440}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>{t.common.cancel}</Button>
          <Button type="primary" loading={update.isPending} onClick={() => form.submit()}>
            {t.common.save}
          </Button>
        </Flex>
      }
    >
      {!full && <Typography.Paragraph type="secondary">{t.students.teacherEditHint}</Typography.Paragraph>}
      <Form<StudentFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="vietnameseName"
          label={t.students.vietnameseName}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(VietnameseName)]}
        >
          <Input maxLength={30} />
        </Form.Item>
        <Form.Item
          name="englishName"
          label={t.students.englishName}
          extra={t.students.englishNameHint}
          rules={[zodRule(EnglishName)]}
        >
          <Input maxLength={30} />
        </Form.Item>
        <Form.Item name="avatarKey" label={t.common.avatar}>
          <AvatarSelect />
        </Form.Item>
        {full && (
          <>
            <Form.Item name="status" label={t.common.status}>
              <Select
                // Chờ duyệt / bị từ chối: đổi qua màn Duyệt tài khoản
                disabled={!isEditableStatus(student.status)}
                options={EDITABLE_STATUSES.map((s) => ({ value: s, label: t.userStatus[s] }))}
              />
            </Form.Item>
            <Form.Item name="notes" label={t.students.notes}>
              <Input.TextArea rows={3} maxLength={1000} showCount />
            </Form.Item>
          </>
        )}
      </Form>
    </Drawer>
  );
}
