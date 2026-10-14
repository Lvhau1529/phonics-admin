import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Flex,
  Form,
  InputNumber,
  Modal,
  Row,
  Skeleton,
  Statistic,
  Switch,
  Tabs,
  Tag,
} from 'antd';
import { UpdateAssignmentBody } from '@phonics/contracts';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AssignmentActions } from '@/features/assignments/components/AssignmentActions';
import { AssignmentStatusTag } from '@/features/assignments/components/AssignmentStatusTag';
import {
  useAssignment,
  useAssignmentRanking,
  useAssignmentRoster,
  useUpdateAssignment,
} from '@/features/assignments/hooks';
import type { AssignmentDetailModel } from '@/features/assignments/models/AssignmentModel';
import { useAuth } from '@/features/auth/hooks';
import { SubmissionsTable } from '@/features/submissions/components/SubmissionsTable';
import { AssignmentRankingTable } from '@/features/worksheet-stats/components/AssignmentRankingTable';
import { QuestionAccuracyChart } from '@/features/worksheet-stats/components/QuestionAccuracyChart';
import { ScoreDistributionChart } from '@/features/worksheet-stats/components/ScoreDistributionChart';
import { WorksheetExportButton } from '@/features/worksheet-stats/components/WorksheetExportButton';
import { useAssignmentStats } from '@/features/worksheet-stats/hooks';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { formatDate, formatPercent, toIsoDate } from '@/shared/utils/format';
import { applyFieldErrors, applyServerErrors, diffValues, parseForm } from '@/shared/utils/zodForm';

type TabKey = 'submissions' | 'stats';

export function AssignmentDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as TabKey | null) ?? 'submissions';
  const assignment = useAssignment(id);
  const roster = useAssignmentRoster(id);
  const [editOpen, setEditOpen] = useState(false);
  const setTab = (key: string) => setSearchParams(new URLSearchParams({ tab: key }), { replace: true });

  if (assignment.isLoading) return <Skeleton active />;
  if (assignment.error || !assignment.data)
    return <ErrorAlert error={assignment.error} onRetry={() => void assignment.refetch()} />;
  const a = assignment.data;

  return (
    <>
      <PageHeader
        title={a.worksheetTitle}
        documentTitle={`${t.assignments.title}: ${a.worksheetTitle} · ${a.className}`}
        backTo={ROUTES.assignments}
        subtitle={
          <Flex gap={6} align="center" wrap>
            <AssignmentStatusTag status={a.status} />
            <Link to={ROUTES.classDetail(a.classId)}>{a.className}</Link>
            <Tag>{formatDate(a.scheduledFor)}</Tag>
            {a.hasManualItems && <Tag>{t.assignments.hasManual}</Tag>}
          </Flex>
        }
        extra={
          <>
            <Button icon={<EyeOutlined />} onClick={() => navigate(ROUTES.worksheetPreview(a.worksheetId))}>
              {t.worksheets.preview}
            </Button>
            {auth.can('worksheets.assign') && (
              <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
                {t.assignments.edit}
              </Button>
            )}
            <WorksheetExportButton assignmentId={a.id} />
            <AssignmentActions assignment={a} size="middle" onDeleted={() => navigate(ROUTES.assignments)} />
          </>
        }
      >
        <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }}>
          <Descriptions.Item label={t.assignments.availableFrom}>{a.windowText}</Descriptions.Item>
          <Descriptions.Item label={t.assignments.maxAttempts}>{a.maxAttempts}</Descriptions.Item>
          <Descriptions.Item label={t.assignments.allowLate}>
            {a.allowLate ? t.common.yes : t.common.no}
          </Descriptions.Item>
          <Descriptions.Item label={t.assignments.showAnswers}>
            {a.showAnswersAfterSubmit ? t.common.yes : t.common.no}
          </Descriptions.Item>
          <Descriptions.Item label={t.assignments.maxScore}>{a.maxScore}</Descriptions.Item>
          <Descriptions.Item label={t.assignments.assignedBy}>{a.assignedByName}</Descriptions.Item>
        </Descriptions>
      </PageHeader>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { title: t.assignments.students, value: a.counts.students },
          { title: t.assignments.submitted, value: a.counts.submitted },
          { title: t.assignments.graded, value: a.counts.graded },
          { title: t.assignments.missing, value: a.counts.missing },
          { title: t.assignments.pendingGrading, value: a.counts.pendingGrading },
          { title: t.assignments.avgPercent, value: a.avgPercentText },
        ].map((c) => (
          <Col key={c.title} xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic title={c.title} value={c.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        destroyOnHidden
        items={[
          {
            key: 'submissions',
            label: t.assignments.tabSubmissions,
            children: (
              <>
                <ErrorAlert error={roster.error} onRetry={() => void roster.refetch()} />
                <SubmissionsTable
                  assignmentId={a.id}
                  items={roster.data?.items}
                  loading={roster.isFetching}
                />
              </>
            ),
          },
          ...(auth.can('worksheets.viewStats')
            ? [
                {
                  key: 'stats',
                  label: t.assignments.tabStats,
                  children: <AssignmentStatsTab assignmentId={a.id} />,
                },
              ]
            : []),
        ]}
      />
      <EditAssignmentModal open={editOpen} assignment={a} onClose={() => setEditOpen(false)} />
    </>
  );
}

function AssignmentStatsTab({ assignmentId }: { assignmentId: string }) {
  const stats = useAssignmentStats(assignmentId);
  const ranking = useAssignmentRanking(assignmentId);
  const d = stats.data;
  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <ErrorAlert error={stats.error} onRetry={() => void stats.refetch()} />
        <ErrorAlert error={ranking.error} />
      </Col>
      <Col xs={24} xl={12}>
        <Card size="small" title={t.worksheetStats.distribution}>
          <ScoreDistributionChart data={d?.distribution} loading={stats.isFetching} />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card size="small" title={t.worksheetStats.perQuestion}>
          <QuestionAccuracyChart data={d?.items} loading={stats.isFetching} />
        </Card>
      </Col>
      <Col span={24}>
        <Card
          size="small"
          title={t.worksheetStats.ranking}
          extra={
            d?.avgPercent !== null &&
            d?.avgPercent !== undefined && (
              <Tag>{`${t.worksheetStats.avgPercent}: ${formatPercent(d.avgPercent)}`}</Tag>
            )
          }
        >
          <AssignmentRankingTable
            assignmentId={assignmentId}
            items={ranking.data?.items}
            loading={ranking.isFetching}
          />
        </Card>
      </Col>
    </Row>
  );
}

