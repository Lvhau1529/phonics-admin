import { Flex, Input, Switch } from 'antd';
import { AudioField, Field, ImageField } from '@/features/questions/components/editor/editorBits';
import { type EditorProps } from '@/features/questions/components/editor/types';
import { t } from '@/shared/i18n';

/** 13. Tô chữ và đọc to */
export function TraceAndReadEditor({ draft, patch, disabled }: EditorProps) {
  const sentence = (draft.config.sentence as string) ?? '';
  return (
    <>
      <Field label={t.questions.sentence} required>
        <Input
          value={sentence}
          maxLength={200}
          disabled={disabled}
          placeholder="We like to run."
          onChange={(e) =>
            patch({
              sentence: e.target.value,
              tracePart: e.target.value.includes((draft.config.tracePart as string) ?? '')
                ? draft.config.tracePart
                : '',
            })
          }
        />
      </Field>
      <Field label={t.questions.tracePart} required>
        <Input
          value={(draft.config.tracePart as string) ?? ''}
          maxLength={100}
          disabled={disabled}
          placeholder="like to"
          onChange={(e) => patch({ tracePart: e.target.value })}
        />
      </Field>
      <ImageField
        value={draft.config.imageMediaId as string | undefined}
        onChange={(id) => patch({ imageMediaId: id })}
        disabled={disabled}
      />
      <AudioField
        label={t.questions.modelAudio}
        value={draft.config.modelAudioMediaId as string | undefined}
        onChange={(id) => patch({ modelAudioMediaId: id })}
        disabled={disabled}
      />
      <Flex gap={24} wrap>
        <Field label={t.questions.requireTrace}>
          <Switch
            checked={draft.config.requireTrace !== false}
            disabled={disabled}
            onChange={(v) => patch({ requireTrace: v })}
          />
        </Field>
        <Field label={t.questions.requireRecording}>
          <Switch
            checked={draft.config.requireRecording !== false}
            disabled={disabled}
            onChange={(v) => patch({ requireRecording: v })}
          />
        </Field>
      </Flex>
      <Field label={t.questions.rubric}>
        <Input.TextArea
          value={(draft.answerKey.rubric as string) ?? ''}
          rows={2}
          maxLength={500}
          disabled={disabled}
          onChange={(e) => patch(undefined, { rubric: e.target.value || undefined })}
        />
      </Field>
    </>
  );
}

/** 14. Nói / đọc từ */
export function SpeakEditor({ draft, patch, disabled }: EditorProps) {
  return (
    <>
      <Field label={t.questions.prompt} required>
        <Input
          value={(draft.config.prompt as string) ?? ''}
          maxLength={120}
          disabled={disabled}
          placeholder="Say: nest"
          onChange={(e) => patch({ prompt: e.target.value })}
        />
      </Field>
      <ImageField
        value={draft.config.imageMediaId as string | undefined}
        onChange={(id) => patch({ imageMediaId: id })}
        disabled={disabled}
      />
      <AudioField
        label={t.questions.modelAudio}
        value={draft.config.modelAudioMediaId as string | undefined}
        onChange={(id) => patch({ modelAudioMediaId: id })}
        disabled={disabled}
      />
      <Field label={t.questions.rubric}>
        <Input.TextArea
          value={(draft.answerKey.rubric as string) ?? ''}
          rows={2}
          maxLength={500}
          disabled={disabled}
          onChange={(e) => patch(undefined, { rubric: e.target.value || undefined })}
        />
      </Field>
    </>
  );
}
