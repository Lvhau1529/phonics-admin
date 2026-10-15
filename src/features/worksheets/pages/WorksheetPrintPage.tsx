import { PrinterOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Flex, Skeleton, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { MediaMapProvider } from '@/features/media/MediaMapContext';
import { WorksheetStudentView } from '@/features/worksheets/components/WorksheetStudentView';
import { WorksheetsService } from '@/features/worksheets/api/worksheetsService';
import { t } from '@/shared/i18n';
import { buildTheme } from '@/shared/theme/theme';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';

/**
 * Trang in phiếu (ngoài AppShell, theme sáng cố định, `?answers=1` in kèm đáp án). Không có file CSS: nút in ẩn bằng
 * sự kiện beforeprint / afterprint thay vì @media print.
 */
export function WorksheetPrintPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const worksheet = WorksheetsService.useDetail(id);
  const [printing, setPrinting] = useState(false);
  const showAnswers = searchParams.get('answers') === '1';

  useEffect(() => {
    const on = () => setPrinting(true);
    const off = () => setPrinting(false);
    window.addEventListener('beforeprint', on);
    window.addEventListener('afterprint', off);
    return () => {
      window.removeEventListener('beforeprint', on);
      window.removeEventListener('afterprint', off);
    };
  }, []);

  const ws = worksheet.data;
  useEffect(() => {
    if (ws) document.title = t.app.title(ws.title);
  }, [ws]);

  return (
    <ConfigProvider theme={buildTheme('light')}>
      <div
        style={{
          background: '#fff',
          color: '#000',
          minHeight: '100vh',
          padding: 24,
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        {worksheet.isLoading && <Skeleton active />}
        {(worksheet.error || (!worksheet.isLoading && !ws)) && <ErrorAlert error={worksheet.error} />}
        {ws && (
          <MediaMapProvider initial={ws.media}>
            {!printing && (
              <Flex justify="flex-end" gap={8} style={{ marginBottom: 12 }}>
                <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
                  {t.worksheets.print}
                </Button>
              </Flex>
            )}
            <Flex
              justify="space-between"
              align="flex-start"
              style={{ borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 16 }}
            >
              <div>
                <Typography.Title level={3} style={{ margin: 0 }}>
                  {ws.title}
                </Typography.Title>
                <Typography.Text>
                  {ws.subjectLabel} · {ws.subtitle}
                </Typography.Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{t.worksheets.studentName}: ______________________</div>
                <div>{t.worksheets.studentClass}: __________</div>
                <div>{t.worksheets.date}: __________</div>
              </div>
            </Flex>
            <WorksheetStudentView
              sections={ws.sections}
              questions={ws.questions}
              mode="print"
              showAnswers={showAnswers}
            />
          </MediaMapProvider>
        )}
      </div>
    </ConfigProvider>
  );
}

export default WorksheetPrintPage;
