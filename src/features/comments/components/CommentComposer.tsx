import { SendOutlined } from '@ant-design/icons';
import { Button, Flex, Input } from 'antd';
import { useState } from 'react';
import { t } from '@/shared/i18n';

interface CommentComposerProps {
  placeholder?: string;
  initial?: string;
  loading?: boolean;
  autoFocus?: boolean;
  onSubmit: (body: string) => Promise<void> | void;
  onCancel?: () => void;
}

const MAX = 1000;

/** Ô nhập nhận xét: Ctrl+Enter gửi */
export function CommentComposer({
  placeholder,
  initial = '',
  loading,
  autoFocus,
  onSubmit,
  onCancel,
}: CommentComposerProps) {
  const [value, setValue] = useState(initial);
  const body = value.trim();
  const submit = async () => {
    if (!body) return;
    await onSubmit(body);
    setValue('');
  };
  return (
    <Flex vertical gap={6}>
      <Input.TextArea
        value={value}
        autoFocus={autoFocus}
        maxLength={MAX}
        showCount
        autoSize={{ minRows: 2, maxRows: 5 }}
        placeholder={placeholder ?? t.comments.placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            void submit();
          }
        }}
      />
      <Flex gap={8} justify="flex-end">
        {onCancel && (
          <Button size="small" onClick={onCancel}>
            {t.common.cancel}
          </Button>
        )}
        <Button
          size="small"
          type="primary"
          icon={<SendOutlined />}
          disabled={!body}
          loading={loading}
          onClick={submit}
        >
          {t.comments.send}
        </Button>
      </Flex>
    </Flex>
  );
}
