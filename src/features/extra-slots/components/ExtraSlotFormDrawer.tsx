import {
  App,
  Button,
  DatePicker,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  TimePicker,
} from 'antd';
import {
  CreateExtraSlotBody,
  ExtraSlotKind,
  SlotName,
  UpdateExtraSlotBody,
  Weekday,
} from '@phonics/contracts';
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
import { toIsoDate } from '@/shared/utils/format';
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
  kind: ExtraSlotKind;
  /** Sửa: một thứ */
  weekday: number;
  /** Tạo: nhiều thứ → mỗi thứ một ca */
  weekdays: number[];
  /** Sửa giờ: áp cho buổi đã tạo từ ngày này */
  timeFrom?: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  room?: string;
  capacity?: number | null;
  classId?: string;
  teacherIds?: string[];
  /** Ngày đầu có buổi (trống = ngay) */
  startsOn?: Dayjs | null;
  /** Tạo: ngừng từ ngày (trống = chưa định); sửa thì dùng nút "Ngừng ca" */
  endsOn?: Dayjs | null;
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
 * Tạo / sửa ca học thêm (extra.manageSlots). Tạo: chọn nhiều thứ = mỗi thứ một ca cùng tên / giờ. Sửa: giáo viên đổi
 * bằng "Gán giáo viên"; ô trống = xoá giá trị; đổi giờ thì chọn ngày áp giờ mới cho buổi đã tạo (mặc định hôm nay).
 * GV tạo ca: không chọn GV (server tự gán chính GV đó), lớp chỉ lớp mình dạy.
 */
