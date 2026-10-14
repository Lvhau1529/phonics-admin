import { Button, Flex, Input, Radio, Switch, Typography } from 'antd';
import { Field, ImageField, SortableRows } from '@/features/questions/components/editor/editorBits';
import { newId, type EditorProps } from '@/features/questions/components/editor/types';
import { composeInlineChoices, parseInlineChoices } from '@/features/questions/utils/blanks';
import { MediaUpload } from '@/features/media/components/MediaUpload';
import { t } from '@/shared/i18n';

type TextOption = { id: string; text: string };
type ImageOption = { id: string; mediaId?: string; label?: string; word?: string };

/** 9. Khoanh đáp án đúng */
export function MultipleChoiceEditor({ draft, patch, disabled }: EditorProps) {
  const options = (draft.config.options as TextOption[] | undefined) ?? [];
  const correct = draft.answerKey.optionId as string | undefined;
  return (
    <>
      <ImageField
        value={draft.config.imageMediaId as string | undefined}
        onChange={(id) => patch({ imageMediaId: id })}
        disabled={disabled}
      />
      <Field label={t.questions.prompt}>
        <Input
          value={(draft.config.prompt as string) ?? ''}
          maxLength={200}
          disabled={disabled}
          onChange={(e) => patch({ prompt: e.target.value })}
        />
      </Field>
      <Field label={t.questions.options} required hint={t.questions.correctOption}>
        <Radio.Group
          value={correct}
          onChange={(e) => patch(undefined, { optionId: e.target.value })}
          style={{ width: '100%' }}
        >
          <SortableRows
            items={options}
            onChange={(items) => patch({ options: items })}
            onAdd={() => ({ id: newId('o', options), text: '' })}
            addLabel={t.questions.addOption}
            min={0}
            max={4}
            disabled={disabled}
            render={(o, _i, update) => (
              <Flex gap={8} align="center">
                <Radio value={o.id} disabled={disabled} />
                <Input
                  value={o.text}
                  maxLength={120}
                  disabled={disabled}
                  placeholder={t.questions.optionText}
                  onChange={(e) => update({ text: e.target.value })}
                />
              </Flex>
            )}
          />
        </Radio.Group>
      </Field>
    </>
  );
}

/** 6. Gạch hình khác loại */
export function OddOneOutEditor({ draft, patch, disabled }: EditorProps) {
  const options = (draft.config.options as ImageOption[] | undefined) ?? [];
  const correct = draft.answerKey.optionId as string | undefined;
  return (
    <Field label={t.questions.options} required hint={t.questions.correctOption}>
      <Radio.Group
        value={correct}
        onChange={(e) => patch(undefined, { optionId: e.target.value })}
        style={{ width: '100%' }}
      >
        <SortableRows
          items={options}
          onChange={(items) => patch({ options: items })}
          onAdd={() => ({ id: newId('o', options) }) as ImageOption}
          addLabel={t.questions.addImage}
          max={6}
          disabled={disabled}
          render={(o, _i, update) => (
            <Flex gap={12} align="center">
              <Radio value={o.id} disabled={disabled} />
              <MediaUpload
                kind="IMAGE"
                size={72}
                value={o.mediaId}
                onChange={(id) => update({ mediaId: id })}
                disabled={disabled}
              />
              <Input
                value={o.label ?? ''}
                maxLength={40}
                disabled={disabled}
                placeholder={t.questions.optionLabel}
                onChange={(e) => update({ label: e.target.value || undefined })}
                style={{ width: 160 }}
              />
            </Flex>
          )}
        />
      </Radio.Group>
    </Field>
  );
}

