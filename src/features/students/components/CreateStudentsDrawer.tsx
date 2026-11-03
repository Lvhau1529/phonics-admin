import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, DatePicker, Divider, Drawer, Flex, Form, Input, Tooltip } from 'antd';
import {
  CreateStudentsBody,
  Email,
  EnglishName,
  ParentContact,
  PricePerSession,
  VietnameseName,
} from '@phonics/contracts';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/authStore';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { ExtraSlotSelect } from '@/features/extra-slots/components/ExtraSlotSelect';
import { PriceInput } from '@/features/extra-slots/components/PriceInput';
import { useAffectedPrompt } from '@/features/extra-slots/components/useAffectedPrompt';
import { StudentsService } from '@/features/students/api/studentsService';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { dayjs, type Dayjs } from '@/shared/utils/dayjs';
import { toIsoDate } from '@/shared/utils/format';
import { applyFieldErrors, applyServerErrors, parseForm, stripEmpty, zodRule } from '@/shared/utils/zodForm';

/** Tối đa số bé một lần (khớp `CreateStudentsBody`) */
const MAX_CHILDREN = 10;

interface ChildValues {
  vietnameseName?: string;
  englishName?: string;
  classId?: string;
  slotId?: string;
  pricePerSession?: number | null;
}

interface CreateStudentsFormValues {
  students: ChildValues[];
  effectiveFrom?: Dayjs;
  parent?: { name?: string; email?: string; phone?: string };
}

interface CreateStudentsDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Mở từ trang lớp: điền sẵn lớp chính */
  classId?: string;
  /** Mở từ trang ca học thêm: điền sẵn ca */
  slotId?: string;
}

/**
 * Thêm học sinh chưa có tài khoản (students.create): một hoặc nhiều bé (anh chị em) cùng phụ huynh nhận học phí, mỗi bé
 * vào lớp / ca riêng với đơn giá riêng. Bé vào game sau qua tài khoản gia đình của phụ huynh. GV: lớp / ca mình dạy.
 */
export function CreateStudentsDrawer({ open, onClose, classId, slotId }: CreateStudentsDrawerProps) {
  const { message } = App.useApp();
  const { can, isAdmin } = useAuth();
  const [form] = Form.useForm<CreateStudentsFormValues>();
  const create = StudentsService.useCreate();
  const affectedPrompt = useAffectedPrompt();
  const children = Form.useWatch('students', form);
  const canPrice = can('extra.managePricing');
  const anySlot = (children ?? []).some((c) => c?.slotId);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ students: [{ classId, slotId }], effectiveFrom: dayjs() });
  }, [open, form, classId, slotId]);

  const handleFinish = async (raw: CreateStudentsFormValues) => {
    const parent = stripEmpty({ ...raw.parent });
    const parsed = parseForm(CreateStudentsBody, {
      students: raw.students.map((c) =>
        stripEmpty({ ...c, pricePerSession: c.pricePerSession ?? undefined }),
      ),
      effectiveFrom: anySlot && raw.effectiveFrom ? toIsoDate(raw.effectiveFrom) : undefined,
      parent: parent.name || parent.email || parent.phone ? parent : undefined,
    });
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      const res = await create.mutateAsync(parsed.data);
      message.success(t.students.createdCount(res.items.length));
      onClose();
      // Ngày bắt đầu ở quá khứ: buổi đã xác nhận chưa có các bé → hỏi áp luôn (từng bé)
      for (const student of res.items) {
        affectedPrompt.sessions(
          student.id,
          res.affectedSessions.filter((s) => s.studentId === student.id),
        );
      }
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t.students.createTitle}
      width={520}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>{t.common.cancel}</Button>
          <Button type="primary" loading={create.isPending} onClick={() => form.submit()}>
            {t.common.create}
          </Button>
        </Flex>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={isAdmin ? t.students.createHint : t.students.createHintTeacher}
      />
      <Form<CreateStudentsFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.List name="students">
          {(fields, { add, remove }) => (
            <Flex vertical gap={12}>
              {fields.map((field, index) => (
                <Card
                  key={field.key}
                  size="small"
                  title={t.students.childN(index + 1)}
                  extra={
                    fields.length > 1 && (
                      <Tooltip title={t.students.removeChild}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </Tooltip>
                    )
                  }
                >
                  <Flex gap={12}>
                    <Form.Item
                      name={[field.name, 'vietnameseName']}
                      label={t.students.vietnameseName}
                      rules={[{ required: true, message: t.common.requiredField }, zodRule(VietnameseName)]}
                      style={{ flex: 1 }}
                    >
                      <Input maxLength={30} />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'englishName']}
                      label={t.students.englishName}
                      rules={[zodRule(EnglishName)]}
                      style={{ flex: 1 }}
                    >
                      <Input maxLength={30} />
                    </Form.Item>
                  </Flex>
                  <Form.Item name={[field.name, 'classId']} label={t.students.mainClass}>
                    <ClassSelect style={{ width: '100%' }} />
                  </Form.Item>
                  <Flex gap={12}>
                    <Form.Item name={[field.name, 'slotId']} label={t.students.extraSlot} style={{ flex: 1 }}>
                      <ExtraSlotSelect style={{ width: '100%' }} />
                    </Form.Item>
                    {canPrice && (
                      <Form.Item
                        name={[field.name, 'pricePerSession']}
                        label={t.students.pricePerSession}
                        tooltip={t.students.pricePerSessionHint}
                        rules={[zodRule(PricePerSession)]}
                        style={{ flex: 1 }}
                      >
                        <PriceInput />
                      </Form.Item>
                    )}
                  </Flex>
                </Card>
              ))}
              {fields.length < MAX_CHILDREN && (
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  // Anh chị em thường học cùng lớp / ca → chép lớp / ca của bé đầu
                  onClick={() => {
                    const first = form.getFieldValue(['students', 0]) as ChildValues | undefined;
                    add({ classId: first?.classId, slotId: first?.slotId });
                  }}
                >
                  {t.students.addChild}
                </Button>
              )}
            </Flex>
          )}
        </Form.List>

        {anySlot && (
          <Form.Item
            name="effectiveFrom"
            label={t.students.startDate}
            extra={t.students.startDateHint}
            style={{ marginTop: 16 }}
          >
            <DatePicker format={t.format.date} allowClear={false} style={{ width: '100%' }} />
          </Form.Item>
        )}

        <Divider plain>{t.students.billingParent}</Divider>
        <Form.Item
          name={['parent', 'name']}
          label={t.students.parentName}
          rules={[zodRule(ParentContact.shape.name)]}
        >
          <Input maxLength={60} />
        </Form.Item>
        <Flex gap={12}>
          <Form.Item
            name={['parent', 'email']}
            label={t.students.parentEmail}
            extra={t.students.parentEmailHint}
            rules={[zodRule(Email)]}
            style={{ flex: 1 }}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={['parent', 'phone']}
            label={t.students.parentPhone}
            rules={[zodRule(ParentContact.shape.phone)]}
            style={{ flex: 1 }}
          >
            <Input maxLength={20} />
          </Form.Item>
        </Flex>
      </Form>
    </Drawer>
  );
}
