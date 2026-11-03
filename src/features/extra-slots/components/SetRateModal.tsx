import { Alert, App, DatePicker, Form, Input, Typography } from 'antd';
import {
  CreateSlotRateBody,
  CreateStudentRateBody,
  PricePerSession,
  type CreateSlotRateBody as RateBody,
} from '@phonics/contracts';
import { type ReactNode, useEffect } from 'react';
import { PriceInput } from '@/features/extra-slots/components/PriceInput';
import { useAffectedPrompt } from '@/features/extra-slots/components/useAffectedPrompt';
import type { ExtraRateModel } from '@/features/extra-slots/models/ExtraSlotModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { TypedConfirmModal } from '@/shared/ui/TypedConfirmModal';
import { dayjs, type Dayjs } from '@/shared/utils/dayjs';
import { toIsoDate } from '@/shared/utils/format';
import { applyFieldErrors, applyServerErrors, parseForm, stripEmpty, zodRule } from '@/shared/utils/zodForm';

interface RateFormValues {
  pricePerSession: number;
  effectiveFrom: Dayjs;
  effectiveTo?: Dayjs;
  note?: string;
}

interface SetRateModalProps {
  open: boolean;
  title: string;
  /** Giải thích phạm vi giá (mặc định ca / riêng học sinh) */
  hint: string;
  /** Giá đang áp dụng (điền sẵn) */
  currentPrice?: number | null;
  loading: boolean;
  /** Giá riêng học sinh: thêm ô ngày hết (ưu đãi có hạn) */
  withEnd?: boolean;
  /** Cảnh báo thêm phía trên form (vd học sinh có giá riêng không đổi theo giá ca) */
  notice?: ReactNode;
  /** Trả dòng giá vừa tạo (kèm bản ghi đã xác nhận bị lệch giá, nếu có) */
  onSubmit: (body: RateBody & { effectiveTo?: string }) => Promise<ExtraRateModel>;
  onClose: () => void;
}

/** Đặt giá mới từ một ngày (gõ cụm xác nhận) — dùng chung cho giá mặc định của ca và giá riêng học sinh */
export function SetRateModal({
  open,
  title,
  hint,
  currentPrice,
  loading,
  withEnd,
  notice,
  onSubmit,
  onClose,
}: SetRateModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<RateFormValues>();
  const prompt = useAffectedPrompt();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ pricePerSession: currentPrice ?? undefined, effectiveFrom: dayjs() });
  }, [open, currentPrice, form]);

  const handleFinish = async (values: RateFormValues) => {
    const parsed = parseForm(
      withEnd ? CreateStudentRateBody : CreateSlotRateBody,
      stripEmpty({
        ...values,
        effectiveFrom: toIsoDate(values.effectiveFrom),
        effectiveTo: values.effectiveTo ? toIsoDate(values.effectiveTo) : undefined,
      }),
    );
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      const rate = await onSubmit(parsed.data);
      message.success(t.extraSlots.priceSaved);
      onClose();
      prompt.records(rate.id, rate.affectedRecords);
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <TypedConfirmModal
      open={open}
      title={title}
      warning={t.extraSlots.setPriceWarning}
      phrase={t.extraSlots.priceConfirmWord}
      okText={t.common.save}
      loading={loading}
      onOk={() => form.submit()}
      onCancel={onClose}
    >
      <Typography.Paragraph type="secondary">{hint}</Typography.Paragraph>
      {notice && <Alert type="warning" showIcon message={notice} style={{ marginBottom: 16 }} />}
      <Form<RateFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="pricePerSession"
          label={t.extraSlots.price}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(PricePerSession)]}
        >
          <PriceInput />
        </Form.Item>
        <Form.Item
          name="effectiveFrom"
          label={t.extraSlots.effectiveFrom}
          extra={t.extraSlots.rateHint}
          rules={[{ required: true, message: t.common.requiredField }]}
        >
          <DatePicker format={t.format.date} style={{ width: '100%' }} />
        </Form.Item>
        {withEnd && (
          <Form.Item name="effectiveTo" label={t.extraSlots.rateEndsOn} extra={t.extraSlots.rateEndsOnHint}>
            <DatePicker format={t.format.date} style={{ width: '100%' }} />
          </Form.Item>
        )}
        <Form.Item name="note" label={t.common.note}>
          <Input maxLength={200} />
        </Form.Item>
      </Form>
    </TypedConfirmModal>
  );
}
