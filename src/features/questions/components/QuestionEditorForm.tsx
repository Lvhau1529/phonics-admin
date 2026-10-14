import {
  Affix,
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  Typography,
} from 'antd';
import {
  CreateQuestionBody,
  Instruction,
  UpdateQuestionBody,
  type QuestionType,
  type UpdateQuestionBody as UpdateBody,
} from '@phonics/contracts';
import { useState } from 'react';
import { useMediaMap } from '@/features/media/mediaMap';
import { MediaUpload } from '@/features/media/components/MediaUpload';
import { QuestionTypePicker } from '@/features/questions/components/QuestionTypePicker';
import { QuestionPreviewPane } from '@/features/questions/components/QuestionPreviewPane';
import { QuestionTypeTag } from '@/features/questions/components/QuestionTypeTag';
import { TypeEditor } from '@/features/questions/components/editor/TypeEditor';
import { emptyDraft, type QuestionDraft } from '@/features/questions/components/editor/types';
import { useCreateQuestion, useQuestionTags, useUpdateQuestion } from '@/features/questions/hooks';
import type { QuestionModel } from '@/features/questions/models/QuestionModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import {
  applyFieldErrors,
  applyServerErrors,
  deepStripEmpty,
  parseForm,
  zodRule,
} from '@/shared/utils/zodForm';

interface CommonValues {
  instruction: string;
  instructionVi?: string;
  points: number;
  tags: string[];
  visibilityShared: boolean;
  exampleText?: string;
  exampleImageMediaId?: string;
}

interface QuestionEditorFormProps {
  /** Sửa câu có sẵn; không có = tạo mới */
  question?: QuestionModel;
  /** Dạng chọn trước (tạo mới từ composer); không có → hiện bộ chọn dạng */
  initialType?: QuestionType;
  onSaved: (question: QuestionModel) => void;
  /** Nhúng trong Drawer: ẩn cột preview rộng */
  compact?: boolean;
  readOnly?: boolean;
}

const CONTENT_PREFIX = /^(config|answerKey)(\.|$)/;

/**
 * Form câu hỏi: trường chung (antd Form) + editor theo dạng (state `draft`) + preview. Lúc lưu ghép thành body và
 * gate bằng `CreateQuestionBody` / `UpdateQuestionBody` (validate hai lớp); lỗi config / answerKey hiện dạng danh sách.
 */
