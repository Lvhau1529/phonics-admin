import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, App, Button, Checkbox, Flex, Form, Modal, Select, Typography } from 'antd';
import { GuardianRelation, SetStudentGuardiansBody, type StudentGuardianLink } from '@phonics/contracts';
import { useState } from 'react';
import { GuardiansService } from '@/features/guardians/api/guardiansService';
import { GuardianFormDrawer } from '@/features/guardians/components/GuardianFormDrawer';
import { GuardianSelect } from '@/features/guardians/components/GuardianSelect';
import type { GuardianModel, StudentGuardianModel } from '@/features/guardians/models/GuardianModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { applyFieldErrors, parseForm } from '@/shared/utils/zodForm';

type LinkRow = Partial<StudentGuardianLink>;

interface StudentGuardiansModalProps {
  studentId: string;
  /** Phụ huynh hiện có (đặt `key` khi mở để form nạp lại) */
  current: StudentGuardianModel[];
  onClose: () => void;
}

const MAX_GUARDIANS = 4;

const newRow = (isBillingContact: boolean, guardianId?: string): LinkRow => ({
  guardianId,
  relation: 'OTHER',
  isBillingContact,
  receivesReports: true,
  canAccess: true,
});

/** Thay toàn bộ phụ huynh của học sinh (PUT students/:id/guardians) — đúng một người nhận học phí */
export function StudentGuardiansModal({ studentId, current, onClose }: StudentGuardiansModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ guardians: LinkRow[] }>();
  const save = GuardiansService.useSetStudentGuardians();
  const [labels, setLabels] = useState<Record<string, string>>(() =>
    Object.fromEntries(current.map((g) => [g.guardian.id, g.guardian.label])),
  );
  const [listError, setListError] = useState<string>();
  const [creating, setCreating] = useState(false);

  const initialRows: LinkRow[] = current.map((g) => ({
    guardianId: g.guardian.id,
    relation: g.relation,
    isBillingContact: g.isBillingContact,
    receivesReports: g.receivesReports,
    canAccess: g.canAccess,
  }));

  /** Chỉ một người nhận học phí: bật ở dòng này thì tắt ở các dòng khác */
  const onBillingChange = (index: number, checked: boolean) => {
    if (!checked) return;
    const rows = form.getFieldValue('guardians') as LinkRow[];
    form.setFieldValue(
      'guardians',
      rows.map((row, i) => ({ ...row, isBillingContact: i === index })),
    );
  };

  const addGuardian = (guardian: GuardianModel) => {
    setLabels((prev) => ({ ...prev, [guardian.id]: guardian.label }));
    const rows = (form.getFieldValue('guardians') as LinkRow[] | undefined) ?? [];
    form.setFieldValue('guardians', [...rows, newRow(rows.length === 0, guardian.id)]);
  };

  const handleFinish = async (values: { guardians?: LinkRow[] }) => {
    const parsed = parseForm(SetStudentGuardiansBody, { guardians: values.guardians ?? [] });
    if (!parsed.success) {
      const { guardians: listErrors, ...rowErrors } = parsed.fieldErrors;
      setListError([...parsed.formErrors, ...(listErrors ?? [])].join(' ') || undefined);
      return applyFieldErrors(form, rowErrors);
    }
    setListError(undefined);
    try {
      await save.mutateAsync({ studentId, body: parsed.data });
      message.success(t.common.saved);
      onClose();
    } catch (error) {
      setListError(errorMessage(error));
    }
  };

  return (
    <Modal
      open
      onCancel={onClose}
      title={t.students.editGuardians}
      width={760}
      destroyOnHidden
      okText={t.common.save}
      cancelText={t.common.cancel}
      confirmLoading={save.isPending}
      onOk={() => form.submit()}
    >
      <Typography.Paragraph type="secondary">{t.guardians.flagsHint}</Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ guardians: initialRows }}>
        <Form.List name="guardians">
          {(fields, { add, remove }) => (
            <Flex vertical gap={8}>
              {fields.map((field) => {
                const guardianId = form.getFieldValue(['guardians', field.name, 'guardianId']) as
                  string | undefined;
                return (
                  <Flex key={field.key} gap={8} align="flex-start" wrap>
                    <Form.Item
                      name={[field.name, 'guardianId']}
                      rules={[{ required: true, message: t.common.requiredField }]}
                      style={{ flex: '1 1 260px', marginBottom: 0 }}
                    >
                      <GuardianSelect
                        placeholder={t.guardians.selectGuardian}
                        currentLabel={guardianId ? labels[guardianId] : undefined}
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, 'relation']} style={{ width: 120, marginBottom: 0 }}>
                      <Select
                        options={GuardianRelation.options.map((r) => ({
                          value: r,
                          label: t.guardianRelation[r],
                        }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'isBillingContact']}
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Checkbox onChange={(e) => onBillingChange(field.name, e.target.checked)}>
                        {t.guardians.billing}
                      </Checkbox>
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'receivesReports']}
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Checkbox>{t.guardians.receivesReports}</Checkbox>
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'canAccess']}
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Checkbox>{t.guardians.canAccess}</Checkbox>
                    </Form.Item>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label={t.common.delete}
                      onClick={() => remove(field.name)}
                    />
                  </Flex>
                );
              })}
              {fields.length === 0 && (
                <Typography.Text type="secondary">{t.students.noGuardians}</Typography.Text>
              )}
              <Flex gap={8}>
                <Button
                  icon={<PlusOutlined />}
                  disabled={fields.length >= MAX_GUARDIANS}
                  onClick={() => add(newRow(fields.length === 0))}
                >
                  {t.guardians.addRow}
                </Button>
                <Button disabled={fields.length >= MAX_GUARDIANS} onClick={() => setCreating(true)}>
                  {t.guardians.createNew}
                </Button>
              </Flex>
            </Flex>
          )}
        </Form.List>
      </Form>
      {listError && <Alert type="error" showIcon message={listError} style={{ marginTop: 12 }} />}
      <GuardianFormDrawer open={creating} onClose={() => setCreating(false)} onSaved={addGuardian} />
    </Modal>
  );
}
