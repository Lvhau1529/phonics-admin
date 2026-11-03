import { App, DatePicker, Flex, Form, Input, Modal, Radio, Typography } from 'antd';
import { CancelAttendanceSessionsBody } from '@phonics/contracts';
import { useEffect } from 'react';
import { AttendanceService } from '@/features/attendance/api/attendanceService';
import { ExtraSlotSelect } from '@/features/extra-slots/components/ExtraSlotSelect';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { type Dayjs } from '@/shared/utils/dayjs';
import { toIsoDate } from '@/shared/utils/format';
import { applyFieldErrors, applyServerErrors, parseForm } from '@/shared/utils/zodForm';

type CancelMode = 'selected' | 'date';

interface CancelFormValues {
  mode: CancelMode;
  date?: Dayjs;
  /** Nghỉ nhiều ngày: đến ngày (trống = một ngày) */
  dateTo?: Dayjs | null;
  /** Chỉ các ca này (trống = mọi ca) */
  slotIds?: string[];
  reason: string;
}

interface CancelSessionsModalProps {
  open: boolean;
  /** Buổi đang chọn ở bảng (rỗng = chỉ huỷ theo ngày) */
  selectedIds: string[];
  onClose: (cancelled: boolean) => void;
}

/** Huỷ buổi (nghỉ lễ): các buổi đang chọn, hoặc cả một ngày (buổi chưa tạo cũng được đánh dấu huỷ) */
export function CancelSessionsModal({ open, selectedIds, onClose }: CancelSessionsModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<CancelFormValues>();
  const cancel = AttendanceService.useCancel();
  const mode = Form.useWatch('mode', form);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ mode: selectedIds.length ? 'selected' : 'date' });
  }, [open, selectedIds.length, form]);

  const handleFinish = async (values: CancelFormValues) => {
    const parsed = parseForm(CancelAttendanceSessionsBody, {
      reason: values.reason,
      ...(values.mode === 'selected'
        ? { sessionIds: selectedIds }
        : {
            date: values.date ? toIsoDate(values.date) : undefined,
            dateTo: values.dateTo ? toIsoDate(values.dateTo) : undefined,
            slotIds: values.slotIds?.length ? values.slotIds : undefined,
          }),
    });
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      const res = await cancel.mutateAsync(parsed.data);
      message.success(t.attendance.cancelledCount(res.cancelled.length));
      onClose(true);
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Modal
      open={open}
      title={t.attendance.cancelSessions}
      onCancel={() => onClose(false)}
      onOk={() => form.submit()}
      okText={t.attendance.cancelSessions}
      okButtonProps={{ danger: true }}
      cancelText={t.common.close}
      confirmLoading={cancel.isPending}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">{t.attendance.cancelHint}</Typography.Paragraph>
      <Form<CancelFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="mode">
          <Radio.Group
            options={[
              {
                value: 'selected',
                label: t.attendance.cancelSelected(selectedIds.length),
                disabled: selectedIds.length === 0,
              },
              { value: 'date', label: t.attendance.cancelByDate },
            ]}
          />
        </Form.Item>
        {mode === 'date' && (
          <>
            <Form.Item
              label={t.attendance.cancelDates}
              extra={t.attendance.cancelDatesHint}
              style={{ marginBottom: 12 }}
            >
              <Flex gap={8} align="center">
                <Form.Item name="date" noStyle rules={[{ required: true, message: t.common.requiredField }]}>
                  <DatePicker format={t.format.date} placeholder={t.common.from} style={{ flex: 1 }} />
                </Form.Item>
                –
                <Form.Item name="dateTo" noStyle>
                  <DatePicker format={t.format.date} placeholder={t.common.to} style={{ flex: 1 }} />
                </Form.Item>
              </Flex>
            </Form.Item>
            <Form.Item name="slotIds" label={t.attendance.cancelSlots}>
              <ExtraSlotSelect mode="multiple" allowClear placeholder={t.attendance.cancelSlotsPlaceholder} />
            </Form.Item>
          </>
        )}
        <Form.Item
          name="reason"
          label={t.attendance.cancelReason}
          rules={[{ required: true, message: t.common.requiredField }]}
        >
          <Input maxLength={200} placeholder={t.attendance.cancelReasonPlaceholder} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
