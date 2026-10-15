import { CheckCircleOutlined, CopyOutlined, InboxOutlined } from '@ant-design/icons';
import { App, Button, Popconfirm, Skeleton, Tag } from 'antd';
import { QuestionType } from '@phonics/contracts';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAuth } from '@/features/auth/authStore';
import { MediaMapProvider } from '@/features/media/MediaMapContext';
import { QuestionEditorForm } from '@/features/questions/components/QuestionEditorForm';
import { QuestionsService } from '@/features/questions/api/questionsService';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';

/** /questions/new (tuỳ chọn ?type=) và /questions/:id */
export function QuestionEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const auth = useAuth();
  const navigate = useNavigate();
  const question = QuestionsService.useDetail(id);
  const publish = QuestionsService.usePublish();
  const archive = QuestionsService.useArchive();
  const duplicate = QuestionsService.useDuplicate();
  const initialType = QuestionType.safeParse(searchParams.get('type')).data;

  if (id && question.isLoading) return <Skeleton active />;
  if (id && (question.error || !question.data))
    return <ErrorAlert error={question.error} onRetry={() => void question.refetch()} />;
  const q = question.data;
  const editable = !q || q.canEditBy(auth.user?.id, auth.isAdmin);

  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      message.success(success);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  return (
    <MediaMapProvider key={q?.id ?? 'new'} initial={q?.media}>
      <PageHeader
        title={q ? t.questions.edit : t.questions.add}
        documentTitle={q ? `${t.questions.edit}: ${q.instruction}` : t.questions.add}
        backTo={ROUTES.questions}
        subtitle={
          q && (
            <>
              <Tag color={q.statusColor}>{t.contentStatus[q.status]}</Tag>
              <Tag>{t.visibility[q.visibility]}</Tag>
              {!editable && (
                <Tag color="warning">
                  {t.questions.owner}: {q.createdByName}
                </Tag>
              )}
            </>
          )
        }
        extra={
          q && (
            <>
              {editable && !q.isPublished && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={publish.isPending}
                  onClick={() => run(() => publish.mutateAsync(q.id), t.questions.published)}
                >
                  {t.questions.publish}
                </Button>
              )}
              <Button
                icon={<CopyOutlined />}
                loading={duplicate.isPending}
                onClick={() =>
                  run(async () => {
                    const copy = await duplicate.mutateAsync(q.id);
                    navigate(ROUTES.questionDetail(copy.id));
                  }, t.questions.duplicated)
                }
              >
                {t.questions.duplicate}
              </Button>
              {editable && !q.isArchived && (
                <Popconfirm
                  title={t.questions.confirmArchive}
                  onConfirm={() => run(() => archive.mutateAsync(q.id), t.questions.archived)}
                  okText={t.common.confirm}
                  cancelText={t.common.cancel}
                >
                  <Button danger icon={<InboxOutlined />}>
                    {t.questions.archive}
                  </Button>
                </Popconfirm>
              )}
            </>
          )
        }
      />
      <QuestionEditorForm
        key={q?.updatedAt ?? 'new'}
        question={q ?? undefined}
        initialType={initialType}
        readOnly={!editable}
        onSaved={(saved) => {
          message.success(q ? t.common.updated : t.common.created);
          if (!q) navigate(ROUTES.questionDetail(saved.id), { replace: true });
        }}
      />
    </MediaMapProvider>
  );
}

export default QuestionEditorPage;
