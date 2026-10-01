import { App, Button, Drawer, Flex, Form, Input, Select } from 'antd';
import {
  CreateTeacherBody,
  DisplayName,
  Email,
  Password,
  UpdateTeacherBody,
  UserStatus,
  type AvatarKey,
  type TeacherSummary,
} from '@phonics/contracts';
import { useEffect } from 'react';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { useCreateTeacher, useUpdateTeacher } from '@/features/teachers/hooks';
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

interface TeacherFormValues {
  email: string;
  displayName: string;
  password?: string;
  avatarKey?: AvatarKey;
  status?: UserStatus;
  classIds?: string[];
}

interface TeacherFormDrawerProps {
  open: boolean;
  /** Có = sửa, không = tạo mới */
  teacher?: TeacherSummary;
  onClose: () => void;
}

/** Tạo / sửa giáo viên. Mật khẩu để trống = đăng nhập Google (tạo) hoặc giữ nguyên (sửa). */
export function TeacherFormDrawer({ open, teacher, onClose }: TeacherFormDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<TeacherFormValues>();
  const create = useCreateTeacher();
  const update = useUpdateTeacher();
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (teacher) {
      form.setFieldsValue({
        email: teacher.email,
        displayName: teacher.displayName,
        avatarKey: teacher.avatarKey,
        status: teacher.status,
      });
    } else {
      form.setFieldsValue({ avatarKey: 'pip', classIds: [] });
    }
  }, [open, teacher, form]);

  const handleFinish = async (raw: TeacherFormValues) => {
    const values = stripEmpty(raw as unknown as Record<string, unknown>) as unknown as TeacherFormValues;
    try {
      if (teacher) {
        const diff = diffValues(
          {
            email: teacher.email,
            displayName: teacher.displayName,
            avatarKey: teacher.avatarKey,
            status: teacher.status,
          },
          {
            email: values.email,
            displayName: values.displayName,
            avatarKey: values.avatarKey,
            status: values.status,
            password: values.password,
          },
        );
        if (Object.keys(diff).length === 0) {
          message.info(t.common.noChanges);
          return;
        }
        const parsed = parseForm(UpdateTeacherBody, diff);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        await update.mutateAsync({ id: teacher.id, body: parsed.data });
        message.success(t.common.updated);
      } else {
        const parsed = parseForm(CreateTeacherBody, values);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        await create.mutateAsync(parsed.data);
        message.success(t.common.created);
      }
      onClose();
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={teacher ? t.teachers.edit : t.teachers.add}
      width={420}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>{t.common.cancel}</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {t.common.save}
          </Button>
        </Flex>
      }
    >
      <Form<TeacherFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="email"
          label={t.common.email}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(Email)]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="displayName"
          label={t.common.name}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(DisplayName)]}
        >
          <Input maxLength={30} />
        </Form.Item>
        <Form.Item
          name="password"
          label={t.common.password}
          extra={teacher ? t.teachers.passwordHintEdit : t.teachers.passwordHint}
          rules={[zodRule(Password)]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="avatarKey" label={t.common.avatar}>
          <AvatarSelect />
        </Form.Item>
        {teacher ? (
          <Form.Item name="status" label={t.common.status}>
            <Select options={UserStatus.options.map((s) => ({ value: s, label: t.userStatus[s] }))} />
          </Form.Item>
        ) : (
          <Form.Item name="classIds" label={t.teachers.classesCol}>
            <ClassSelect mode="multiple" style={{ width: '100%' }} />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
}
