import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { App, Button, Tooltip, type ButtonProps } from 'antd';
import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks';
import { reportsApi } from '@/features/reports/api';
import type { QueryParams } from '@/shared/api/client';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n/vi';
import { saveBlob } from '@/shared/utils/download';

export type ReportKind = 'ranking-xlsx' | 'ranking-pdf' | 'points-xlsx';

interface ExportButtonProps extends Omit<ButtonProps, 'onClick' | 'loading' | 'icon'> {
  kind: ReportKind;
  classId: string | undefined;
  /** range / from / to / gameId */
  query: QueryParams;
}

const LABELS: Record<ReportKind, string> = {
  'ranking-xlsx': t.reports.rankingXlsx,
  'ranking-pdf': t.reports.rankingPdf,
  'points-xlsx': t.reports.pointsXlsx,
};

/** Nút xuất báo cáo (quyền reports.export): tải blob rồi lưu với tên từ Content-Disposition */
export function ExportButton({ kind, classId, query, ...rest }: ExportButtonProps) {
  const { message } = App.useApp();
  const auth = useAuth();
  const allowed = auth.can('reports.export');
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const file =
        kind === 'points-xlsx'
          ? await reportsApi.classPoints(classId, query)
          : await reportsApi.classRanking(classId, kind === 'ranking-pdf' ? 'pdf' : 'xlsx', query);
      saveBlob(file.blob, file.filename);
      message.success(t.reports.downloaded);
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={allowed ? undefined : t.reports.needExportPermission}>
      <Button
        icon={kind === 'ranking-pdf' ? <FilePdfOutlined /> : <FileExcelOutlined />}
        disabled={!allowed || !classId}
        loading={loading}
        onClick={handleClick}
        {...rest}
      >
        {LABELS[kind]}
      </Button>
    </Tooltip>
  );
}
