import { App, DatePicker, Form, Input, Modal, Switch } from 'antd';
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
import { PriceInput } from '@/features/extra-slots/components/PriceInput';
import {
  StudentMultiPickSelect,
  type StudentPick,
  StudentPickSelect,
} from '@/features/extra-slots/components/StudentPickSelect';
import { useAffectedPrompt } from '@/features/extra-slots/components/useAffectedPrompt';
import type { SlotAssignmentModel } from '@/features/extra-slots/models/ExtraSlotModel';
import { errorMessage, isApiError } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { dayjs, type Dayjs } from '@/shared/utils/dayjs';
import { formatMoney, formatNumber, toIsoDate } from '@/shared/utils/format';
import { applyFieldErrors, applyServerErrors, diffValues, parseForm, zodRule } from '@/shared/utils/zodForm';

/**
 * Thao tác trên lịch học thêm:
 *  - add: xếp học sinh vào ca từ ngày X (trang học sinh: chọn ca; trang ca / lịch: chọn nhiều học sinh), tuỳ chọn
 *    "học đến hết ngày" (học tăng cường có thời hạn — docs/attendance-calendar-design.md) và đơn giá riêng ở ca (để
 *    trống = giá mặc định của ca);
 *  - edit: sửa ngày nhập sai; leave: cho rời ca từ ngày Y; move: chuyển sang ca khác từ ngày Z.
 */
export type SlotAssignmentAction =
  | {
      mode: 'add';
      studentId?: string;
      slotId?: string;
      slotPrice?: number | null;
      /** Điền sẵn ngày bắt đầu 'YYYY-MM-DD' (mặc định hôm nay) */
      from?: string;
      /** Bật sẵn "học tăng cường" (mở từ lịch) */
      limited?: boolean;
    }
  | { mode: 'edit' | 'leave' | 'move'; studentId: string; assignment: SlotAssignmentModel };

