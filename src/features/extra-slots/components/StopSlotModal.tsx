import { Alert, App, Button, DatePicker, Flex, Modal, Typography } from 'antd';
import { UpdateExtraSlotBody } from '@phonics/contracts';
import { useState } from 'react';
import { ExtraSlotsService } from '@/features/extra-slots/api/extraSlotsService';
import {
  type ExtraSlotModel,
  lastSessionBefore,
  sessionDateText,
} from '@/features/extra-slots/models/ExtraSlotModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { dayjs, type Dayjs } from '@/shared/utils/dayjs';
import { formatDate, toIsoDate } from '@/shared/utils/format';
import { parseForm } from '@/shared/utils/zodForm';

interface StopSlotModalProps {
  slot: ExtraSlotModel | undefined;
  onClose: () => void;
}

/**
 * Ngừng ca từ một ngày (hôm nay = ngừng ngay, ngày sau = hẹn trước): giải thích hậu quả + buổi cuối cùng. Ca đã hẹn
 * ngày ngừng thì đổi ngày hoặc bỏ ngày ngừng được.
 */
export function StopSlotModal({ slot, onClose }: StopSlotModalProps) {
  const { message } = App.useApp();
  const update = ExtraSlotsService.useUpdate();
  const [date, setDate] = useState<Dayjs | null>(null);
  const today = toIsoDate(dayjs());
  const value = date ?? (slot?.endsOn ? dayjs(slot.endsOn) : dayjs());
  const endsOn = toIsoDate(value);
  const last = slot ? lastSessionBefore(slot, endsOn, today) : null;

  const close = () => {
    setDate(null);
    onClose();
  };

  const save = async (next: string | null) => {
    if (!slot) return;
    const parsed = parseForm(UpdateExtraSlotBody, { endsOn: next });
    if (!parsed.success) return void message.error(Object.values(parsed.fieldErrors).flat()[0]);
    try {
      await update.mutateAsync({ id: slot.id, body: parsed.data });
      if (next === null) message.success(t.extraSlots.stopCleared);
      else if (next <= today) message.success(t.extraSlots.stoppedNow);
      else message.success(t.extraSlots.stopSaved(formatDate(next)));
      close();
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  return (
    <Modal
      open={!!slot}
      title={slot ? t.extraSlots.stopTitle(slot.name) : undefined}
      onCancel={close}
      destroyOnHidden
      footer={
        <Flex justify="space-between" gap={8} wrap>
          <span>
            {slot?.isStopping && (
              <Button loading={update.isPending} onClick={() => void save(null)}>
                {t.extraSlots.clearStop}
              </Button>
            )}
          </span>
          <Flex gap={8}>
            <Button onClick={close}>{t.common.cancel}</Button>
            <Button danger type="primary" loading={update.isPending} onClick={() => void save(endsOn)}>
              {t.extraSlots.stopNow}
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Flex vertical gap={12}>
        <div>
          <Typography.Text strong>{t.extraSlots.stopFrom}</Typography.Text>
          <DatePicker
            value={value}
            onChange={setDate}
            allowClear={false}
            format={t.format.date}
            disabledDate={(d) => d.isBefore(dayjs(), 'day')}
            style={{ width: '100%', marginTop: 4 }}
          />
          <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
            {t.extraSlots.stopFromHint}
          </Typography.Text>
        </div>
        <Alert
          type="info"
          showIcon
          message={last ? t.extraSlots.lastSession(sessionDateText(last)) : t.extraSlots.noSessionLeft}
        />
        <div>
          <Typography.Text strong>{t.extraSlots.stopExplainTitle}</Typography.Text>
          <ul style={{ margin: '4px 0 0', paddingInlineStart: 18 }}>
            {t.extraSlots.stopExplain.map((line) => (
              <li key={line}>
                <Typography.Text type="secondary">{line}</Typography.Text>
              </li>
            ))}
          </ul>
        </div>
        {slot?.isStopping && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t.extraSlots.clearStopHint}
          </Typography.Text>
        )}
      </Flex>
    </Modal>
  );
}
