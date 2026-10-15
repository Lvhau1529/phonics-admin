import {
  CheckCircleOutlined,
  CopyOutlined,
  EyeOutlined,
  InboxOutlined,
  PrinterOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Drawer, Flex, Modal, Popconfirm, Skeleton, Statistic, Tag } from 'antd';
import { useEffect, useReducer, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AssignWorksheetModal } from '@/features/assignments/components/AssignWorksheetModal';
import { useAuth } from '@/features/auth/authStore';
import { MediaMapProvider } from '@/features/media/MediaMapContext';
import { QuestionEditorForm } from '@/features/questions/components/QuestionEditorForm';
import { QuestionPickerDrawer } from '@/features/questions/components/QuestionPickerDrawer';
import { QuestionSummaryModel } from '@/features/questions/models/QuestionModel';
import { WorksheetMetaForm } from '@/features/worksheets/components/WorksheetMetaForm';
import { WorksheetSectionsEditor } from '@/features/worksheets/components/WorksheetSectionsEditor';
import { WorksheetStatusTag } from '@/features/worksheets/components/WorksheetStatusTag';
import {
  composerReducer,
  sectionsFromDetail,
  toStructureBody,
  totalPoints,
} from '@/features/worksheets/composerReducer';
import { WorksheetsService } from '@/features/worksheets/api/worksheetsService';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';

