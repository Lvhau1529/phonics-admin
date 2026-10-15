import { FileExcelOutlined } from '@ant-design/icons';
import { App, Button, Tooltip, type ButtonProps } from 'antd';
import { useState } from 'react';
import { useAuth } from '@/features/auth/authStore';
import { WorksheetStatsService } from '@/features/worksheet-stats/api/worksheetStatsService';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { saveBlob } from '@/shared/utils/download';

interface WorksheetExportButtonProps extends Omit<ButtonProps, 'onClick' | 'loading' | 'icon'> {
  assignmentId: string;
}

/** Xuất kết quả bài giao (xlsx, quyền reports.export) */
export function WorksheetExportButton({ assignmentId, ...rest }: WorksheetExportButtonProps) {
  const { message } = App.useApp();
  const auth = useAuth();
  const allowed = auth.can('reports.export');
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const file = await WorksheetStatsService.assignmentResultsXlsx(assignmentId);
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
        icon={<FileExcelOutlined />}
        disabled={!allowed}
        loading={loading}
        onClick={handleClick}
        {...rest}
      >
        {t.assignments.exportResults}
      </Button>
    </Tooltip>
  );
}