interface AssignmentFormValues {
  studentId?: string;
  students?: StudentPick[];
  limited?: boolean;
  /** Ngày học cuối (gồm cả ngày này) — gửi `effectiveTo` = ngày sau */
  lastDay?: Dayjs | null;
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
    if (action.mode === 'add')
      form.setFieldsValue({
        effectiveFrom: action.from ? dayjs(action.from) : dayjs(),
        limited: !!action.limited,
      });
    if (action.mode === 'edit')
      form.setFieldsValue({
        effectiveFrom: dayjs(action.assignment.effectiveFrom),
        effectiveTo: action.assignment.effectiveTo ? dayjs(action.assignment.effectiveTo) : null,
        note: action.assignment.note ?? undefined,
      });
    if (action.mode === 'leave') form.setFieldsValue({ effectiveTo: dayjs() });
    if (action.mode === 'move') form.setFieldsValue({ effectiveFrom: dayjs() });
  }, [action, form]);

  const multiPick = action?.mode === 'add' && !action.studentId && !!action.slotId;

  /** Xếp một học sinh (+ giá riêng ở ca nếu nhập) rồi hỏi áp vào buổi đã xác nhận */
  const addOne = async (studentId: string, body: CreateSlotAssignmentBody, price: number | undefined) => {
    const created = await create.mutateAsync({ studentId, body });
    // Giá riêng (HS, ca) cùng ngày bắt đầu; buổi đã xác nhận chưa có học sinh này nên không cần hỏi áp giá
    // Lịch đã lưu: lỗi đặt giá chỉ báo riêng (thử lại không được vì sẽ trùng lịch)
    if (price !== undefined)
      await createRate
        .mutateAsync({
          studentId,
          body: { pricePerSession: price, effectiveFrom: body.effectiveFrom, slotId: body.slotId },
        })
        .catch((error: unknown) => message.error(errorMessage(error)));
    prompt.sessions(studentId, created.affectedSessions);
  };

  const submit = async (values: AssignmentFormValues): Promise<boolean | 'notified'> => {
    if (!action) return false;
    const note = values.note?.trim() || undefined;
    if (action.mode === 'add') {
      const studentIds = action.studentId
        ? [action.studentId]
        : multiPick
          ? (values.students ?? []).map((p) => p.value)
          : values.studentId
            ? [values.studentId]
            : [];
      if (values.limited && !values.lastDay) {
        applyFieldErrors(form, { lastDay: [t.common.requiredField] });
        return false;
      }
      if (values.lastDay && values.effectiveFrom && values.lastDay.isBefore(values.effectiveFrom, 'day')) {
        applyFieldErrors(form, { lastDay: [t.studentExtra.lastDayBeforeFrom] });
        return false;
      }
      const parsed = parseForm(CreateSlotAssignmentBody, {
        slotId: action.slotId ?? values.slotId,
        effectiveFrom: optionalDate(values.effectiveFrom) ?? undefined,
        // Ngày đầu tiên không học = ngày sau ngày học cuối
        effectiveTo: values.lastDay ? toIsoDate(values.lastDay.add(1, 'day')) : undefined,
        note,
      });
      if (!parsed.success || studentIds.length === 0) {
        const studentField = multiPick ? 'students' : 'studentId';
        applyFieldErrors(
          form,
          parsed.success ? { [studentField]: [t.common.requiredField] } : parsed.fieldErrors,
        );
        return false;
      }
      const price = typeof values.pricePerSession === 'number' ? values.pricePerSession : undefined;
      const names = new Map((values.students ?? []).map((p) => [p.value, String(p.label)]));
      // Từng học sinh một: em lỗi (vd trùng lịch) không chặn em khác
      const failed: StudentPick[] = [];
      let added = 0;
      for (const studentId of studentIds) {
        try {
          await addOne(studentId, parsed.data, price);
          added += 1;
        } catch (error) {
          if (studentIds.length === 1) throw error;
          failed.push({ value: studentId, label: names.get(studentId) ?? studentId });
          message.error(t.studentExtra.addFailed(names.get(studentId) ?? '', errorMessage(error)));
        }
      }
      if (studentIds.length > 1 && added) message.success(t.studentExtra.addedCount(added));
      if (failed.length) {
        // Giữ modal mở với các em chưa thêm được
        form.setFieldsValue({ students: failed });
        return false;
      }
      // Nhiều học sinh đã báo "Đã thêm N học sinh" — không báo "Đã lưu" lần nữa
      return studentIds.length > 1 ? 'notified' : true;
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
      const done = await submit(values);
      if (!done) return;
      if (done !== 'notified') message.success(t.common.saved);
      onClose();
    } catch (error) {
      // Trùng khoảng ngày: báo ngay ở ô ngày (details của 409 là id dòng trùng, không phải field)
      if (isApiError(error) && error.code === 'SLOT_ASSIGNMENT_OVERLAP')
        form.setFields([{ name: 'effectiveFrom', errors: [errorMessage(error)] }]);
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  const mode = action?.mode;
  const limited = Form.useWatch('limited', form);
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
        {action?.mode === 'add' && !action.studentId && multiPick && (
          <Form.Item name="students" label={t.studentExtra.studentsPick} rules={required}>
            <StudentMultiPickSelect />
          </Form.Item>
        )}
        {action?.mode === 'add' && !action.studentId && !multiPick && (
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
        {mode === 'add' && (
          <>
            <Form.Item
              name="limited"
              label={t.studentExtra.limited}
              valuePropName="checked"
              extra={t.studentExtra.limitedHint}
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="lastDay"
              label={t.studentExtra.lastDay}
              extra={t.studentExtra.lastDayHint}
              rules={limited ? required : undefined}
            >
              <DatePicker format={t.format.date} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}
        {(mode === 'edit' || mode === 'leave') && (
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
            <PriceInput placeholder={action.slotPrice ? formatNumber(action.slotPrice) : undefined} />
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