/** /worksheets/new (chỉ form thông tin → tạo xong chuyển sang /worksheets/:id) và /worksheets/:id (composer) */
export function WorksheetComposerPage() {
  const { id } = useParams<{ id: string }>();
  const { message } = App.useApp();
  const auth = useAuth();
  const navigate = useNavigate();
  const worksheet = WorksheetsService.useDetail(id);
  const setStructure = WorksheetsService.useSetStructure();
  const publish = WorksheetsService.usePublish();
  const archive = WorksheetsService.useArchive();
  const duplicate = WorksheetsService.useDuplicate();
  const [state, dispatch] = useReducer(composerReducer, { sections: [], dirty: false });
  const [picker, setPicker] = useState<string | null>(null);
  const [inline, setInline] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const ws = worksheet.data;
  const editable = !ws || ws.canEditBy(auth.user?.id, auth.isAdmin);

  // Nạp lại bản nháp khi phiếu đổi từ server (không nạp đè khi đang sửa dở)
  useEffect(() => {
    if (!ws || state.dirty) return;
    dispatch({
      type: 'reset',
      sections: sectionsFromDetail(ws.sections, (q) => new QuestionSummaryModel(q)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.updatedAt]);

  const blocker = useBlocker(state.dirty);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    Modal.confirm({
      title: t.worksheets.unsavedChanges,
      okText: t.common.confirm,
      cancelText: t.common.cancel,
      onOk: () => blocker.proceed(),
      onCancel: () => blocker.reset(),
    });
  }, [blocker]);

  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      message.success(success);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  if (!id) {
    return (
      <>
        <PageHeader title={t.worksheets.add} backTo={ROUTES.worksheets} subtitle={t.worksheets.emptyNew} />
        <Card>
          <WorksheetMetaForm
            onSaved={(created) => navigate(ROUTES.worksheetDetail(created.id), { replace: true })}
          />
        </Card>
      </>
    );
  }
  if (worksheet.isLoading) return <Skeleton active />;
  if (worksheet.error || !ws)
    return <ErrorAlert error={worksheet.error} onRetry={() => void worksheet.refetch()} />;

  const save = () =>
    run(async () => {
      await setStructure.mutateAsync({ id: ws.id, body: toStructureBody(state.sections) });
      dispatch({ type: 'reset', sections: state.sections });
    }, t.worksheets.structureSaved);

  return (
    <MediaMapProvider key={ws.id} initial={ws.media}>
      <PageHeader
        title={ws.title}
        documentTitle={`${t.worksheets.title}: ${ws.title}`}
        backTo={ROUTES.worksheets}
        subtitle={
          <Flex gap={6} align="center" wrap>
            <WorksheetStatusTag status={ws.status} />
            <Tag>{ws.subtitle}</Tag>
            <Statistic
              title={t.worksheets.totalPoints}
              value={totalPoints(state.sections)}
              valueStyle={{ fontSize: 16 }}
            />
            {state.dirty && <Tag color="warning">{t.worksheets.unsavedChanges.split('.')[0]}</Tag>}
          </Flex>
        }
        extra={
          <>
            {editable && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                disabled={!state.dirty}
                loading={setStructure.isPending}
                onClick={save}
              >
                {t.worksheets.saveStructure}
              </Button>
            )}
            <Button icon={<EyeOutlined />} onClick={() => navigate(ROUTES.worksheetPreview(ws.id))}>
              {t.worksheets.preview}
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => window.open(ROUTES.worksheetPrint(ws.id), '_blank')}
            >
              {t.worksheets.print}
            </Button>
            {editable && !ws.isPublished && (
              <Popconfirm
                title={t.worksheets.confirmPublish}
                onConfirm={() => run(() => publish.mutateAsync(ws.id), t.worksheets.published)}
                okText={t.common.confirm}
                cancelText={t.common.cancel}
              >
                <Button icon={<CheckCircleOutlined />} disabled={state.dirty}>
                  {t.worksheets.publish}
                </Button>
              </Popconfirm>
            )}
            {ws.isPublished && auth.can('worksheets.assign') && (
              <Button type="primary" icon={<SendOutlined />} onClick={() => setAssignOpen(true)}>
                {t.worksheets.assign}
              </Button>
            )}
            <Button
              icon={<CopyOutlined />}
              onClick={() =>
                run(async () => {
                  const copy = await duplicate.mutateAsync(ws.id);
                  navigate(ROUTES.worksheetDetail(copy.id));
                }, t.worksheets.duplicated)
              }
            >
              {t.worksheets.duplicate}
            </Button>
            {editable && !ws.isArchived && (
              <Popconfirm
                title={t.worksheets.confirmArchive}
                onConfirm={() => run(() => archive.mutateAsync(ws.id), t.worksheets.archived)}
                okText={t.common.confirm}
                cancelText={t.common.cancel}
              >
                <Button danger icon={<InboxOutlined />}>
                  {t.worksheets.archive}
                </Button>
              </Popconfirm>
            )}
          </>
        }
      />
      <Card size="small" title={t.worksheets.edit} style={{ marginBottom: 16 }}>
        <WorksheetMetaForm key={ws.updatedAt} worksheet={ws} readOnly={!editable} onSaved={() => undefined} />
      </Card>
      <Card size="small" title={t.worksheets.sections}>
        <WorksheetSectionsEditor
          sections={state.sections}
          dispatch={dispatch}
          onAddFromBank={setPicker}
          onCreateInline={setInline}
          readOnly={!editable}
        />
      </Card>

      <QuestionPickerDrawer
        open={picker !== null}
        onClose={() => setPicker(null)}
        excludeIds={state.sections.flatMap((s) => s.items.map((it) => it.question.id))}
        onAdd={(questions) => picker && dispatch({ type: 'addItems', sectionKey: picker, questions })}
      />
      <Drawer
        open={inline !== null}
        onClose={() => setInline(null)}
        width={720}
        title={t.questions.add}
        destroyOnHidden
      >
        <QuestionEditorForm
          compact
          onSaved={(q) => {
            if (inline) dispatch({ type: 'addItems', sectionKey: inline, questions: [q] });
            setInline(null);
          }}
        />
      </Drawer>
      <AssignWorksheetModal
        open={assignOpen}
        worksheetId={ws.id}
        worksheetTitle={ws.title}
        onClose={() => setAssignOpen(false)}
      />
    </MediaMapProvider>
  );
}

export default WorksheetComposerPage;
