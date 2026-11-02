import { App, DatePicker, Form, Input, InputNumber, Modal } from 'antd';
import {
  CreateSlotAssignmentBody,
  MoveSlotAssignmentBody,
  PricePerSession,
  UpdateSlotAssignmentBody,
} from '@phonics/contracts';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/authStore';
import { ExtraSlotsService } from '@/features/extra-slots/api/extraSlotsService';
import { ExtraSlotSelect } from '@/features/extra-slots/components/ExtraSlotSelect';
import { StudentPickSelect } from '@/features/extra-slots/components/StudentPickSelect';
import { useAffectedPrompt } from '@/features/extra-slots/components/useAffectedPrompt';
import type { SlotAssignmentModel } from '@/features/extra-slots/models/ExtraSlotModel';
import { errorMessage, isApiError } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { dayjs, type Dayjs } from '@/shared/utils/dayjs';
import {
  formatMoney,
  formatNumber,
  formatPriceInput,
  parsePriceInput,
  toIsoDate,
} from '@/shared/utils/format';
import { applyFieldErrors, applyServerErrors, diffValues, parseForm, zodRule } from '@/shared/utils/zodForm';

/**
 * Thao tác trên lịch học thêm:
 *  - add: xếp học sinh vào ca từ ngày X (trang học sinh: chọn ca; trang ca: chọn học sinh), tuỳ chọn kèm đơn giá
 *    riêng ở ca (để trống = giá mặc định của ca);
 *  - edit: sửa ngày nhập sai; leave: cho rời ca từ ngày Y; move: chuyển sang ca khác từ ngày Z.
 */
export type SlotAssignmentAction =
  | { mode: 'add'; studentId?: string; slotId?: string; slotPrice?: number | null }
  | { mode: 'edit' | 'leave' | 'move'; studentId: string; assignment: SlotAssignmentModel };

interface AssignmentFormValues {
  studentId?: string;
  slotId?: string;
  effectiveFrom?: Dayjs;
  effectiveTo?: Dayjs | null;
  note?: string;
  pricePerSession?: number | null;
}

const optionalDate = (d: Dayjs | null | undefined): string | null => (d ? toIsoDate(d) : null);

function titleOf(action: SlotAssignmentAction): string {
  if (action.mode === 'add') return action.slotId ? t.extraSlots.addStudent : t.studentExtra.addToSlot;
  if (action.mode === 'edit') return `${t.studentExtra.editDates} · ${action.assignment.slotLabel}`;
  if (action.mode === 'leave') return `${t.studentExtra.leave} · ${action.assignment.slotLabel}`;
  return `${t.studentExtra.move} · ${action.assignment.slotLabel}`;
}

