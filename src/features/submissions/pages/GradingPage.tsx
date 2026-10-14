import { CheckCircleOutlined, RollbackOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Affix,
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Flex,
  Popconfirm,
  Skeleton,
  Tag,
  Tooltip,
} from 'antd';
import { useEffect, useMemo, useReducer } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAssignmentRoster } from '@/features/assignments/hooks';
import { useAuth } from '@/features/auth/hooks';
import { CommentThread } from '@/features/comments/components/CommentThread';
import { useComments } from '@/features/comments/hooks';
import type { CommentModel } from '@/features/comments/models/CommentModel';
import { MediaMapProvider } from '@/features/media/MediaMapContext';
import { GradingItemCard } from '@/features/submissions/components/GradingItemCard';
import { StudentNav } from '@/features/submissions/components/StudentNav';
import {
  gradingReducer,
  initialGrading,
  isGradingDirty,
  pendingManualCount,
  toGradeBody,
} from '@/features/submissions/gradingReducer';
import { useGradeSubmission, useReopenSubmission, useSubmission } from '@/features/submissions/hooks';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { formatDateTime } from '@/shared/utils/format';

/** /assignments/:id/submissions/:submissionId — chấm một bài nộp */
export function GradingPage() {
  const { id = '', submissionId = '' } = useParams<{ id: string; submissionId: string }>();
  const { message } = App.useApp();
  const auth = useAuth();
  const navigate = useNavigate();
  const submission = useSubmission(submissionId);
  const roster = useAssignmentRoster(id);
  const comments = useComments(submissionId);
  const grade = useGradeSubmission();
  const reopen = useReopenSubmission();
  const [state, dispatch] = useReducer(gradingReducer, undefined, () => initialGrading());
  const s = submission.data;
  const canGrade = auth.can('worksheets.grade') && !!s && !s.isInProgress;

  // Nạp lại bản nháp khi bài nộp đổi (đổi học sinh / sau khi lưu)
  useEffect(() => {
    if (s) dispatch({ type: 'reset', submission: s });
  }, [s]);

  const byItem = useMemo(() => {
    const map = new Map<string | null, CommentModel[]>();
    for (const c of comments.data ?? []) {
      const list = map.get(c.worksheetItemId) ?? [];
      list.push(c);
      map.set(c.worksheetItemId, list);
    }
    return map;
  }, [comments.data]);

  if (submission.isLoading) return <Skeleton active />;
  if (submission.error || !s)
    return <ErrorAlert error={submission.error} onRetry={() => void submission.refetch()} />;

  const dirty = isGradingDirty(state);
  const pending = pendingManualCount(state, s);

  const save = async (finalize: boolean) => {
    try {
      await grade.mutateAsync({ id: s.id, body: toGradeBody(state, s, finalize) });
      message.success(finalize ? t.grading.finalized : t.grading.saved);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };
  const doReopen = async () => {
    try {
      await reopen.mutateAsync(s.id);
      message.success(t.grading.reopened);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  return (
    <MediaMapProvider key={s.id} initial={s.media}>
      <PageHeader
        title={`${t.grading.title}: ${s.studentName}`}
        documentTitle={`${t.grading.title}: ${s.studentName} · ${s.worksheet.title}`}
        backTo={ROUTES.assignmentDetail(id)}
        subtitle={s.worksheet.title}
        extra={
          <StudentNav
            roster={roster.data?.items}
            currentSubmissionId={s.id}
            onSelect={(sid) => navigate(ROUTES.grading(id, sid))}
          />
        }
      >
        <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }}>
          <Descriptions.Item label={t.grading.status}>
            <Flex gap={4}>
              <Tag color={s.statusColor}>{s.statusLabel}</Tag>
              {s.late && <Tag color="warning">{t.assignments.late}</Tag>}
            </Flex>
          </Descriptions.Item>
          <Descriptions.Item label={t.grading.attempt}>{s.attemptNo}</Descriptions.Item>
          <Descriptions.Item label={t.grading.submittedAt}>
            {s.submittedAt ? formatDateTime(s.submittedAt) : t.common.none}
          </Descriptions.Item>
          <Descriptions.Item label={t.grading.duration}>{s.durationText}</Descriptions.Item>
          <Descriptions.Item label={t.grading.autoScore}>{s.autoScore}</Descriptions.Item>
          <Descriptions.Item label={t.grading.manualScore}>
            {s.manualScore ?? t.common.none}
          </Descriptions.Item>
          <Descriptions.Item label={t.grading.totalScore}>
            {s.totalScore === null ? t.common.none : `${s.scoreText} (${s.percentText})`}
          </Descriptions.Item>
          <Descriptions.Item label={t.grading.manualScore}>
            {s.gradedByName ? `${s.gradedByName} · ${formatDateTime(s.gradedAt)}` : t.common.none}
          </Descriptions.Item>
        </Descriptions>
      </PageHeader>

      {s.isInProgress && (
        <Alert type="warning" showIcon message={t.grading.inProgress} style={{ marginBottom: 12 }} />
      )}
      {!auth.can('worksheets.grade') && (
        <Alert type="info" showIcon message={t.grading.needGradePermission} style={{ marginBottom: 12 }} />
      )}
      <ErrorAlert error={comments.error} />

      <Flex vertical gap={12}>
        {s.items.map(({ item, sectionTitle, answer }, i) => (
          <GradingItemCard
            key={item.worksheetItemId}
            index={i + 1}
            item={item}
            sectionTitle={sectionTitle}
            answer={answer}
            draft={state.drafts[item.worksheetItemId]}
            dispatch={dispatch}
            submissionId={s.id}
            comments={byItem.get(item.worksheetItemId) ?? []}
            canGrade={canGrade}
            canComment={auth.can('worksheets.grade')}
          />
        ))}
        <Card size="small" title={t.grading.general}>
          <CommentThread
            submissionId={s.id}
            worksheetItemId={null}
            comments={byItem.get(null) ?? []}
            canComment={auth.can('worksheets.grade')}
          />
        </Card>
      </Flex>

      {canGrade && (
        <Affix offsetBottom={0}>
          <Card size="small" style={{ marginTop: 12 }}>
            <Flex gap={8} align="center" justify="flex-end" wrap>
              {pending > 0 && <Tag color="processing">{t.grading.pendingManual(pending)}</Tag>}
              <Popconfirm
                title={t.grading.confirmReopen}
                okText={t.common.confirm}
                cancelText={t.common.cancel}
                onConfirm={doReopen}
              >
                <Button icon={<RollbackOutlined />} loading={reopen.isPending}>
                  {t.grading.reopen}
                </Button>
              </Popconfirm>
              <Button
                icon={<SaveOutlined />}
                disabled={!dirty}
                loading={grade.isPending}
                onClick={() => save(false)}
              >
                {t.grading.save}
              </Button>
              <Tooltip title={t.grading.finalizeHint}>
                <Popconfirm
                  title={t.grading.confirmFinalize}
                  okText={t.common.confirm}
                  cancelText={t.common.cancel}
                  onConfirm={() => save(true)}
                  disabled={pending > 0}
                >
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    disabled={pending > 0}
                    loading={grade.isPending}
                  >
                    {t.grading.finalize}
                  </Button>
                </Popconfirm>
              </Tooltip>
            </Flex>
          </Card>
        </Affix>
      )}
    </MediaMapProvider>
  );
}

export default GradingPage;
