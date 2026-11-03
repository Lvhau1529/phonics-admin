import { Alert, App, Button, DatePicker, Form, Modal, Typography } from 'antd';
import { UpdateExtraRateBody } from '@phonics/contracts';
import { useEffect } from 'react';
import { ExtraSlotsService } from '@/features/extra-slots/api/extraSlotsService';
import { useAffectedPrompt } from '@/features/extra-slots/components/useAffectedPrompt';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { dayjs, type Dayjs } from '@/shared/utils/dayjs';
import { toIsoDate } from '@/shared/utils/format';
import { applyFieldErrors, applyServerErrors, parseForm } from '@/shared/utils/zodForm';

/** Giá riêng cần kết thúc (từ lịch sử giá hoặc giá đang áp ở trang ca) */
export interface EndRateTarget {
  rateId: string;
  /** Tên học sinh (tiêu đề) */
  name: string;
  priceText: string;
  /** Ngày bắt đầu nếu biết — chặn chọn ngày trước đó (server vẫn kiểm tra) */
  effectiveFrom?: string;
  /** Hạn hiện có (điền sẵn + cho "Bỏ hạn") */
  effectiveTo: string | null;
}

interface EndRateFormValues {
  effectiveTo: Dayjs;
}

/**
 * Kết thúc giá riêng của học sinh từ một ngày → về giá riêng mọi ca / giá ca (PATCH `effectiveTo`); có hạn rồi thì bỏ
 * hạn được. Sau đó hỏi áp vào buổi đã xác nhận có giá khác nếu có.
 */
export function EndRateModal({
  target,
  onClose,
}: {
  target: EndRateTarget | undefined;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<EndRateFormValues>();
  const update = ExtraSlotsService.useUpdateRate();
  const prompt = useAffectedPrompt();

  useEffect(() => {
    if (!target) return;
    form.resetFields();
    form.setFieldsValue({ effectiveTo: target.effectiveTo ? dayjs(target.effectiveTo) : dayjs() });
  }, [target, form]);

  const save = async (effectiveTo: string | null) => {
    if (!target) return;
    const parsed = parseForm(UpdateExtraRateBody, { effectiveTo });
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      const updated = await update.mutateAsync({ rateId: target.rateId, body: parsed.data });
      message.success(effectiveTo ? t.extraSlots.rateEnded : t.extraSlots.rateEndCleared);
      onClose();
      prompt.records(updated.id, updated.affectedRecords);
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Modal
      open={!!target}
      title={target && t.extraSlots.endRateTitle(target.name)}
      onCancel={onClose}
      destroyOnHidden
      footer={[
        target?.effectiveTo && (
          <Button key="clear" loading={update.isPending} onClick={() => void save(null)}>
            {t.extraSlots.clearRateEnd}
          </Button>
        ),
        <Button key="cancel" onClick={onClose}>
          {t.common.cancel}
        </Button>,
        <Button key="ok" type="primary" danger loading={update.isPending} onClick={() => form.submit()}>
          {t.extraSlots.endRateNow}
        </Button>,
      ]}
    >
      {target && (
        <Typography.Paragraph>
          {t.extraSlots.price}: <Typography.Text strong>{target.priceText}</Typography.Text>
        </Typography.Paragraph>
      )}
      <Form<EndRateFormValues>
        form={form}
        layout="vertical"
        onFinish={(values) => void save(toIsoDate(values.effectiveTo))}
      >
        <Form.Item
          name="effectiveTo"
          label={t.extraSlots.endRateFrom}
          extra={t.extraSlots.endRateFromHint}
          rules={[{ required: true, message: t.common.requiredField }]}
        >
          <DatePicker
            format={t.format.date}
            style={{ width: '100%' }}
            disabledDate={(d) => !!target?.effectiveFrom && toIsoDate(d) < target.effectiveFrom}
          />
        </Form.Item>
      </Form>
      <Alert type="info" showIcon message={t.extraSlots.endRateExplain} />
    </Modal>
  );
}