export function SlotAssignmentModal({
  action,
  onClose,
}: {
  action: SlotAssignmentAction | undefined;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<AssignmentFormValues>();
  const create = ExtraSlotsService.useCreateAssignment();
  const update = ExtraSlotsService.useUpdateAssignment();
  const move = ExtraSlotsService.useMoveAssignment();
  const createRate = ExtraSlotsService.useCreateStudentRate();
  const { can } = useAuth();
  const canPrice = can('extra.managePricing');
  const prompt = useAffectedPrompt();

  useEffect(() => {
    if (!action) return;
    form.resetFields();
    if (action.mode === 'add') form.setFieldsValue({ effectiveFrom: dayjs() });
    if (action.mode === 'edit')
      form.setFieldsValue({
        effectiveFrom: dayjs(action.assignment.effectiveFrom),
        effectiveTo: action.assignment.effectiveTo ? dayjs(action.assignment.effectiveTo) : null,
        note: action.assignment.note ?? undefined,
      });
    if (action.mode === 'leave') form.setFieldsValue({ effectiveTo: dayjs() });
    if (action.mode === 'move') form.setFieldsValue({ effectiveFrom: dayjs() });
  }, [action, form]);

  const submit = async (values: AssignmentFormValues): Promise<boolean> => {
    if (!action) return false;
    const note = values.note?.trim() || undefined;
    if (action.mode === 'add') {
      const studentId = action.studentId ?? values.studentId;
      const parsed = parseForm(CreateSlotAssignmentBody, {
        slotId: action.slotId ?? values.slotId,
        effectiveFrom: optionalDate(values.effectiveFrom) ?? undefined,
        effectiveTo: optionalDate(values.effectiveTo) ?? undefined,
        note,
      });
      if (!parsed.success || !studentId) {
        applyFieldErrors(form, parsed.success ? { studentId: [t.common.requiredField] } : parsed.fieldErrors);
        return false;
      }
      const price = typeof values.pricePerSession === 'number' ? values.pricePerSession : undefined;
      const created = await create.mutateAsync({ studentId, body: parsed.data });
      // Giá riêng (HS, ca) cùng ngày bắt đầu; buổi đã xác nhận chưa có học sinh này nên không cần hỏi áp giá
      // Lịch đã lưu: lỗi đặt giá chỉ báo riêng (thử lại không được vì sẽ trùng lịch)
      if (price !== undefined)
        await createRate
          .mutateAsync({
            studentId,
            body: {
              pricePerSession: price,
              effectiveFrom: parsed.data.effectiveFrom,
              slotId: parsed.data.slotId,
            },
          })
          .catch((error: unknown) => message.error(errorMessage(error)));
      prompt.sessions(studentId, created.affectedSessions);
      return true;
    }
    const { studentId, assignment } = action;
    if (action.mode === 'move') {
      const parsed = parseForm(MoveSlotAssignmentBody, {
        slotId: values.slotId,
        from: optionalDate(values.effectiveFrom) ?? undefined,
        note,
      });
      if (!parsed.success) {
        applyFieldErrors(form, { ...parsed.fieldErrors, effectiveFrom: parsed.fieldErrors.from ?? [] });
        return false;
      }
      const moved = await move.mutateAsync({ studentId, assignmentId: assignment.id, body: parsed.data });
      prompt.sessions(studentId, moved.affectedSessions);
      return true;
    }
    const next =
      action.mode === 'leave'
        ? { effectiveTo: optionalDate(values.effectiveTo) }
        : {
            effectiveFrom: optionalDate(values.effectiveFrom),
            effectiveTo: optionalDate(values.effectiveTo),
            note: note ?? null,
          };
    const diff = diffValues(
      { effectiveFrom: assignment.effectiveFrom, effectiveTo: assignment.effectiveTo, note: assignment.note },
      next,
    );
    if (Object.keys(diff).length === 0) {
      message.info(t.common.noChanges);
      return false;
    }
    const parsed = parseForm(UpdateSlotAssignmentBody, diff);
    if (!parsed.success) {
      applyFieldErrors(form, parsed.fieldErrors);
      return false;
    }
    const updated = await update.mutateAsync({ studentId, assignmentId: assignment.id, body: parsed.data });
    prompt.sessions(studentId, updated.affectedSessions);
    return true;
  };

  const handleFinish = async (values: AssignmentFormValues) => {
    try {
      if (!(await submit(values))) return;
      message.success(t.common.saved);
      onClose();
    } catch (error) {
      // Trùng khoảng ngày: báo ngay ở ô ngày (details của 409 là id dòng trùng, không phải field)
      if (isApiError(error) && error.code === 'SLOT_ASSIGNMENT_OVERLAP')
        form.setFields([{ name: 'effectiveFrom', errors: [errorMessage(error)] }]);
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  const mode = action?.mode;
  const required = [{ required: true, message: t.common.requiredField }];
  return (
    <Modal
      open={!!action}
      title={action ? titleOf(action) : undefined}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t.common.save}
      cancelText={t.common.cancel}
      confirmLoading={create.isPending || update.isPending || move.isPending || createRate.isPending}
      destroyOnHidden
    >
      <Form<AssignmentFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        {action?.mode === 'add' && !action.studentId && (
          <Form.Item name="studentId" label={t.common.student} rules={required}>
            <StudentPickSelect />
          </Form.Item>
        )}
        {action?.mode === 'add' && !action.slotId && (
          <Form.Item name="slotId" label={t.studentExtra.slot} rules={required}>
            <ExtraSlotSelect style={{ width: '100%' }} />
          </Form.Item>
        )}
        {action?.mode === 'move' && (
          <Form.Item name="slotId" label={t.studentExtra.moveTo} rules={required}>
            <ExtraSlotSelect excludeId={action.assignment.slot.id} style={{ width: '100%' }} />
          </Form.Item>
        )}
        {(mode === 'add' || mode === 'edit' || mode === 'move') && (
          <Form.Item
            name="effectiveFrom"
            label={mode === 'move' ? t.studentExtra.moveFrom : t.studentExtra.from}
            rules={required}
          >
            <DatePicker format={t.format.date} style={{ width: '100%' }} />
          </Form.Item>
        )}
        {(mode === 'add' || mode === 'edit' || mode === 'leave') && (
          <Form.Item
            name="effectiveTo"
            label={mode === 'leave' ? t.studentExtra.leaveFrom : t.studentExtra.to}
            extra={t.studentExtra.toHint}
            rules={mode === 'leave' ? required : undefined}
          >
            <DatePicker format={t.format.date} allowClear={mode !== 'leave'} style={{ width: '100%' }} />
          </Form.Item>
        )}
        {action?.mode === 'add' && canPrice && (
          <Form.Item
            name="pricePerSession"
            label={t.extraSlots.addPrice}
            extra={t.extraSlots.addPriceHint(
              action.slotPrice === undefined || action.slotPrice === null
                ? null
                : formatMoney(action.slotPrice),
            )}
            rules={[zodRule(PricePerSession)]}
          >
            <InputNumber<number>
              min={0}
              step={10_000}
              style={{ width: '100%' }}
              placeholder={action.slotPrice ? formatNumber(action.slotPrice) : undefined}
              addonAfter={t.format.currency}
              formatter={formatPriceInput}
              parser={parsePriceInput}
            />
          </Form.Item>
        )}
        {mode !== 'leave' && (
          <Form.Item name="note" label={t.common.note}>
            <Input maxLength={200} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
