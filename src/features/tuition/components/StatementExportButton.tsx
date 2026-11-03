import { FilePdfOutlined } from '@ant-design/icons';
import { App, Button, DatePicker, Space, Tooltip } from 'antd';
import { useState } from 'react';
import { useAuth } from '@/features/auth/authStore';
import { TuitionService } from '@/features/tuition/api/tuitionService';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { dayjs } from '@/shared/utils/dayjs';
import { saveBlob } from '@/shared/utils/download';

/**
 * Chọn tháng + tải phiếu báo học phí PDF (gộp các bé cùng phụ huynh nhận học phí). Cần quyền xuất báo cáo; tab Học phí
 * đã chặn `extra.viewPricing`. Mặc định tháng trước (kỳ vừa kết thúc).
 */
export function StatementExportButton({ studentId }: { studentId: string }) {
  const { message } = App.useApp();
  const allowed = useAuth().can('reports.export');
  const [month, setMonth] = useState(() => dayjs().subtract(1, 'month'));
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const file = await TuitionService.statement(studentId, month.format('YYYY-MM'));
      saveBlob(file.blob, file.filename);
      message.success(t.reports.downloaded);
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space.Compact>
      <DatePicker
        picker="month"
        format={t.attendance.monthFormat}
        allowClear={false}
        aria-label={t.tuition.statementMonth}
        value={month}
        onChange={(value) => value && setMonth(value)}
        disabled={!allowed}
      />
      <Tooltip title={allowed ? t.tuition.statementHint : t.reports.needExportPermission}>
        <Button icon={<FilePdfOutlined />} loading={loading} disabled={!allowed} onClick={handleClick}>
          {t.tuition.statement}
        </Button>
      </Tooltip>
    </Space.Compact>
  );
}
