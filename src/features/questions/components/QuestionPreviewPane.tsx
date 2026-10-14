import { Alert, Button, Card, Flex, Segmented, Tag, Typography } from 'antd';
import {
  QuestionAnswerKey,
  QuestionConfig,
  type QuestionAnswer,
  type QuestionExample,
} from '@phonics/contracts';
import { useState } from 'react';
import type { QuestionDraft } from '@/features/questions/components/editor/types';
import { QuestionRenderer } from '@/features/questions/renderers/QuestionRenderer';
import { checkAnswer, type CheckResult } from '@/features/questions/utils/checkAnswer';
import { t } from '@/shared/i18n';
import { formatPercent } from '@/shared/utils/format';

interface QuestionPreviewPaneProps {
  draft: QuestionDraft;
  instruction?: string;
  example?: QuestionExample | null;
}

/** Xem trước như học sinh thấy + "Thử làm" (chấm tại chỗ bằng checkAnswer — chỉ để tham khảo) */
export function QuestionPreviewPane({ draft, instruction, example }: QuestionPreviewPaneProps) {
  const [mode, setMode] = useState<'preview' | 'try'>('preview');
  const [answer, setAnswer] = useState<QuestionAnswer | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const config = QuestionConfig.safeParse(draft.config);
  const key = QuestionAnswerKey.safeParse(draft.answerKey);
  const draftKey = JSON.stringify(draft);

  // Đổi nội dung → bỏ câu trả lời thử (reset ngay trong render theo khoá, không qua effect)
  const [seenKey, setSeenKey] = useState(draftKey);
  if (seenKey !== draftKey) {
    setSeenKey(draftKey);
    setAnswer(null);
    setResult(null);
  }

  if (!config.success) {
    const first = config.error.issues[0];
    return (
      <Card size="small" title={t.questions.preview}>
        <Alert
          type="warning"
          showIcon
          message={t.questions.contentErrors}
          description={first ? `${first.path.join('.')}: ${first.message}` : undefined}
        />
      </Card>
    );
  }

  const check = () => {
    if (!key.success) return;
    setResult(checkAnswer(config.data, key.data, answer));
  };

  return (
    <Card
      size="small"
      title={t.questions.preview}
      extra={
        <Segmented<'preview' | 'try'>
          size="small"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setResult(null);
          }}
          options={[
            { value: 'preview', label: t.questions.preview },
            { value: 'try', label: t.questions.tryIt },
          ]}
        />
      }
    >
      <Flex vertical gap={12}>
        <QuestionRenderer
          config={config.data}
          answerKey={result && key.success ? key.data : null}
          answer={answer}
          mode={result ? 'review' : mode}
          onChange={mode === 'try' && !result ? setAnswer : undefined}
          parts={result?.parts}
          instruction={instruction}
          example={example}
        />
        {mode === 'try' && draft.type !== 'SPEAK' && draft.type !== 'TRACE_AND_READ' && (
          <Flex gap={8} align="center">
            <Button type="primary" size="small" onClick={check} disabled={!key.success || !!result}>
              {t.questions.check}
            </Button>
            {result && (
              <Button size="small" onClick={() => setResult(null)}>
                {t.common.reset}
              </Button>
            )}
            {result && (
              <Tag color={result.correct ? 'success' : result.fraction > 0 ? 'warning' : 'error'}>
                {result.correct ? t.questions.correct : t.questions.incorrect} ·{' '}
                {formatPercent(result.fraction)}
              </Tag>
            )}
            {!key.success && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t.questions.contentErrors}
              </Typography.Text>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
