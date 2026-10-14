import { Card, Collapse, Flex, Input, InputNumber, Tag, Typography, theme } from 'antd';
import type { SnapshotItem } from '@phonics/contracts';
import { CommentThread } from '@/features/comments/components/CommentThread';
import type { CommentModel } from '@/features/comments/models/CommentModel';
import { QuestionTypeTag } from '@/features/questions/components/QuestionTypeTag';
import { QuestionRenderer } from '@/features/questions/renderers/QuestionRenderer';
import { MediaAudio, MediaImage } from '@/features/questions/renderers/common';
import { checkAnswer } from '@/features/questions/utils/checkAnswer';
import type { GradeDraft, GradingAction } from '@/features/submissions/gradingReducer';
import type { SubmissionItemModel } from '@/features/submissions/models/SubmissionModel';
import { t } from '@/shared/i18n';

interface GradingItemCardProps {
  index: number;
  item: SnapshotItem;
  sectionTitle: string;
  answer: SubmissionItemModel | undefined;
  draft: GradeDraft | undefined;
  dispatch: (a: GradingAction) => void;
  submissionId: string;
  comments: CommentModel[];
  canGrade: boolean;
  canComment: boolean;
}

/** Một câu trong bảng chấm: renderer review + điểm tay (MANUAL) / ghi đè + nhận xét + thread theo câu */
export function GradingItemCard({
  index,
  item,
  sectionTitle,
  answer,
  draft,
  dispatch,
  submissionId,
  comments,
  canGrade,
  canComment,
}: GradingItemCardProps) {
  const { token } = theme.useToken();
  const q = item.question;
  const isManual = q.gradingMode === 'MANUAL';
  // Tô màu từng phần: dùng bộ luật chấm của admin (cùng kết quả với server) thay vì đọc gradeDetail dạng lồng
  const parts =
    !isManual && answer?.answer ? checkAnswer(q.config, q.answerKey, answer.answer).parts : undefined;
  const score = draft?.manualScore ?? answer?.effectiveScore ?? null;
  const borderColor = !answer?.answer
    ? token.colorBorder
    : answer.needsManual && draft?.manualScore === null
      ? token.colorInfoBorder
      : answer.isCorrect || score === item.points
        ? token.colorSuccessBorder
        : (score ?? 0) > 0
          ? token.colorWarningBorder
          : token.colorErrorBorder;

  return (
    <Card
      id={`item-${item.worksheetItemId}`}
      size="small"
      style={{ borderLeft: `4px solid ${borderColor}` }}
      title={
        <Flex gap={8} align="center" wrap>
          <Typography.Text strong>
            {index}. {q.instruction}
          </Typography.Text>
          <QuestionTypeTag type={q.type} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {sectionTitle}
          </Typography.Text>
        </Flex>
      }
      extra={
        <Flex gap={8} align="center">
          {answer && answer.answer && (
            <Tag
              color={
                draft?.manualScore !== null && draft?.manualScore !== undefined && answer.needsManual
                  ? 'success'
                  : answer.resultColor
              }
            >
              {answer.needsManual && draft?.manualScore !== null && draft?.manualScore !== undefined
                ? t.grading.manualScore
                : answer.resultLabel}
            </Tag>
          )}
          {!answer?.answer && <Tag>{t.grading.noAnswer}</Tag>}
          <InputNumber
            size="small"
            min={0}
            max={item.points}
            step={0.25}
            value={score}
            disabled={!canGrade}
            onChange={(v) =>
              dispatch({ type: 'setScore', worksheetItemId: item.worksheetItemId, manualScore: v ?? null })
            }
            style={{ width: 90 }}
            suffix={`/ ${item.points}`}
          />
        </Flex>
      }
    >
      <Flex vertical gap={12}>
        {q.instructionVi && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {q.instructionVi}
          </Typography.Text>
        )}
        {isManual ? (
          <Flex gap={16} wrap align="flex-start">
            <QuestionRenderer config={q.config} answerKey={q.answerKey} mode="preview" example={q.example} />
            <Flex vertical gap={8} style={{ minWidth: 240 }}>
              <Typography.Text strong>{t.grading.studentAnswer}</Typography.Text>
              {answer?.traceMediaId && <MediaImage id={answer.traceMediaId} size={240} />}
              {answer?.recordingMediaId && <MediaAudio id={answer.recordingMediaId} speed />}
              {!answer?.traceMediaId && !answer?.recordingMediaId && (
                <Typography.Text type="secondary">{t.grading.noAnswer}</Typography.Text>
              )}
              {'rubric' in q.answerKey && q.answerKey.rubric && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t.questions.rubric}: {q.answerKey.rubric}
                </Typography.Text>
              )}
            </Flex>
          </Flex>
        ) : (
          <QuestionRenderer
            config={q.config}
            answerKey={q.answerKey}
            answer={answer?.answer ?? null}
            mode="review"
            parts={parts}
            example={q.example}
          />
        )}
        <Input.TextArea
          size="small"
          rows={1}
          maxLength={500}
          placeholder={t.grading.notePlaceholder}
          value={draft?.teacherNote ?? ''}
          disabled={!canGrade}
          onChange={(e) =>
            dispatch({ type: 'setNote', worksheetItemId: item.worksheetItemId, teacherNote: e.target.value })
          }
        />
        <Collapse
          size="small"
          ghost
          items={[
            {
              key: 'comments',
              label: `${t.grading.itemComments} (${comments.length})`,
              children: (
                <CommentThread
                  submissionId={submissionId}
                  worksheetItemId={item.worksheetItemId}
                  comments={comments}
                  canComment={canComment}
                  compact
                />
              ),
            },
          ]}
        />
      </Flex>
    </Card>
  );
}
