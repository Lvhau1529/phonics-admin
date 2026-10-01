import { App, Button, Divider, Drawer, Flex, Form, Input, Select, Typography } from 'antd';
import {
  DisplayName,
  Email,
  ParentContact,
  UpdateStudentBody,
  UserStatus,
  type AvatarKey,
  type StudentDetail,
} from '@phonics/contracts';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks';
import { useUpdateStudent } from '@/features/students/hooks';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n/vi';
import { AvatarSelect } from '@/shared/ui/AvatarSelect';
import {
  applyFieldErrors,
  applyServerErrors,
  diffValues,
  parseForm,
  stripEmpty,
  zodRule,
} from '@/shared/utils/zodForm';

interface ParentValues {
  name?: string;
  email?: string;
  phone?: string;
}

interface StudentFormValues {
  displayName: string;
  avatarKey: AvatarKey;
  email?: string;
  status?: UserStatus;
  parent?: ParentValues;
  notes?: string;
}

interface StudentFormDrawerProps {
  open: boolean;
  student: StudentDetail;
  onClose: () => void;
}

/** Phụ huynh: mọi trường trống → null (xoá liên hệ) */
function normalizeParent(parent: ParentValues | undefined): ParentContact | null {
  if (!parent) return null;
  const cleaned = stripEmpty({ ...parent }) as ParentContact;
  return Object.values(cleaned).some((v) => v !== undefined) ? cleaned : null;
}

/** Sửa học sinh: ADMIN mọi trường; giáo viên (students.edit) chỉ tên + avatar */
export function StudentFormDrawer({ open, student, onClose }: StudentFormDrawerProps) {
  const { message } = App.useApp();
  const auth = useAuth();
  const [form] = Form.useForm<StudentFormValues>();
  const update = useUpdateStudent();
  const full = auth.isAdmin;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      displayName: student.displayName,
      avatarKey: student.avatarKey,
      email: student.email,
      status: student.status,
      parent: student.parent ?? {},
      notes: student.notes ?? undefined,
    });
  }, [open, student, form]);

  const handleFinish = async (raw: StudentFormValues) => {
    const values = stripEmpty({ ...raw, parent: undefined }) as StudentFormValues;
    const next: Record<string, unknown> = { displayName: values.displayName, avatarKey: values.avatarKey };
    const original: Record<string, unknown> = {
      displayName: student.displayName,
      avatarKey: student.avatarKey,
    };
    if (full) {
      Object.assign(next, {
        email: values.email,
        status: values.status,
        parent: normalizeParent(raw.parent),
        notes: values.notes ?? null,
      });
      Object.assign(original, {
        email: student.email,
        status: student.status,
        parent: student.parent,
        notes: student.notes,
      });
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
          name="displayName"
          label={t.common.name}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(DisplayName)]}
        >
          <Input maxLength={30} />
        </Form.Item>
        <Form.Item name="avatarKey" label={t.common.avatar}>
          <AvatarSelect />
        </Form.Item>
        {full && (
          <>
            <Form.Item
              name="email"
              label={t.common.email}
              rules={[{ required: true, message: t.common.requiredField }, zodRule(Email)]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="status" label={t.common.status}>
              <Select options={UserStatus.options.map((s) => ({ value: s, label: t.userStatus[s] }))} />
            </Form.Item>
            <Divider plain>{t.students.parent}</Divider>
            <Form.Item
              name={['parent', 'name']}
              label={t.students.parentName}
              rules={[zodRule(ParentContact.shape.name)]}
            >
              <Input maxLength={60} />
            </Form.Item>
            <Form.Item name={['parent', 'email']} label={t.students.parentEmail} rules={[zodRule(Email)]}>
              <Input />
            </Form.Item>
            <Form.Item
              name={['parent', 'phone']}
              label={t.students.parentPhone}
              rules={[zodRule(ParentContact.shape.phone)]}
            >
              <Input maxLength={20} />
            </Form.Item>
            <Divider plain />
            <Form.Item name="notes" label={t.students.notes}>
              <Input.TextArea rows={3} maxLength={1000} showCount />
            </Form.Item>
          </>
        )}
      </Form>
    </Drawer>
  );
}
