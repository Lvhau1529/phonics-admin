import { App, DatePicker, Form, Input, InputNumber, Modal, Typography } from 'antd';
import { CreateSlotRateBody, PricePerSession, type CreateSlotRateBody as RateBody } from '@phonics/contracts';
import { useEffect } from 'react';
import { useAffectedPrompt } from '@/features/extra-slots/components/useAffectedPrompt';
import type { ExtraRateModel } from '@/features/extra-slots/models/ExtraSlotModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { dayjs, type Dayjs } from '@/shared/utils/dayjs';
import { formatNumber, toIsoDate } from '@/shared/utils/format';
import { applyFieldErrors, applyServerErrors, parseForm, stripEmpty, zodRule } from '@/shared/utils/zodForm';

interface RateFormValues {
  pricePerSession: number;
  effectiveFrom: Dayjs;
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
  /** Trả dòng giá vừa tạo (kèm bản ghi đã xác nhận bị lệch giá, nếu có) */
  onSubmit: (body: RateBody) => Promise<ExtraRateModel>;
  onClose: () => void;
}

/** Đặt giá mới từ một ngày — dùng chung cho giá mặc định của ca và giá riêng học sinh */
export function SetRateModal({
  open,
  title,
  hint,
  currentPrice,
  loading,
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
      CreateSlotRateBody,
      stripEmpty({ ...values, effectiveFrom: toIsoDate(values.effectiveFrom) }),
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
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t.common.save}
      cancelText={t.common.cancel}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">{hint}</Typography.Paragraph>
      <Form<RateFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="pricePerSession"
          label={t.extraSlots.price}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(PricePerSession)]}
        >
          <InputNumber<number>
            min={0}
            step={10_000}
            style={{ width: '100%' }}
            addonAfter={t.format.currency}
            formatter={(v) => (v === undefined || v === null ? '' : formatNumber(Number(v)))}
            parser={(v) => Number((v ?? '').replace(/\D/g, ''))}
          />
        </Form.Item>
        <Form.Item
          name="effectiveFrom"
          label={t.extraSlots.effectiveFrom}
          extra={t.extraSlots.rateHint}
          rules={[{ required: true, message: t.common.requiredField }]}
        >
          <DatePicker format={t.format.date} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="note" label={t.common.note}>
          <Input maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
