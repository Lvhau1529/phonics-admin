import { Card, Col, Row, Tag, Typography } from 'antd';
import { QUESTION_TYPES, gradingModeOf, type QuestionType } from '@phonics/contracts';
import { t } from '@/shared/i18n';

/** Lưới 14 thẻ chọn dạng câu hỏi (bước 1 khi tạo mới) */
export function QuestionTypePicker({ onPick }: { onPick: (type: QuestionType) => void }) {
  return (
    <Row gutter={[12, 12]}>
      {QUESTION_TYPES.map((type) => (
        <Col key={type} xs={24} sm={12} lg={8} xl={6}>
          <Card hoverable size="small" onClick={() => onPick(type)} style={{ height: '100%' }}>
            <Typography.Text strong>{t.questionType[type]}</Typography.Text>
            <div style={{ marginTop: 4 }}>
              {gradingModeOf(type) === 'MANUAL' ? (
                <Tag color="orange">{t.gradingMode.MANUAL}</Tag>
              ) : (
                <Tag color="green">{t.gradingMode.AUTO}</Tag>
              )}
            </div>
            <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 6, marginBottom: 0 }}>
              {t.questionTypeHint[type]}
            </Typography.Paragraph>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