interface EditValues {
  scheduledFor: Dayjs;
  availableFrom?: Dayjs;
  dueAt?: Dayjs;
  allowLate: boolean;
  maxAttempts: number;
  showAnswersAfterSubmit: boolean;
}

/** Sửa lịch / cửa sổ / số lần của bài giao (PATCH, chỉ gửi trường đổi; xoá hạn → null) */
function EditAssignmentModal({
  open,
  assignment,
  onClose,
}: {
  open: boolean;
  assignment: AssignmentDetailModel;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<EditValues>();
  const update = useUpdateAssignment();
  const original = {
    scheduledFor: assignment.scheduledFor,
    availableFrom: assignment.availableFrom,
    dueAt: assignment.dueAt,
    allowLate: assignment.allowLate,
    maxAttempts: assignment.maxAttempts,
    showAnswersAfterSubmit: assignment.showAnswersAfterSubmit,
  };
  const handleFinish = async (v: EditValues) => {
    const next = {
      scheduledFor: toIsoDate(v.scheduledFor),
      availableFrom: v.availableFrom ? v.availableFrom.toISOString() : assignment.availableFrom,
      dueAt: v.dueAt ? v.dueAt.toISOString() : null,
      allowLate: v.allowLate,
      maxAttempts: v.maxAttempts,
      showAnswersAfterSubmit: v.showAnswersAfterSubmit,
    };
    const diff = diffValues(original, next);
    if (!Object.keys(diff).length) return void message.info(t.common.noChanges);
    const parsed = parseForm(UpdateAssignmentBody, diff);
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      await update.mutateAsync({ id: assignment.id, body: parsed.data });
      message.success(t.assignments.updated);
      onClose();
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t.assignments.edit}
      okText={t.common.save}
      cancelText={t.common.cancel}
      onOk={() => form.submit()}
      confirmLoading={update.isPending}
      destroyOnHidden
    >
      <Form<EditValues>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          scheduledFor: dayjs(assignment.scheduledFor),
          availableFrom: dayjs(assignment.availableFrom),
          dueAt: assignment.dueAt ? dayjs(assignment.dueAt) : undefined,
          allowLate: assignment.allowLate,
          maxAttempts: assignment.maxAttempts,
          showAnswersAfterSubmit: assignment.showAnswersAfterSubmit,
        }}
      >
        <Flex gap={12} wrap>
          <Form.Item
            name="scheduledFor"
            label={t.assignments.scheduledFor}
            rules={[{ required: true, message: t.common.requiredField }]}
          >
            <DatePicker format={t.format.date} />
          </Form.Item>
          <Form.Item name="availableFrom" label={t.assignments.availableFrom}>
            <DatePicker showTime format={t.format.dateTime} allowClear={false} />
          </Form.Item>
          <Form.Item name="dueAt" label={t.assignments.dueAt} extra={t.assignments.dueAtHint}>
            <DatePicker showTime format={t.format.dateTime} />
          </Form.Item>
        </Flex>
        <Flex gap={24} wrap>
          <Form.Item name="maxAttempts" label={t.assignments.maxAttempts}>
            <InputNumber min={1} max={10} precision={0} />
          </Form.Item>
          <Form.Item name="allowLate" label={t.assignments.allowLate} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="showAnswersAfterSubmit" label={t.assignments.showAnswers} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Flex>
      </Form>
    </Modal>
  );
}

export default AssignmentDetailPage;
