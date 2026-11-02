import { App, Button, DatePicker, Drawer, Flex, Form, Input, TimePicker } from 'antd';
import { CreateAttendanceSessionBody } from '@phonics/contracts';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AttendanceService } from '@/features/attendance/api/attendanceService';
import { TeacherSelect } from '@/features/teachers/components/TeacherSelect';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { dayjs, type Dayjs } from '@/shared/utils/dayjs';
import { toIsoDate } from '@/shared/utils/format';
import { applyFieldErrors, applyServerErrors, parseForm, stripEmpty } from '@/shared/utils/zodForm';

const TIME_FORMAT = 'HH:mm';

interface SessionFormValues {
  date: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  teacherIds: string[];
  note?: string;
}

/** Tạo buổi bù (không theo ca) — xong chuyển sang trang buổi để thêm học sinh */
export function CreateSessionDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm<SessionFormValues>();
  const create = AttendanceService.useCreate();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ date: dayjs() });
  }, [open, form]);

  const handleFinish = async (raw: SessionFormValues) => {
    const parsed = parseForm(
      CreateAttendanceSessionBody,
      stripEmpty({
        ...raw,
        date: toIsoDate(raw.date),
        startTime: raw.startTime?.format(TIME_FORMAT),
        endTime: raw.endTime?.format(TIME_FORMAT),
      }),
    );
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      const session = await create.mutateAsync(parsed.data);
      message.success(t.common.created);
      onClose();
      void navigate(ROUTES.attendanceSession(session.id));
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  const required = [{ required: true, message: t.common.requiredField }];
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t.attendance.createMakeUp}
      width={420}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>{t.common.cancel}</Button>
          <Button type="primary" loading={create.isPending} onClick={() => form.submit()}>
            {t.common.create}
          </Button>
        </Flex>
      }
    >
      <Form<SessionFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="date" label={t.attendance.date} rules={required}>
          <DatePicker format={t.format.date} style={{ width: '100%' }} />
        </Form.Item>
        <Flex gap={12}>
          <Form.Item name="startTime" label={t.extraSlots.startTime} rules={required} style={{ flex: 1 }}>
            <TimePicker format={TIME_FORMAT} minuteStep={5} needConfirm={false} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endTime" label={t.extraSlots.endTime} rules={required} style={{ flex: 1 }}>
            <TimePicker format={TIME_FORMAT} minuteStep={5} needConfirm={false} style={{ width: '100%' }} />
          </Form.Item>
        </Flex>
        <Form.Item name="teacherIds" label={t.extraSlots.teachers} rules={required}>
          <TeacherSelect mode="multiple" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="note" label={t.common.note} extra={t.attendance.makeUpHint}>
          <Input.TextArea maxLength={500} autoSize={{ minRows: 2 }} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