/** 7. Quy luật: hình tiếp theo */
export function PatternNextEditor({ draft, patch, disabled }: EditorProps) {
  const sequence = (draft.config.sequence as string[] | undefined) ?? [];
  const seqItems = sequence.map((mediaId, i) => ({ id: `s${i}`, mediaId }));
  const options = (draft.config.options as ImageOption[] | undefined) ?? [];
  const correct = draft.answerKey.optionId as string | undefined;
  const requireWord = !!draft.config.requireWord;
  return (
    <>
      <Field label={t.questions.sequence} required>
        <SortableRows
          items={seqItems}
          onChange={(items) => patch({ sequence: items.map((i) => i.mediaId) })}
          onAdd={() => ({ id: `s${Date.now()}`, mediaId: '' })}
          addLabel={t.questions.addImage}
          max={10}
          disabled={disabled}
          render={(it, _i, update) => (
            <MediaUpload
              kind="IMAGE"
              size={64}
              value={it.mediaId || undefined}
              onChange={(id) => update({ mediaId: id ?? '' })}
              disabled={disabled}
            />
          )}
        />
      </Field>
      <Field label={t.questions.options} required hint={t.questions.correctOption}>
        <Radio.Group
          value={correct}
          onChange={(e) => patch(undefined, { optionId: e.target.value })}
          style={{ width: '100%' }}
        >
          <SortableRows
            items={options}
            onChange={(items) => patch({ options: items })}
            onAdd={() => ({ id: newId('o', options) }) as ImageOption}
            addLabel={t.questions.addOption}
            max={4}
            disabled={disabled}
            render={(o, _i, update) => (
              <Flex gap={12} align="center">
                <Radio value={o.id} disabled={disabled} />
                <MediaUpload
                  kind="IMAGE"
                  size={64}
                  value={o.mediaId}
                  onChange={(id) => update({ mediaId: id })}
                  disabled={disabled}
                />
                <Input
                  value={o.word ?? ''}
                  maxLength={40}
                  disabled={disabled}
                  placeholder={t.questions.word}
                  onChange={(e) => update({ word: e.target.value || undefined })}
                  style={{ width: 140 }}
                />
              </Flex>
            )}
          />
        </Radio.Group>
      </Field>
      <Field label={t.questions.requireWord}>
        <Flex gap={12} align="center">
          <Switch checked={requireWord} disabled={disabled} onChange={(v) => patch({ requireWord: v })} />
          {requireWord && (
            <Input
              value={(draft.answerKey.word as string) ?? ''}
              maxLength={40}
              disabled={disabled}
              placeholder={t.questions.word}
              onChange={(e) => patch(undefined, { word: e.target.value || undefined })}
              style={{ width: 160 }}
            />
          )}
        </Flex>
      </Field>
    </>
  );
}

/** 12. Hoàn thành câu chuyện: nhập cú pháp [[*a|b]] */
export function InlineChoiceEditor({ draft, patch, disabled }: EditorProps) {
  const text = (draft.config.text as string) ?? '';
  const blanks = (draft.config.blanks as { id: string; options: string[] }[] | undefined) ?? [];
  const picks = (draft.answerKey.picks as { blankId: string; option: string }[] | undefined) ?? [];
  const raw = composeInlineChoices(text, blanks, picks);
  const images = (draft.config.imageMediaIds as string[] | undefined) ?? [];
  const imageItems = images.map((mediaId, i) => ({ id: `i${i}`, mediaId }));
  const apply = (value: string) => {
    const parsed = parseInlineChoices(value);
    patch(
      { text: parsed.text, blanks: parsed.blanks.map((b) => ({ id: b.id, options: b.options })) },
      {
        picks: parsed.blanks
          .filter((b) => b.correct !== null)
          .map((b) => ({ blankId: b.id, option: b.correct as string })),
      },
    );
  };
  const missing = parseInlineChoices(raw).blanks.filter((b) => b.correct === null);
  return (
    <>
      <Field label={t.questions.imageStrip}>
        <SortableRows
          items={imageItems}
          onChange={(items) => patch({ imageMediaIds: items.map((i) => i.mediaId) })}
          onAdd={() => ({ id: `i${Date.now()}`, mediaId: '' })}
          addLabel={t.questions.addImage}
          max={6}
          disabled={disabled}
          render={(it, _i, update) => (
            <MediaUpload
              kind="IMAGE"
              size={64}
              value={it.mediaId || undefined}
              onChange={(id) => update({ mediaId: id ?? '' })}
              disabled={disabled}
            />
          )}
        />
      </Field>
      <Field label={t.questions.storyText} required hint={t.questions.storyHint}>
        <Input.TextArea
          value={raw}
          rows={5}
          maxLength={1000}
          disabled={disabled}
          onChange={(e) => apply(e.target.value)}
        />
        {missing.length > 0 && (
          <Typography.Text type="warning" style={{ fontSize: 12 }}>
            {missing.map((b) => b.id).join(', ')}: {t.questions.correctOption} (*)
          </Typography.Text>
        )}
      </Field>
      <Button size="small" disabled={disabled} onClick={() => apply(raw)}>
        {t.common.refresh}
      </Button>
    </>
  );
}
