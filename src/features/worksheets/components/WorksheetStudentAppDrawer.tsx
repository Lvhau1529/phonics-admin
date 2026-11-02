import type { QuestionView } from '@phonics/contracts';
import { Alert, Drawer, Flex, Skeleton } from 'antd';
import { useMediaMap } from '@/features/media/mediaMap';
import { QuestionsService } from '@/features/questions/api/questionsService';
import { StudentAppPreview } from '@/features/questions/components/StudentAppPreview';
import type { StudentPreviewItem } from '@/features/questions/utils/studentPreview';
import type { DraftSection } from '@/features/worksheets/composerReducer';
import type { WorksheetModel } from '@/features/worksheets/models/WorksheetModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';

interface WorksheetStudentAppDrawerProps {
  open: boolean;
  onClose: () => void;
  worksheet: WorksheetModel;
  /** Cấu trúc đang sửa trong composer (kể cả chưa lưu) */
  sections: DraftSection[];
  dirty: boolean;
}

/** Phiếu trên app học sinh theo bản nháp của composer: câu chưa có trong phiếu đã lưu thì tải chi tiết */
export function WorksheetStudentAppDrawer({
  open,
  onClose,
  worksheet,
  sections,
  dirty,
}: WorksheetStudentAppDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} width={480} title={t.worksheets.studentAppTitle} destroyOnHidden>
      {open && <DrawerBody worksheet={worksheet} sections={sections} dirty={dirty} />}
    </Drawer>
  );
}

function DrawerBody({
  worksheet,
  sections,
  dirty,
}: Omit<WorksheetStudentAppDrawerProps, 'open' | 'onClose'>) {
  const { media } = useMediaMap();
  const drafts = sections.flatMap((s) => s.items);
  const missing = [...new Set(drafts.map((it) => it.question.id))].filter((id) => !worksheet.questions[id]);
  const fetched = QuestionsService.useDetails(missing);

  if (fetched.some((q) => q.isLoading)) return <Skeleton active />;
  const error = fetched.find((q) => q.error)?.error;

  const questions: Record<string, Pick<QuestionView, 'instruction' | 'example' | 'config' | 'answerKey'>> = {
    ...worksheet.questions,
  };
  let allMedia = { ...worksheet.media, ...media };
  for (const q of fetched) {
    if (!q.data) continue;
    questions[q.data.id] = q.data;
    allMedia = { ...allMedia, ...q.data.media };
  }
  const items: StudentPreviewItem[] = drafts.flatMap((it) => {
    const q = questions[it.question.id];
    if (!q) return [];
    return [
      {
        key: it.key,
        instruction: q.instruction,
        example: q.example,
        config: q.config,
        answerKey: q.answerKey,
      },
    ];
  });

  return (
    <Flex vertical gap={12}>
      {dirty && <Alert type="info" showIcon message={t.worksheets.studentAppUnsaved} />}
      {error != null && <Alert type="warning" showIcon message={errorMessage(error)} />}
      <StudentAppPreview title={worksheet.title} items={items} media={allMedia} />
    </Flex>
  );
}
