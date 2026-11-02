import { App, Button, Drawer, Flex, Form, Input, InputNumber, Select, TimePicker } from 'antd';
import { CreateExtraSlotBody, SlotName, UpdateExtraSlotBody, Weekday } from '@phonics/contracts';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/authStore';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { ExtraSlotsService } from '@/features/extra-slots/api/extraSlotsService';
import type { ExtraSlotModel } from '@/features/extra-slots/models/ExtraSlotModel';
import { TeacherSelect } from '@/features/teachers/components/TeacherSelect';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import type { IsoWeekday } from '@/shared/i18n';
import { dayjs, type Dayjs } from '@/shared/utils/dayjs';
import {
  applyFieldErrors,
  applyServerErrors,
  diffValues,
  parseForm,
  stripEmpty,
  zodRule,
} from '@/shared/utils/zodForm';

const TIME_FORMAT = 'HH:mm';
const WEEKDAYS: readonly IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7];

interface SlotFormValues {
  name: string;
  weekday: number;
  startTime: Dayjs;
  endTime: Dayjs;
  room?: string;
  capacity?: number | null;
  classId?: string;
  teacherIds?: string[];
}

/** 'HH:mm' → Dayjs (ngày bất kỳ) cho TimePicker */
const timeValue = (hhmm: string): Dayjs => dayjs(`2000-01-01T${hhmm}`);

interface ExtraSlotFormDrawerProps {
  open: boolean;
  /** Có = sửa, không = tạo mới */
  slot?: ExtraSlotModel;
  onClose: () => void;
}

/**
 * Tạo / sửa ca học thêm (extra.manageSlots). Sửa: giáo viên đổi bằng "Gán giáo viên"; ô trống = xoá giá trị. GV tạo ca:
 * không chọn GV (server tự gán chính GV đó), lớp chỉ lớp mình dạy.
 */
export function ExtraSlotFormDrawer({ open, slot, onClose }: ExtraSlotFormDrawerProps) {
  const { message } = App.useApp();
  const { isAdmin } = useAuth();
  const [form] = Form.useForm<SlotFormValues>();
  const create = ExtraSlotsService.useCreate();
  const update = ExtraSlotsService.useUpdate();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (slot)
      form.setFieldsValue({
        name: slot.name,
        weekday: slot.weekday,
        startTime: timeValue(slot.startTime),
        endTime: timeValue(slot.endTime),
        room: slot.room ?? undefined,
        capacity: slot.capacity,
        classId: slot.class?.id,
      });
  }, [open, slot, form]);

  const handleFinish = async (raw: SlotFormValues) => {
    const values = stripEmpty({
      ...raw,
      startTime: raw.startTime.format(TIME_FORMAT),
      endTime: raw.endTime.format(TIME_FORMAT),
      capacity: raw.capacity ?? undefined,
    });
    try {
      if (slot) {
        const diff = diffValues(
          {
            name: slot.name,
            weekday: slot.weekday,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: slot.room,
            capacity: slot.capacity,
            classId: slot.class?.id ?? null,
          },
          {
            name: values.name,
            weekday: values.weekday,
            startTime: values.startTime,
            endTime: values.endTime,
            room: values.room ?? null,
            capacity: values.capacity ?? null,
            classId: values.classId ?? null,
          },
        );
        // Đổi một trong hai giờ thì gửi cả hai (schema yêu cầu đi cùng nhau)
        if (diff.startTime !== undefined || diff.endTime !== undefined) {
          diff.startTime = values.startTime;
          diff.endTime = values.endTime;
        }
        if (Object.keys(diff).length === 0) return void message.info(t.common.noChanges);
        const parsed = parseForm(UpdateExtraSlotBody, diff);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        await update.mutateAsync({ id: slot.id, body: parsed.data });
        message.success(t.common.updated);
      } else {
        const parsed = parseForm(CreateExtraSlotBody, values);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        await create.mutateAsync(parsed.data);
        message.success(t.common.created);
      }
      onClose();
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={slot ? t.extraSlots.edit : t.extraSlots.add}
      width={440}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>{t.common.cancel}</Button>
          <Button type="primary" loading={create.isPending || update.isPending} onClick={() => form.submit()}>
            {t.common.save}
          </Button>
        </Flex>
      }
    >
      <Form<SlotFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="name"
          label={t.extraSlots.name}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(SlotName)]}
        >
          <Input maxLength={80} placeholder={t.extraSlots.namePlaceholder} />
        </Form.Item>
        <Form.Item
          name="weekday"
          label={t.extraSlots.weekday}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(Weekday)]}
        >
          <Select options={WEEKDAYS.map((d) => ({ value: d, label: t.weekday[d] }))} />
        </Form.Item>
        <Flex gap={12}>
          <Form.Item
            name="startTime"
            label={t.extraSlots.startTime}
            rules={[{ required: true, message: t.common.requiredField }]}
            style={{ flex: 1 }}
          >
            <TimePicker format={TIME_FORMAT} minuteStep={5} needConfirm={false} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="endTime"
            label={t.extraSlots.endTime}
            rules={[{ required: true, message: t.common.requiredField }]}
            style={{ flex: 1 }}
          >
            <TimePicker format={TIME_FORMAT} minuteStep={5} needConfirm={false} style={{ width: '100%' }} />
          </Form.Item>
        </Flex>
        <Flex gap={12}>
          <Form.Item name="room" label={t.extraSlots.room} style={{ flex: 1 }}>
            <Input maxLength={40} />
          </Form.Item>
          <Form.Item name="capacity" label={t.extraSlots.capacity} style={{ flex: 1 }}>
            <InputNumber<number> min={1} max={200} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Flex>
        <Form.Item name="classId" label={t.extraSlots.mainClass}>
          <ClassSelect style={{ width: '100%' }} />
        </Form.Item>
        {!slot && isAdmin && (
          <Form.Item name="teacherIds" label={t.extraSlots.teachers}>
            <TeacherSelect mode="multiple" style={{ width: '100%' }} />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
}
