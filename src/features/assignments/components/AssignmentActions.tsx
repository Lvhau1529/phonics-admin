import { DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { App, Button, Popconfirm, Space, Tooltip } from 'antd';
import { AssignmentsService } from '@/features/assignments/api/assignmentsService';
import type { AssignmentModel } from '@/features/assignments/models/AssignmentModel';
import { useAuth } from '@/features/auth/authStore';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';

interface AssignmentActionsProps {
  assignment: AssignmentModel;
  /** Gọi sau khi xoá (vd quay về danh sách) */
  onDeleted?: () => void;
  size?: 'small' | 'middle';
}

/** Đóng / mở lại / xoá bài giao (quyền worksheets.assign) */
export function AssignmentActions({ assignment, onDeleted, size = 'small' }: AssignmentActionsProps) {
  const { message } = App.useApp();
  const auth = useAuth();
  const close = AssignmentsService.useClose();
  const reopen = AssignmentsService.useReopen();
  const remove = AssignmentsService.useRemove();
  if (!auth.can('worksheets.assign')) return null;

  const run = async (fn: () => Promise<unknown>, success: string, after?: () => void) => {
    try {
      await fn();
      message.success(success);
      after?.();
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  return (
    <Space size={0}>
      {assignment.isClosed ? (
        <Tooltip title={t.assignments.reopen}>
          <Button
            type="text"
            size={size}
            icon={<UnlockOutlined />}
            loading={reopen.isPending}
            onClick={() => run(() => reopen.mutateAsync(assignment.id), t.assignments.reopened)}
          />
        </Tooltip>
      ) : (
        <Popconfirm
          title={t.assignments.confirmClose}
          okText={t.common.confirm}
          cancelText={t.common.cancel}
          onConfirm={() => run(() => close.mutateAsync(assignment.id), t.assignments.closed)}
        >
          <Tooltip title={t.assignments.close}>
            <Button type="text" size={size} icon={<LockOutlined />} loading={close.isPending} />
          </Tooltip>
        </Popconfirm>
      )}
      <Popconfirm
        title={t.assignments.confirmDelete}
        okText={t.common.confirm}
        cancelText={t.common.cancel}
        onConfirm={() => run(() => remove.mutateAsync(assignment.id), t.assignments.deleted, onDeleted)}
      >
        <Tooltip title={t.assignments.delete}>
          <Button type="text" size={size} danger icon={<DeleteOutlined />} loading={remove.isPending} />
        </Tooltip>
      </Popconfirm>
    </Space>
  );
}