export function QuestionEditorForm({
  question,
  initialType,
  onSaved,
  compact,
  readOnly,
}: QuestionEditorFormProps) {
  const [form] = Form.useForm<CommonValues>();
  const create = useCreateQuestion();
  const update = useUpdateQuestion();
  const tags = useQuestionTags();
  const mediaMap = useMediaMap();
  const [draft, setDraft] = useState<QuestionDraft | null>(() =>
    question
      ? {
          type: question.type,
          config: question.config as Record<string, unknown>,
          answerKey: question.answerKey as Record<string, unknown>,
        }
      : initialType
        ? emptyDraft(initialType)
        : null,
  );
  const [contentErrors, setContentErrors] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const watched = Form.useWatch([], form);

  if (!draft) {
    return (
      <Flex vertical gap={12}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {t.questions.chooseType}
        </Typography.Title>
        <QuestionTypePicker onPick={(type) => setDraft(emptyDraft(type))} />
      </Flex>
    );
  }

  const patch = (config?: Record<string, unknown>, answerKey?: Record<string, unknown>) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            config: config ? { ...d.config, ...config, type: d.type } : d.config,
            answerKey: answerKey ? { ...d.answerKey, ...answerKey, type: d.type } : d.answerKey,
          }
        : d,
    );

  const handleFinish = async (values: CommonValues) => {
    setContentErrors([]);
    setFormError(null);
    const example = values.exampleText?.trim()
      ? { text: values.exampleText.trim(), imageMediaId: values.exampleImageMediaId || undefined }
      : undefined;
    const content = deepStripEmpty({ config: draft.config, answerKey: draft.answerKey });
    const body = {
      type: draft.type,
      instruction: values.instruction,
      instructionVi: values.instructionVi || undefined,
      points: values.points,
      tags: values.tags ?? [],
      example,
      config: { ...content.config, type: draft.type },
      answerKey: { ...content.answerKey, type: draft.type },
      visibility: values.visibilityShared ? 'SHARED' : 'PRIVATE',
    };
    const parsed = question
      ? parseForm(UpdateQuestionBody, { ...body, type: undefined, example: example ?? null })
      : parseForm(CreateQuestionBody, body);
    if (!parsed.success) {
      const common: Record<string, string[]> = {};
      const content: string[] = [];
      for (const [path, errors] of Object.entries(parsed.fieldErrors)) {
        if (CONTENT_PREFIX.test(path)) content.push(`${path}: ${errors.join('; ')}`);
        else common[path] = errors;
      }
      applyFieldErrors(form, common);
      setContentErrors([...content, ...parsed.formErrors]);
      return;
    }
    try {
      const saved = question
        ? await update.mutateAsync({ id: question.id, body: parsed.data as UpdateBody })
        : await create.mutateAsync(parsed.data as CreateQuestionBody);
      mediaMap.merge(saved.media);
      onSaved(saved);
    } catch (error) {
      if (!applyServerErrors(form, error)) setFormError(errorMessage(error));
    }
  };

  const formBlock = (
    <Form<CommonValues>
      form={form}
      layout="vertical"
      disabled={readOnly}
      onFinish={handleFinish}
      initialValues={{
        instruction: question?.instruction ?? '',
        instructionVi: question?.instructionVi ?? undefined,
        points: question?.points ?? 1,
        tags: question?.tags ?? [],
        visibilityShared: question ? question.visibility === 'SHARED' : true,
        exampleText: question?.example?.text,
        exampleImageMediaId: question?.example?.imageMediaId,
      }}
    >
      <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
        <QuestionTypeTag type={draft.type} />
        {!question && (
          <Button size="small" type="link" onClick={() => setDraft(null)}>
            {t.questions.chooseType}
          </Button>
        )}
      </Flex>
      <Form.Item
        name="instruction"
        label={t.questions.instruction}
        rules={[{ required: true, message: t.common.requiredField }, zodRule(Instruction)]}
      >
        <Input maxLength={300} placeholder="Look at the picture. Circle the correct word." />
      </Form.Item>
      <Form.Item name="instructionVi" label={t.questions.instructionVi}>
        <Input maxLength={300} />
      </Form.Item>
      <Flex gap={16} wrap>
        <Form.Item
          name="points"
          label={t.questions.points}
          rules={[{ required: true, message: t.common.requiredField }]}
        >
          <InputNumber min={1} max={100} precision={0} />
        </Form.Item>
        <Form.Item
          name="tags"
          label={t.questions.tags}
          style={{ flex: 1, minWidth: 220 }}
          extra={t.questions.tagsHint}
        >
          <Select
            mode="tags"
            tokenSeparators={[',']}
            options={(tags.data?.items ?? []).map((x) => ({ value: x.tag, label: `${x.tag} (${x.count})` }))}
          />
        </Form.Item>
        <Form.Item name="visibilityShared" label={t.questions.visibilityShared} valuePropName="checked">
          <Switch />
        </Form.Item>
      </Flex>
      <Card size="small" title={t.questions.example} style={{ marginBottom: 16 }}>
        <Flex gap={16} align="flex-start" wrap>
          <Form.Item
            name="exampleText"
            label={t.questions.exampleText}
            style={{ flex: 1, minWidth: 220, marginBottom: 0 }}
          >
            <Input maxLength={200} placeholder="m - a - p → map" />
          </Form.Item>
          <Form.Item name="exampleImageMediaId" label={t.questions.exampleImage} style={{ marginBottom: 0 }}>
            <MediaUpload kind="IMAGE" size={64} />
          </Form.Item>
        </Flex>
      </Card>
      <Card
        size="small"
        title={t.questionType[draft.type]}
        extra={<Typography.Text type="secondary">{t.questionTypeHint[draft.type]}</Typography.Text>}
      >
        <TypeEditor draft={draft} patch={patch} disabled={readOnly} />
      </Card>
      {contentErrors.length > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 12 }}
          message={t.questions.contentErrors}
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {contentErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          }
        />
      )}
      {formError && <Alert type="error" showIcon style={{ marginTop: 12 }} message={formError} />}
      {!readOnly && (
        <Flex justify="flex-end" style={{ marginTop: 16 }}>
          <Button type="primary" loading={create.isPending || update.isPending} onClick={() => form.submit()}>
            {t.common.save}
          </Button>
        </Flex>
      )}
    </Form>
  );

  const preview = (
    <QuestionPreviewPane
      draft={draft}
      instruction={watched?.instruction}
      example={
        watched?.exampleText
          ? { text: watched.exampleText, imageMediaId: watched.exampleImageMediaId || undefined }
          : null
      }
    />
  );

  if (compact) {
    return (
      <Flex vertical gap={16}>
        {formBlock}
        {preview}
      </Flex>
    );
  }
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={14}>
        {formBlock}
      </Col>
      <Col xs={24} xl={10}>
        <Affix offsetTop={80}>{preview}</Affix>
      </Col>
    </Row>
  );
}