export function ExtraSlotFormDrawer({ open, slot, onClose }: ExtraSlotFormDrawerProps) {
  const { message } = App.useApp();
  const { isAdmin } = useAuth();
  const [form] = Form.useForm<SlotFormValues>();
  const create = ExtraSlotsService.useCreate();
  const update = ExtraSlotsService.useUpdate();
  const startTime = Form.useWatch('startTime', form);
  const endTime = Form.useWatch('endTime', form);
  const timeChanged =
    !!slot &&
    !!startTime &&
    !!endTime &&
    (startTime.format(TIME_FORMAT) !== slot.startTime || endTime.format(TIME_FORMAT) !== slot.endTime);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (slot)
      form.setFieldsValue({
        name: slot.name,
        kind: slot.kind,
        weekday: slot.weekday,
        startTime: timeValue(slot.startTime),
        endTime: timeValue(slot.endTime),
        timeFrom: dayjs(),
        room: slot.room ?? undefined,
        capacity: slot.capacity,
        classId: slot.class?.id,
        startsOn: slot.startsOn ? dayjs(slot.startsOn) : null,
      });
  }, [open, slot, form]);

  const handleFinish = async (raw: SlotFormValues) => {
    const { weekdays, timeFrom, startsOn, endsOn, ...rest } = raw;
    const values = stripEmpty({
      ...rest,
      startTime: raw.startTime.format(TIME_FORMAT),
      endTime: raw.endTime.format(TIME_FORMAT),
      capacity: raw.capacity ?? undefined,
      startsOn: startsOn ? toIsoDate(startsOn) : undefined,
      endsOn: endsOn ? toIsoDate(endsOn) : undefined,
    });
    try {
      if (slot) {
        const diff = diffValues(
          {
            name: slot.name,
            kind: slot.kind,
            weekday: slot.weekday,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: slot.room,
            capacity: slot.capacity,
            classId: slot.class?.id ?? null,
            startsOn: slot.startsOn,
          },
          {
            name: values.name,
            kind: values.kind,
            weekday: values.weekday,
            startTime: values.startTime,
            endTime: values.endTime,
            room: values.room ?? null,
            capacity: values.capacity ?? null,
            classId: values.classId ?? null,
            startsOn: values.startsOn ?? null,
          },
        );
        // Đổi một trong hai giờ thì gửi cả hai (schema yêu cầu đi cùng nhau)
        if (diff.startTime !== undefined || diff.endTime !== undefined) {
          diff.startTime = values.startTime;
          diff.endTime = values.endTime;
        }
        if (Object.keys(diff).length === 0) return void message.info(t.common.noChanges);
        const parsed = parseForm(UpdateExtraSlotBody, {
          ...diff,
          ...(diff.startTime !== undefined && timeFrom ? { timeFrom: toIsoDate(timeFrom) } : {}),
        });
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        await update.mutateAsync({ id: slot.id, body: parsed.data });
        message.success(t.common.updated);
        onClose();
      } else {
        await createAll(
          values,
          [...new Set(weekdays)].sort((a, b) => a - b),
        );
      }
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  /** Mỗi thứ một ca; ca đầu lỗi thì báo theo field, lỗi giữa chừng thì báo số ca đã tạo rồi đóng */
  const createAll = async (values: Record<string, unknown>, days: readonly number[]) => {
    const bodies = [];
    for (const weekday of days) {
      const parsed = parseForm(CreateExtraSlotBody, { ...values, weekday });
      if (!parsed.success)
        return applyFieldErrors(form, { ...parsed.fieldErrors, weekdays: parsed.fieldErrors.weekday ?? [] });
      bodies.push(parsed.data);
    }
    let done = 0;
    try {
      for (const body of bodies) {
        await create.mutateAsync(body);
        done += 1;
      }
    } catch (error) {
      if (done === 0) throw error;
      message.error(t.extraSlots.createdPartial(done, bodies.length, errorMessage(error)));
      return onClose();
    }
    message.success(bodies.length > 1 ? t.extraSlots.createdSlots(bodies.length) : t.common.created);
    onClose();
  };

  const weekdayOptions = WEEKDAYS.map((d) => ({ value: d, label: t.weekday[d] }));
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
          name="kind"
          label={t.extraSlots.kind}
          extra={t.extraSlots.kindHint}
          initialValue="EXTRA_CLASS"
        >
          <Radio.Group
            optionType="button"
            options={ExtraSlotKind.options.map((value) => ({ value, label: t.extraSlots.kindLabel[value] }))}
          />
        </Form.Item>
        {slot ? (
          <Form.Item
            name="weekday"
            label={t.extraSlots.weekday}
            rules={[{ required: true, message: t.common.requiredField }, zodRule(Weekday)]}
          >
            <Select options={weekdayOptions} />
          </Form.Item>
        ) : (
          <Form.Item
            name="weekdays"
            label={t.extraSlots.weekday}
            extra={t.extraSlots.weekdaysHint}
            rules={[{ required: true, message: t.common.requiredField }]}
          >
            <Select mode="multiple" options={weekdayOptions} />
          </Form.Item>
        )}
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
        {timeChanged && (
          <Form.Item
            name="timeFrom"
            label={t.extraSlots.timeFrom}
            extra={t.extraSlots.timeFromHint}
            rules={[{ required: true, message: t.common.requiredField }]}
          >
            <DatePicker format={t.format.date} style={{ width: '100%' }} />
          </Form.Item>
        )}
        <Flex gap={12}>
          <Form.Item name="room" label={t.extraSlots.room} style={{ flex: 1 }}>
            <Input maxLength={40} />
          </Form.Item>
          <Form.Item name="capacity" label={t.extraSlots.capacity} style={{ flex: 1 }}>
            <InputNumber<number> min={1} max={200} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Flex>
        <Form.Item name="startsOn" label={t.extraSlots.startsOn} extra={t.extraSlots.startsOnHint}>
          <DatePicker format={t.format.date} style={{ width: '100%' }} />
        </Form.Item>
        {!slot && (
          <Form.Item name="endsOn" label={t.extraSlots.endsOn} extra={t.extraSlots.endsOnHint}>
            <DatePicker
              format={t.format.date}
              disabledDate={(d) => !d.isAfter(dayjs(), 'day')}
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}
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
