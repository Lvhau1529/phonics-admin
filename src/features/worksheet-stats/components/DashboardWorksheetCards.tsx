import { CalendarOutlined, EditOutlined, FileDoneOutlined } from '@ant-design/icons';
import { Card, Col, List, Row, Statistic, Tag, Typography, theme } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AssignmentStatusTag } from '@/features/assignments/components/AssignmentStatusTag';
import { useAssignmentsDashboard } from '@/features/assignments/hooks';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';

/** Thẻ phiếu bài tập trên Dashboard: bài đến hạn hôm nay, bài đang mở, bài chờ chấm */
export function DashboardWorksheetCards() {
  const { token } = theme.useToken();
  const dash = useAssignmentsDashboard();
  const d = dash.data;
  return (
    <Card
      style={{ marginTop: 16 }}
      title={t.assignments.title}
      extra={<Link to={ROUTES.assignments}>{t.assignments.calendar}</Link>}
    >
      <ErrorAlert error={dash.error} onRetry={() => void dash.refetch()} />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic
              title={t.assignments.openCount}
              value={d?.openCount ?? 0}
              prefix={<FileDoneOutlined />}
              loading={dash.isLoading}
            />
          </Card>
          <Card size="small" style={{ marginTop: 16 }}>
            <Statistic
              title={t.assignments.pendingGrading}
              value={d?.pendingGrading ?? 0}
              prefix={<EditOutlined />}
              loading={dash.isLoading}
              valueStyle={d?.pendingGrading ? { color: token.colorWarning } : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            <CalendarOutlined /> {t.assignments.dueToday}
          </Typography.Title>
          <List
            size="small"
            loading={dash.isLoading}
            dataSource={d?.dueToday ?? []}
            locale={{ emptyText: t.assignments.noAssignments }}
            renderItem={(a) => (
              <List.Item>
                <List.Item.Meta
                  title={<Link to={ROUTES.assignmentDetail(a.id)}>{a.worksheetTitle}</Link>}
                  description={`${a.className} · ${a.windowText}`}
                />
                <AssignmentStatusTag status={a.status} />
                <Tag style={{ marginLeft: 8 }}>
                  {t.assignments.submitted} {a.submittedRatioText}
                </Tag>
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </Card>
  );
}
