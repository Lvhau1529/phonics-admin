import { MailOutlined } from '@ant-design/icons';
import { App, Button, Popconfirm, Tooltip, Typography } from 'antd';
import { AttendanceService } from '@/features/attendance/api/attendanceService';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';

interface ResendDigestButtonProps {
  /** Buổi chưa xác nhận cần gửi lại (rỗng → nút bị khoá kèm gợi ý chọn buổi) */
  sessionIds: string[];
  /** Hiện số buổi trên nút (trang danh sách) */
  showCount?: boolean;
  onSent?: () => void;
}

/** ADMIN: gửi lại mail xác nhận cho GV phụ trách các buổi chưa xác nhận (nơi gọi tự ẩn với GV) */
export function ResendDigestButton({ sessionIds, showCount, onSent }: ResendDigestButtonProps) {
  const { message, notification } = App.useApp();
  const resend = AttendanceService.useResendDigest();
  const label = showCount ? t.attendance.resendSelected(sessionIds.length) : t.attendance.resendDigest;

  const handleConfirm = async () => {
    try {
      const res = await resend.mutateAsync(sessionIds);
      const lines = [
        res.sent.length ? t.attendance.resendSent(res.sent.map((s) => s.teacherName).join(', ')) : null,
        res.noEmail.length
          ? t.attendance.resendNoEmail(res.noEmail.map((s) => s.teacherName).join(', '))
          : null,
        res.skipped.length ? t.attendance.resendSkipped(res.skipped.length) : null,
      ].filter((line): line is string => !!line);
      notification[res.sent.length ? 'success' : 'warning']({
        message: res.sent.length ? t.attendance.resendDigest : t.attendance.resendNothing,
        description: lines.map((line) => <div key={line}>{line}</div>),
      });
      onSent?.();
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  if (!sessionIds.length)
    return (
      <Tooltip title={t.attendance.resendSelectHint}>
        <Button icon={<MailOutlined />} disabled>
          {label}
        </Button>
      </Tooltip>
    );
  return (
    <Popconfirm
      title={t.attendance.resendConfirm}
      description={
        <Typography.Text type="secondary" style={{ display: 'block', maxWidth: 320 }}>
          {t.attendance.resendHint}
        </Typography.Text>
      }
      okText={t.common.confirm}
      cancelText={t.common.cancel}
      onConfirm={handleConfirm}
    >
      <Button icon={<MailOutlined />} loading={resend.isPending}>
        {label}
      </Button>
    </Popconfirm>
  );
}
