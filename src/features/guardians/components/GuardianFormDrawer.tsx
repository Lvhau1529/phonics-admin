import { App, Button, Drawer, Flex, Form, Input } from 'antd';
import {
  CreateGuardianBody,
  Email,
  GuardianName,
  GuardianNote,
  Phone,
  UpdateGuardianBody,
} from '@phonics/contracts';
import { useEffect } from 'react';
import { GuardiansService } from '@/features/guardians/api/guardiansService';
import type { GuardianModel } from '@/features/guardians/models/GuardianModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import {
  applyFieldErrors,
  applyServerErrors,
  diffValues,
  parseForm,
  stripEmpty,
  zodRule,
} from '@/shared/utils/zodForm';

interface GuardianFormValues {
  fullName: string;
  email?: string;
  phone?: string;
  note?: string;
}

interface GuardianFormDrawerProps {
  open: boolean;
  /** Có = sửa, không = tạo mới */
  guardian?: GuardianModel;
  onClose: () => void;
  /** Gọi sau khi lưu thành công (vd gắn ngay phụ huynh vừa tạo cho học sinh) */
  onSaved?: (guardian: GuardianModel) => void;
}

/** Tạo / sửa phụ huynh. Sửa: ô để trống = xoá giá trị (null). */
export function GuardianFormDrawer({ open, guardian, onClose, onSaved }: GuardianFormDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<GuardianFormValues>();
  const create = GuardiansService.useCreate();
  const update = GuardiansService.useUpdate();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (guardian)
      form.setFieldsValue({
        fullName: guardian.fullName,
        email: guardian.email ?? undefined,
        phone: guardian.phone ?? undefined,
        note: guardian.note ?? undefined,
      });
  }, [open, guardian, form]);

  const handleFinish = async (raw: GuardianFormValues) => {
    const values = stripEmpty({ ...raw });
    try {
      let saved: GuardianModel;
      if (guardian) {
        const diff = diffValues(
          { fullName: guardian.fullName, email: guardian.email, phone: guardian.phone, note: guardian.note },
          {
            fullName: values.fullName,
            email: values.email ?? null,
            phone: values.phone ?? null,
            note: values.note ?? null,
          },
        );
        if (Object.keys(diff).length === 0) return void message.info(t.common.noChanges);
        const parsed = parseForm(UpdateGuardianBody, diff);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        saved = await update.mutateAsync({ id: guardian.id, body: parsed.data });
        message.success(t.common.updated);
      } else {
        const parsed = parseForm(CreateGuardianBody, values);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        saved = await create.mutateAsync(parsed.data);
        message.success(t.common.created);
      }
      onSaved?.(saved);
      onClose();
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={guardian ? t.guardians.edit : t.guardians.add}
      width={420}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>{t.common.cancel}</Button>
          <Button type="primary" loading={create.isPending || update.isPending} onClick={() => form.submit()}>
            {t.common.save}
          </Button>
        </Flex>
      }
    >
      <Form<GuardianFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="fullName"
          label={t.guardians.fullName}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(GuardianName)]}
        >
          <Input maxLength={60} />
        </Form.Item>
        <Form.Item name="email" label={t.common.email} rules={[zodRule(Email)]}>
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="phone"
          label={t.guardians.phone}
          extra={t.guardians.phoneHint}
          rules={[zodRule(Phone)]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="note" label={t.common.note} rules={[zodRule(GuardianNote)]}>
          <Input.TextArea rows={3} maxLength={500} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
