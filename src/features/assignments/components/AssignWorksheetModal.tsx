import { App, Button, DatePicker, Flex, Form, InputNumber, Modal, Switch } from 'antd';
import { CreateAssignmentBody } from '@phonics/contracts';
import dayjs, { type Dayjs } from 'dayjs';
import { AssignmentsService } from '@/features/assignments/api/assignmentsService';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { WorksheetSelect } from '@/features/worksheets/components/WorksheetSelect';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { applyFieldErrors, applyServerErrors, parseForm } from '@/shared/utils/zodForm';
import { toIsoDate } from '@/shared/utils/format';

interface AssignValues {
  worksheetId: string;
  classIds: string[];
  scheduledFor: Dayjs;
  availableFrom?: Dayjs;
  dueAt?: Dayjs;
  allowLate: boolean;
  maxAttempts: number;
  showAnswersAfterSubmit: boolean;
}

interface AssignWorksheetModalProps {
  open: boolean;
  onClose: () => void;
  /** Cố định phiếu (từ composer) */
  worksheetId?: string;
  worksheetTitle?: string;
  /** Cố định lớp (từ trang lớp) */
  classId?: string;
  /** Ngày chọn sẵn (từ lịch) */
  scheduledFor?: string;
  onAssigned?: () => void;
}

/** Giao một phiếu cho một / nhiều lớp (mỗi lớp một bài giao) */
export function AssignWorksheetModal({
  open,
  onClose,
  worksheetId,
  worksheetTitle,
  classId,
  scheduledFor,
  onAssigned,
}: AssignWorksheetModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={worksheetTitle ? t.assignments.assignTitle(worksheetTitle) : t.assignments.assign}
      footer={null}
      destroyOnHidden
      width={560}
    >
      <AssignForm
        worksheetId={worksheetId}
        classId={classId}
        scheduledFor={scheduledFor}
        onClose={onClose}
        onAssigned={onAssigned}
      />
    </Modal>
  );
}

function AssignForm({
  worksheetId,
  classId,
  scheduledFor,
  onClose,
  onAssigned,
}: Omit<AssignWorksheetModalProps, 'open' | 'worksheetTitle'>) {
  const { message } = App.useApp();
  const [form] = Form.useForm<AssignValues>();
  const create = AssignmentsService.useCreate();

  const handleFinish = async (values: AssignValues) => {
    const bodies = values.classIds.map((cid) =>
      parseForm(CreateAssignmentBody, {
        worksheetId: values.worksheetId,
        classId: cid,
        scheduledFor: toIsoDate(values.scheduledFor),
        availableFrom: values.availableFrom?.toISOString(),
        dueAt: values.dueAt?.toISOString(),
        allowLate: values.allowLate,
        maxAttempts: values.maxAttempts,
        showAnswersAfterSubmit: values.showAnswersAfterSubmit,
      }),
    );
    const failed = bodies.find((b) => !b.success);
    if (failed && !failed.success) return applyFieldErrors(form, failed.fieldErrors);
    try {
      let done = 0;
      for (const b of bodies) {
        if (b.success) {
          await create.mutateAsync(b.data);
          done += 1;
        }
      }
      message.success(t.assignments.assigned(done));
      onAssigned?.();
      onClose();
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Form<AssignValues>
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        worksheetId,
        classIds: classId ? [classId] : [],
        scheduledFor: scheduledFor ? dayjs(scheduledFor) : dayjs(),
        allowLate: false,
        maxAttempts: 1,
        showAnswersAfterSubmit: false,
      }}
    >
      <Form.Item
        name="worksheetId"
        label={t.assignments.worksheet}
        rules={[{ required: true, message: t.common.requiredField }]}
      >
        <WorksheetSelect disabled={!!worksheetId} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="classIds"
        label={t.assignments.classes}
        rules={[{ required: true, message: t.common.requiredField }]}
      >
        <ClassSelect<string[]> mode="multiple" disabled={!!classId} style={{ width: '100%' }} />
      </Form.Item>
      <Flex gap={12} wrap>
        <Form.Item
          name="scheduledFor"
          label={t.assignments.scheduledFor}
          rules={[{ required: true, message: t.common.requiredField }]}
        >
          <DatePicker format={t.format.date} />
        </Form.Item>
        <Form.Item
          name="availableFrom"
          label={t.assignments.availableFrom}
          extra={t.assignments.availableFromHint}
        >
          <DatePicker showTime format={t.format.dateTime} />
        </Form.Item>
        <Form.Item name="dueAt" label={t.assignments.dueAt} extra={t.assignments.dueAtHint}>
          <DatePicker showTime format={t.format.dateTime} />
        </Form.Item>
      </Flex>
      <Flex gap={24} wrap>
        <Form.Item name="maxAttempts" label={t.assignments.maxAttempts}>
          <InputNumber min={1} max={10} precision={0} />
        </Form.Item>
        <Form.Item name="allowLate" label={t.assignments.allowLate} valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="showAnswersAfterSubmit" label={t.assignments.showAnswers} valuePropName="checked">
          <Switch />
        </Form.Item>
      </Flex>
      <Flex justify="flex-end" gap={8}>
        <Button onClick={onClose}>{t.common.cancel}</Button>
        <Button type="primary" loading={create.isPending} onClick={() => form.submit()}>
          {t.assignments.assign}
        </Button>
      </Flex>
    </Form>
  );
}
