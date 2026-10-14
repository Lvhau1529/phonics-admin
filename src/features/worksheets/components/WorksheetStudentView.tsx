import { Button, Card, Divider, Flex, Tag, Typography, theme } from 'antd';
import type { QuestionAnswer, QuestionView, WorksheetSectionView } from '@phonics/contracts';
import { useState } from 'react';
import { QuestionRenderer } from '@/features/questions/renderers/QuestionRenderer';
import type { RendererMode } from '@/features/questions/renderers/common';
import { checkAnswer, type CheckResult } from '@/features/questions/utils/checkAnswer';
import { t } from '@/shared/i18n';

interface WorksheetStudentViewProps {
  sections: WorksheetSectionView[];
  questions: Record<string, QuestionView>;
  /** preview: tĩnh; try: làm thử + "Kiểm tra tất cả"; print: tĩnh, gọn, không màu */
  mode: 'preview' | 'try' | 'print';
  showAnswers?: boolean;
}

/** Phiếu như học sinh thấy: Part → câu, dùng chung cho xem trước / thử làm / in */
export function WorksheetStudentView({ sections, questions, mode, showAnswers }: WorksheetStudentViewProps) {
  const { token } = theme.useToken();
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [results, setResults] = useState<Record<string, CheckResult> | null>(null);
  const items = sections.flatMap((s) => s.items);

  const checkAll = () => {
    const out: Record<string, CheckResult> = {};
    for (const it of items) {
      const q = questions[it.questionId];
      if (q) out[it.id] = checkAnswer(q.config, q.answerKey, answers[it.id] ?? null);
    }
    setResults(out);
  };
  const correct = results ? Object.values(results).filter((r) => r.correct).length : 0;
  // Số thứ tự câu liên tục qua các Part (tính trước khi render)
  const numberOf = new Map<string, number>();
  items.forEach((it, i) => numberOf.set(it.id, i + 1));

  return (
    <Flex vertical gap={16}>
      {sections.map((s, si) => (
        <div key={s.id}>
          <Typography.Title level={5} style={{ marginBottom: 4 }}>
            {s.title || t.worksheets.section(si + 1)}
            {s.instruction && (
              <Typography.Text style={{ marginLeft: 8, fontWeight: 400 }}>{s.instruction}</Typography.Text>
            )}
          </Typography.Title>
          <Flex vertical gap={12}>
            {s.items.map((it) => {
              const q = questions[it.questionId];
              if (!q) return null;
              const result = results?.[it.id];
              const rendererMode: RendererMode = result ? 'review' : mode === 'try' ? 'try' : 'preview';
              return (
                <Card
                  key={it.id}
                  size="small"
                  style={
                    mode === 'print'
                      ? { breakInside: 'avoid', border: `1px solid ${token.colorBorder}` }
                      : undefined
                  }
                >
                  <Flex gap={8} align="baseline" style={{ marginBottom: 8 }}>
                    <Typography.Text strong>{numberOf.get(it.id)}.</Typography.Text>
                    <Tag>
                      {it.points} {t.questions.points.toLowerCase()}
                    </Tag>
                    {result && (
                      <Tag color={result.correct ? 'success' : result.fraction > 0 ? 'warning' : 'error'}>
                        {result.correct ? t.questions.correct : t.questions.incorrect}
                      </Tag>
                    )}
                  </Flex>
                  <QuestionRenderer
                    config={q.config}
                    answerKey={showAnswers || result ? q.answerKey : null}
                    answer={answers[it.id] ?? null}
                    mode={showAnswers && mode === 'print' ? 'review' : rendererMode}
                    onChange={
                      mode === 'try' && !result
                        ? (a) => setAnswers((prev) => ({ ...prev, [it.id]: a }))
                        : undefined
                    }
                    parts={result?.parts}
                    instruction={q.instruction}
                    example={q.example}
                  />
                  {showAnswers && mode === 'print' && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {t.grading.expected}: {JSON.stringify(q.answerKey)}
                    </Typography.Text>
                  )}
                </Card>
              );
            })}
          </Flex>
          {si < sections.length - 1 && <Divider style={{ margin: '12px 0' }} />}
        </div>
      ))}
      {mode === 'try' && items.length > 0 && (
        <Flex gap={8} align="center">
          <Button type="primary" onClick={checkAll}>
            {t.worksheets.checkAll}
          </Button>
          {results && (
            <>
              <Tag color="blue">{t.worksheets.score(correct, items.length)}</Tag>
              <Button onClick={() => setResults(null)}>{t.common.reset}</Button>
            </>
          )}
        </Flex>
      )}
    </Flex>
  );
}
