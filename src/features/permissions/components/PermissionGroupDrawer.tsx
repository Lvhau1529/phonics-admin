import { App, Button, Drawer, Flex, Form, Input, Tag } from 'antd';
import {
  CreatePermissionGroupBody,
  PermissionGroupName,
  UpdatePermissionGroupBody,
  type Permission,
  type PermissionGroup,
} from '@phonics/contracts';
import { useEffect } from 'react';
import { PermissionChecklist } from '@/features/permissions/components/PermissionChecklist';
import {
  useCreatePermissionGroup,
  usePermissionCatalog,
  useUpdatePermissionGroup,
} from '@/features/permissions/hooks';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { CenteredLoader } from '@/shared/ui/LottieLoader';
import {
  applyFieldErrors,
  applyServerErrors,
  diffValues,
  parseForm,
  stripEmpty,
  zodRule,
} from '@/shared/utils/zodForm';

interface GroupFormValues {
  name: string;
  description?: string;
  permissions: Permission[];
}

interface PermissionGroupDrawerProps {
  open: boolean;
  /** Có = sửa, không = tạo mới */
  group?: PermissionGroup;
  onClose: () => void;
}

/** Tạo / sửa nhóm quyền: tên, mô tả, checklist quyền theo khu vực. Nhóm hệ thống vẫn sửa được. */
export function PermissionGroupDrawer({ open, group, onClose }: PermissionGroupDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<GroupFormValues>();
  const catalog = usePermissionCatalog();
  const create = useCreatePermissionGroup();
  const update = useUpdatePermissionGroup();
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(
      group
        ? { name: group.name, description: group.description ?? undefined, permissions: group.permissions }
        : { name: '', description: undefined, permissions: [] },
    );
  }, [open, group, form]);

  const handleFinish = async (raw: GroupFormValues) => {
    const values = stripEmpty(raw as unknown as Record<string, unknown>) as unknown as GroupFormValues;
    try {
      if (group) {
        const diff = diffValues(
          { name: group.name, description: group.description, permissions: group.permissions },
          { name: values.name, description: values.description ?? null, permissions: values.permissions },
        );
        if (Object.keys(diff).length === 0) {
          message.info(t.common.noChanges);
          return;
        }
        const parsed = parseForm(UpdatePermissionGroupBody, diff);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        await update.mutateAsync({ id: group.id, body: parsed.data });
        message.success(t.permissions.groupUpdated);
      } else {
        const parsed = parseForm(CreatePermissionGroupBody, values);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        await create.mutateAsync(parsed.data);
        message.success(t.permissions.groupCreated);
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
      title={
        <Flex align="center" gap={8}>
          {group ? t.permissions.editGroup : t.permissions.addGroup}
          {group?.isSystem && <Tag color="gold">{t.permissions.systemGroup}</Tag>}
        </Flex>
      }
      width={480}
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
      <Form<GroupFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="name"
          label={t.permissions.groupName}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(PermissionGroupName)]}
        >
          <Input maxLength={60} />
        </Form.Item>
        <Form.Item name="description" label={t.permissions.groupDescription}>
          <Input.TextArea maxLength={200} rows={2} showCount />
        </Form.Item>
        <Form.Item name="permissions" label={t.permissions.groupPermissions}>
          {catalog.data ? <PermissionChecklist catalog={catalog.data} /> : <CenteredLoader minHeight={120} />}
        </Form.Item>
      </Form>
    </Drawer>
  );
}
