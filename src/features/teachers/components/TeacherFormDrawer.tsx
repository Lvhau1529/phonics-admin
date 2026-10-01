import { App, Button, Drawer, Flex, Form, Input, Select } from 'antd';
import {
  CreateTeacherBody,
  DisplayName,
  Email,
  Password,
  SetUserPermissionGroupsBody,
  UpdateTeacherBody,
  UserStatus,
  type AvatarKey,
  type TeacherSummary,
} from '@phonics/contracts';
import { useEffect, useMemo } from 'react';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { PermissionGroupSelect } from '@/features/permissions/components/PermissionGroupSelect';
import { useSetUserPermissionGroups, useUserPermissions } from '@/features/permissions/hooks';
import { useCreateTeacher, useUpdateTeacher } from '@/features/teachers/hooks';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
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
  /** Nhóm quyền (tuỳ chọn) — lưu bằng PUT /admin/users/:id/permission-groups sau khi tạo / sửa */
  groupIds?: string[];
}

interface TeacherFormDrawerProps {
  open: boolean;
  /** Có = sửa, không = tạo mới */
  teacher?: TeacherSummary;
  onClose: () => void;
}

const sameIds = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id) => b.includes(id));

/**
 * Tạo / sửa giáo viên. Mật khẩu để trống = đăng nhập Google (tạo) hoặc giữ nguyên (sửa).
 * Nhóm quyền: tạo → POST teacher rồi PUT nhóm (nếu chọn); sửa → nạp nhóm hiện có, chỉ PUT khi đổi.
 */
export function TeacherFormDrawer({ open, teacher, onClose }: TeacherFormDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<TeacherFormValues>();
  const create = useCreateTeacher();
  const update = useUpdateTeacher();
  const setGroups = useSetUserPermissionGroups();
  const userPerms = useUserPermissions(open ? teacher?.id : undefined);
  const saving = create.isPending || update.isPending || setGroups.isPending;
  const currentGroupIds = useMemo(() => userPerms.data?.groups.map((g) => g.id), [userPerms.data]);

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
      form.setFieldsValue({ avatarKey: 'pip', classIds: [], groupIds: [] });
    }
  }, [open, teacher, form]);

  // Nhóm hiện có của giáo viên tới sau khi mở drawer → điền vào form
  useEffect(() => {
    if (open && teacher && currentGroupIds) form.setFieldsValue({ groupIds: currentGroupIds });
  }, [open, teacher, currentGroupIds, form]);

  const saveGroups = async (userId: string, groupIds: string[] | undefined) => {
    const next = groupIds ?? [];
    if (teacher && currentGroupIds && sameIds(next, currentGroupIds)) return;
    if (!teacher && next.length === 0) return;
    const parsed = parseForm(SetUserPermissionGroupsBody, { groupIds: next });
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    await setGroups.mutateAsync({ userId, body: parsed.data });
  };

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
        const groupsChanged = !!currentGroupIds && !sameIds(values.groupIds ?? [], currentGroupIds);
        if (Object.keys(diff).length === 0 && !groupsChanged) {
          message.info(t.common.noChanges);
          return;
        }
        if (Object.keys(diff).length > 0) {
          const parsed = parseForm(UpdateTeacherBody, diff);
          if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
          await update.mutateAsync({ id: teacher.id, body: parsed.data });
        }
        await saveGroups(teacher.id, values.groupIds);
        message.success(t.common.updated);
      } else {
        const { groupIds, ...rest } = values;
        const parsed = parseForm(CreateTeacherBody, rest);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        const created = await create.mutateAsync(parsed.data);
        await saveGroups(created.id, groupIds);
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
        <Form.Item
          name="groupIds"
          label={`${t.teachers.groups} ${t.common.optional}`}
          extra={t.teachers.groupsHint}
        >
          <PermissionGroupSelect style={{ width: '100%' }} disabled={!!teacher && userPerms.isLoading} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
