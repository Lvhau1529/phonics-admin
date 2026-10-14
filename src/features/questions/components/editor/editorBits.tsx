import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Select, Typography, theme } from 'antd';
import type { ReactNode } from 'react';
import { MediaUpload } from '@/features/media/components/MediaUpload';
import { DragHandle, SortableList } from '@/shared/ui/SortableList';
import { t } from '@/shared/i18n';

/** Nhãn + control (không qua antd Form vì nội dung type-specific nằm ngoài Form) */
export function Field({
  label,
  hint,
  children,
  required,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  required?: boolean;
}) {
  const { token } = theme.useToken();
  return (
    <Flex vertical gap={4} style={{ marginBottom: 12 }}>
      <Typography.Text>
        {required && <span style={{ color: token.colorError, marginRight: 4 }}>*</span>}
        {label}
      </Typography.Text>
      {children}
      {hint && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {hint}
        </Typography.Text>
      )}
    </Flex>
  );
}

export function ImageField({
  label,
  value,
  onChange,
  disabled,
  required,
}: {
  label?: ReactNode;
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <Field label={label ?? t.questions.image} hint={t.media.imageHint} required={required}>
      <MediaUpload kind="IMAGE" value={value} onChange={onChange} disabled={disabled} />
    </Field>
  );
}

export function AudioField({
  label,
  value,
  onChange,
  disabled,
}: {
  label?: ReactNode;
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
}) {
  return (
    <Field label={label ?? t.questions.audio} hint={t.media.audioHint}>
      <MediaUpload kind="AUDIO" value={value} onChange={onChange} disabled={disabled} />
    </Field>
  );
}

/** Nhập danh sách từ (Select tags) */
export function WordListInput({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string[];
  onChange: (words: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <Select
      mode="tags"
      value={value}
      onChange={(v) => onChange(v.map((w) => w.trim()).filter(Boolean))}
      tokenSeparators={[',', '\n']}
      disabled={disabled}
      placeholder={placeholder ?? t.questions.wordBankHint}
      style={{ width: '100%' }}
      open={false}
    />
  );
}

/** Danh sách hàng kéo-thả có nút thêm / xoá; `render(item, index)` tự vẽ nội dung hàng */
export function SortableRows<T extends { id: string }>({
  items,
  onChange,
  render,
  onAdd,
  addLabel,
  min = 0,
  max = 20,
  disabled,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
  onAdd: () => T;
  addLabel?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const { token } = theme.useToken();
  const move = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };
  return (
    <Flex vertical gap={8}>
      <SortableList items={items.map((i) => i.id)} onMove={move} disabled={disabled}>
        {(id, state, index) => {
          const item = items[index];
          if (!item || item.id !== id) return null;
          return (
            <Flex
              gap={8}
              align="flex-start"
              style={{
                padding: 8,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadius,
                background: token.colorBgContainer,
              }}
            >
              <DragHandle handleProps={state.handleProps} />
              <div style={{ flex: 1 }}>
                {render(item, index, (patch) =>
                  onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it))),
                )}
              </div>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={disabled || items.length <= min}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              />
            </Flex>
          );
        }}
      </SortableList>
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        disabled={disabled || items.length >= max}
        onClick={() => onChange([...items, onAdd()])}
      >
        {addLabel ?? t.common.add}
      </Button>
    </Flex>
  );
}

export const TextInput = Input;
