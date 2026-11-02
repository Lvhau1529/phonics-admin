import { App, Typography } from 'antd';
import type { AffectedRecord, AffectedSession } from '@phonics/contracts';
import {
  affectedDelta,
  sessionDateText,
  signedMoney,
} from '@/features/attendance/models/AttendanceSessionModel';
import { ExtraSlotsService } from '@/features/extra-slots/api/extraSlotsService';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';

/** Số dòng liệt kê trong hộp thoại; còn lại gom thành "và N buổi khác" */
const LIST_LIMIT = 8;

/**
 * Sau khi sửa lịch / đơn giá: buổi chưa xác nhận đã được server tự đồng bộ; buổi ĐÃ xác nhận bị lệch thì hỏi người
 * dùng có áp luôn không (POST .../apply với đúng danh sách server trả về).
 */
export function useAffectedPrompt() {
  const { modal, message } = App.useApp();
  const applyAssignments = ExtraSlotsService.useApplyAssignments();
  const applyRate = ExtraSlotsService.useApplyRate();

  const run = async (action: () => Promise<{ updated: string[] }>) => {
    try {
      const res = await action();
      message.success(t.attendance.appliedCount(res.updated.length));
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  return {
    /** Lịch học sinh đổi → các buổi đã xác nhận cần thêm / bỏ học sinh */
    sessions(studentId: string, affected: readonly AffectedSession[]) {
      if (!affected.length) return;
      const rest = affected.length - LIST_LIMIT;
      modal.confirm({
        title: t.attendance.affectedSessionsTitle(affected.length),
        content: (
          <>
            <Typography.Paragraph type="secondary">{t.attendance.affectedSessionsHint}</Typography.Paragraph>
            <ul style={{ paddingInlineStart: 20, margin: 0 }}>
              {affected.slice(0, LIST_LIMIT).map((s) => (
                <li key={s.sessionId}>
                  {sessionDateText(s.date)} · {s.slotName ?? t.attendance.makeUp} ·{' '}
                  {t.attendance.affectedChange[s.change]}
                </li>
              ))}
            </ul>
            {rest > 0 && <Typography.Text type="secondary">{t.attendance.andMore(rest)}</Typography.Text>}
          </>
        ),
        okText: t.attendance.applyToSessions,
        cancelText: t.attendance.skipApply,
        onOk: () =>
          run(() =>
            applyAssignments.mutateAsync({ studentId, sessionIds: affected.map((s) => s.sessionId) }),
          ),
      });
    },

    /** Giá mới khác đơn giá đã chốt ở các buổi đã xác nhận → tính lại? */
    records(rateId: string, affected: readonly AffectedRecord[]) {
      if (!affected.length) return;
      const sessionIds = [...new Set(affected.map((r) => r.sessionId))];
      modal.confirm({
        title: t.attendance.affectedRecordsTitle(affected.length),
        content: (
          <>
            <Typography.Paragraph type="secondary">{t.attendance.affectedRecordsHint}</Typography.Paragraph>
            <Typography.Text strong>
              {t.attendance.totalDelta}: {signedMoney(affectedDelta(affected))}
            </Typography.Text>
          </>
        ),
        okText: t.attendance.applyToSessions,
        cancelText: t.attendance.skipApply,
        onOk: () => run(() => applyRate.mutateAsync({ rateId, sessionIds })),
      });
    },
  };
}
