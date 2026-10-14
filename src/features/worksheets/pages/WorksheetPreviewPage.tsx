import { PrinterOutlined } from '@ant-design/icons';
import { Button, Card, Skeleton } from 'antd';
import { useParams } from 'react-router';
import { ROUTES } from '@/app/routes';
import { MediaMapProvider } from '@/features/media/MediaMapContext';
import { WorksheetStudentView } from '@/features/worksheets/components/WorksheetStudentView';
import { useWorksheet } from '@/features/worksheets/hooks';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';

/** Xem phiếu như học sinh + thử làm (chấm tại chỗ) */
export function WorksheetPreviewPage() {
  const { id = '' } = useParams<{ id: string }>();
  const worksheet = useWorksheet(id);
  if (worksheet.isLoading) return <Skeleton active />;
  if (worksheet.error || !worksheet.data)
    return <ErrorAlert error={worksheet.error} onRetry={() => void worksheet.refetch()} />;
  const ws = worksheet.data;
  return (
    <MediaMapProvider initial={ws.media}>
      <PageHeader
        title={ws.title}
        documentTitle={`${t.worksheets.preview}: ${ws.title}`}
        backTo={ROUTES.worksheetDetail(ws.id)}
        subtitle={ws.subtitle}
        extra={
          <Button
            icon={<PrinterOutlined />}
            onClick={() => window.open(ROUTES.worksheetPrint(ws.id), '_blank')}
          >
            {t.worksheets.print}
          </Button>
        }
      />
      <Card>
        <WorksheetStudentView sections={ws.sections} questions={ws.questions} mode="try" />
      </Card>
    </MediaMapProvider>
  );
}

export default WorksheetPreviewPage;
