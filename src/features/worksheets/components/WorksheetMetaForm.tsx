import { App, Button, Flex, Form, Input, InputNumber, Segmented, Select, Switch } from 'antd';
import {
  CreateWorksheetBody,
  Grade,
  UpdateWorksheetBody,
  WorksheetTitle,
  type Subject,
  type WorksheetKind,
} from '@phonics/contracts';
import { WorksheetsService } from '@/features/worksheets/api/worksheetsService';
import type { WorksheetModel } from '@/features/worksheets/models/WorksheetModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import {
  applyFieldErrors,
  applyServerErrors,
  diffValues,
  parseForm,
  stripEmpty,
  zodRule,
} from '@/shared/utils/zodForm';

interface MetaValues {
  title: string;
  subject: Subject;
  topic?: string;
  grade?: string;
  week?: number;
  day?: number;
  kind: WorksheetKind;
  visibilityShared: boolean;
  note?: string;
}

interface WorksheetMetaFormProps {
  worksheet?: WorksheetModel;
  onSaved: (ws: WorksheetModel) => void;
  readOnly?: boolean;
}

/** Thông tin phiếu (tên, môn, chủ đề, khối, tuần / ngày, loại). Tạo mới → trả về phiếu (đã có Part 1) để ghép câu. */
export function WorksheetMetaForm({ worksheet, onSaved, readOnly }: WorksheetMetaFormProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<MetaValues>();
  const create = WorksheetsService.useCreate();
  const update = WorksheetsService.useUpdate();

  const handleFinish = async (raw: MetaValues) => {
    const values = stripEmpty(raw as unknown as Record<string, unknown>) as unknown as MetaValues;
    const body = {
      title: values.title,
      subject: values.subject,
      topic: values.topic,
      grade: values.grade,
      week: values.week,
      day: values.day,
      kind: values.kind,
      visibility: values.visibilityShared ? ('SHARED' as const) : ('PRIVATE' as const),
      note: values.note,
    };
    try {
      if (worksheet) {
        const original = {
          title: worksheet.title,
          subject: worksheet.subject,
          topic: worksheet.topic ?? undefined,
          grade: worksheet.grade ?? undefined,
          week: worksheet.week ?? undefined,
          day: worksheet.day ?? undefined,
          kind: worksheet.kind,
          visibility: worksheet.visibility,
          note: worksheet.note ?? undefined,
        };
        const diff = diffValues(original, body);
        if (!Object.keys(diff).length) return void message.info(t.common.noChanges);
        // Field bỏ trống khi sửa → null (xoá giá trị)
        const patch = Object.fromEntries(
          Object.entries(diff).map(([k, v]) => [k, v === undefined ? null : v]),
        );
        const parsed = parseForm(UpdateWorksheetBody, patch);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        onSaved(await update.mutateAsync({ id: worksheet.id, body: parsed.data }));
        message.success(t.common.updated);
      } else {
        const parsed = parseForm(CreateWorksheetBody, body);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        onSaved(await create.mutateAsync(parsed.data));
        message.success(t.common.created);
      }
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Form<MetaValues>
      form={form}
      layout="vertical"
      disabled={readOnly}
      onFinish={handleFinish}
      initialValues={{
        title: worksheet?.title ?? '',
        subject: worksheet?.subject ?? 'PHONICS',
        topic: worksheet?.topic ?? undefined,
        grade: worksheet?.grade ?? undefined,
        week: worksheet?.week ?? undefined,
        day: worksheet?.day ?? undefined,
        kind: worksheet?.kind ?? 'WORKSHEET',
        visibilityShared: worksheet ? worksheet.visibility === 'SHARED' : true,
        note: worksheet?.note ?? undefined,
      }}
    >
      <Flex gap={16} wrap>
        <Form.Item
          name="title"
          label={t.worksheets.name}
          style={{ flex: 2, minWidth: 260 }}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(WorksheetTitle)]}
        >
          <Input maxLength={120} placeholder="Letter Nn — Handout 2" />
        </Form.Item>
        <Form.Item name="subject" label={t.worksheets.subject}>
          <Segmented<Subject>
            options={[
              { value: 'PHONICS', label: t.subject.PHONICS },
              { value: 'ESL', label: t.subject.ESL },
            ]}
          />
        </Form.Item>
        <Form.Item name="kind" label={t.worksheets.kind}>
          <Select<WorksheetKind>
            options={(['WORKSHEET', 'HANDOUT', 'EXTRA'] as const).map((k) => ({
              value: k,
              label: t.worksheetKind[k],
            }))}
            style={{ width: 140 }}
          />
        </Form.Item>
      </Flex>
      <Flex gap={16} wrap>
        <Form.Item name="topic" label={t.worksheets.topic} style={{ flex: 1, minWidth: 180 }}>
          <Input maxLength={80} placeholder={t.worksheets.topicPlaceholder} />
        </Form.Item>
        <Form.Item name="grade" label={t.worksheets.grade} rules={[zodRule(Grade)]}>
          <Input maxLength={20} style={{ width: 100 }} placeholder="K" />
        </Form.Item>
        <Form.Item name="week" label={t.worksheets.week}>
          <InputNumber min={1} max={52} precision={0} style={{ width: 90 }} />
        </Form.Item>
        <Form.Item name="day" label={t.worksheets.day}>
          <Select
            allowClear
            options={[1, 2, 3, 4, 5].map((d) => ({ value: d, label: t.worksheets.dayLabel(d) }))}
            style={{ width: 90 }}
          />
        </Form.Item>
        <Form.Item name="visibilityShared" label={t.questions.visibilityShared} valuePropName="checked">
          <Switch />
        </Form.Item>
      </Flex>
      <Form.Item name="note" label={t.worksheets.note}>
        <Input.TextArea rows={2} maxLength={1000} />
      </Form.Item>
      {!readOnly && (
        <Flex justify="flex-end">
          <Button type="primary" loading={create.isPending || update.isPending} onClick={() => form.submit()}>
            {t.common.save}
          </Button>
        </Flex>
      )}
    </Form>
  );
}
