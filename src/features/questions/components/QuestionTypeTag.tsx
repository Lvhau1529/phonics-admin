import { Tag } from 'antd';
import type { GradingMode, QuestionType } from '@phonics/contracts';
import { gradingModeOf } from '@phonics/contracts';
import { t } from '@/shared/i18n';

/** Nhãn dạng câu hỏi (+ tag chấm tay nếu có) */
export function QuestionTypeTag({ type, showGrading = true }: { type: QuestionType; showGrading?: boolean }) {
  const mode: GradingMode = gradingModeOf(type);
  return (
    <>
      <Tag color="geekblue" style={{ marginInlineEnd: 4 }}>
        {t.questionType[type]}
      </Tag>
      {showGrading && mode === 'MANUAL' && <Tag color="orange">{t.gradingMode.MANUAL}</Tag>}
    </>
  );
}
