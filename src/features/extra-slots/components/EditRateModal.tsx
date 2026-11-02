import { App, Form, Input, InputNumber } from 'antd';
import { PricePerSession, UpdateExtraRateBody } from '@phonics/contracts';
import { useEffect } from 'react';
import { ExtraSlotsService } from '@/features/extra-slots/api/extraSlotsService';
import { useAffectedPrompt } from '@/features/extra-slots/components/useAffectedPrompt';
import type { ExtraRateModel } from '@/features/extra-slots/models/ExtraSlotModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { TypedConfirmModal } from '@/shared/ui/TypedConfirmModal';
import { formatNumber } from '@/shared/utils/format';
import { applyFieldErrors, applyServerErrors, diffValues, parseForm, zodRule } from '@/shared/utils/zodForm';

interface EditRateFormValues {
  pricePerSession: number;
  note?: string;
}

/**
 * Sửa đơn giá / ghi chú của một dòng giá nhập sai (giữ khoảng ngày, không tạo dòng mới): phải gõ cụm xác nhận; sau đó
 * hỏi áp vào buổi đã xác nhận có giá khác nếu có.
 */
export function EditRateModal({ rate, onClose }: { rate: ExtraRateModel | undefined; onClose: () => void }) {
  const { message } = App.useApp();
  const [form] = Form.useForm<EditRateFormValues>();
  const update = ExtraSlotsService.useUpdateRate();
  const prompt = useAffectedPrompt();

  useEffect(() => {
    if (!rate) return;
    form.resetFields();
    form.setFieldsValue({ pricePerSession: rate.pricePerSession, note: rate.note ?? undefined });
  }, [rate, form]);

  const handleFinish = async (values: EditRateFormValues) => {
    if (!rate) return;
    const diff = diffValues(
      { pricePerSession: rate.pricePerSession, note: rate.note },
      { pricePerSession: values.pricePerSession, note: values.note?.trim() || null },
    );
    if (Object.keys(diff).length === 0) {
      message.info(t.common.noChanges);
      return;
    }
    const parsed = parseForm(UpdateExtraRateBody, diff);
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      const updated = await update.mutateAsync({ rateId: rate.id, body: parsed.data });
      message.success(t.extraSlots.priceUpdated);
      onClose();
      prompt.records(updated.id, updated.affectedRecords);
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <TypedConfirmModal
      open={!!rate}
      title={rate ? `${t.extraSlots.editPrice} · ${rate.rangeText}` : undefined}
      warning={rate && t.extraSlots.editPriceWarning(rate.priceText, rate.rangeText)}
      phrase={t.extraSlots.priceConfirmWord}
      okText={t.common.save}
      loading={update.isPending}
      onOk={() => form.submit()}
      onCancel={onClose}
    >
      <Form<EditRateFormValues> form={form} layout="vertical" onFinish={handleFinish}>
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
        <Form.Item name="note" label={t.common.note}>
          <Input maxLength={200} />
        </Form.Item>
      </Form>
    </TypedConfirmModal>
  );
}
