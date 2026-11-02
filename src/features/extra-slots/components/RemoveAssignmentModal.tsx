import { App } from 'antd';
import { ExtraSlotsService } from '@/features/extra-slots/api/extraSlotsService';
import { useAffectedPrompt } from '@/features/extra-slots/components/useAffectedPrompt';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { TypedConfirmModal } from '@/shared/ui/TypedConfirmModal';

/** Dòng lịch cần xoá — dùng chung cho tab học sinh (theo ca) và trang ca (theo học sinh) */
export interface RemoveAssignmentTarget {
  studentId: string;
  assignmentId: string;
  studentName: string;
  slotName: string;
  rangeText: string;
}

/** Xoá hẳn học sinh khỏi ca (thêm nhầm): phải gõ cụm xác nhận; sau đó hỏi áp vào buổi đã xác nhận nếu có */
export function RemoveAssignmentModal({
  target,
  onClose,
}: {
  target: RemoveAssignmentTarget | undefined;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const remove = ExtraSlotsService.useDeleteAssignment();
  const prompt = useAffectedPrompt();

  const handleOk = async () => {
    if (!target) return;
    try {
      const res = await remove.mutateAsync(target);
      message.success(t.studentExtra.removed);
      onClose();
      prompt.sessions(target.studentId, res.affectedSessions);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  return (
    <TypedConfirmModal
      open={!!target}
      title={target ? `${t.studentExtra.remove} · ${target.slotName}` : undefined}
      warning={target && t.studentExtra.removeWarning(target.studentName, target.slotName, target.rangeText)}
      phrase={t.studentExtra.removeConfirmWord}
      okText={t.common.delete}
      danger
      loading={remove.isPending}
      onOk={() => void handleOk()}
      onCancel={onClose}
    />
  );
}
