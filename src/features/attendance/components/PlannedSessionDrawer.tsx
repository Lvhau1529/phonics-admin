import { PlusOutlined, StopOutlined } from '@ant-design/icons';
import { Alert, Button, Descriptions, Drawer, Flex, List, Space, Tag, Typography } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { type PlannedSessionModel } from '@/features/attendance/models/AttendanceSessionModel';
import { ExtraSlotsService } from '@/features/extra-slots/api/extraSlotsService';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';

/**
 * Buổi dự kiến (chưa tạo): học sinh sẽ học theo lịch tại ngày đó (tag "Đến hết …" cho học có thời hạn) + thao tác:
 * thêm học sinh tăng cường, báo nghỉ trước. Thao tác do trang lịch mở modal (giữ một chỗ quản lý modal).
 */
export function PlannedSessionDrawer({
  planned,
  canSchedule,
  canCancel,
  onAddStudents,
  onCancel,
  onClose,
}: {
  planned: PlannedSessionModel | undefined;
  canSchedule: boolean;
  canCancel: boolean;
  onAddStudents: (planned: PlannedSessionModel) => void;
  onCancel: (planned: PlannedSessionModel) => void;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={!!planned}
      onClose={onClose}
      title={planned ? `${planned.title} · ${planned.dateText}` : t.attendanceCalendar.plannedTitle}
      width={460}
      destroyOnHidden
      extra={planned && <Tag>{t.attendanceCalendar.planned}</Tag>}
    >
      {planned && (
        <PlannedBody
          planned={planned}
          canSchedule={canSchedule}
          canCancel={canCancel}
          onAddStudents={onAddStudents}
          onCancel={onCancel}
        />
      )}
    </Drawer>
  );
}

function PlannedBody({
  planned,
  canSchedule,
  canCancel,
  onAddStudents,
  onCancel,
}: {
  planned: PlannedSessionModel;
  canSchedule: boolean;
  canCancel: boolean;
  onAddStudents: (planned: PlannedSessionModel) => void;
  onCancel: (planned: PlannedSessionModel) => void;
}) {
  const students = ExtraSlotsService.useStudents(planned.slot.id, planned.date);
  return (
    <Flex vertical gap={16}>
      <Alert type="info" showIcon message={t.attendanceCalendar.plannedHint} />
      <Descriptions column={1} size="small">
        <Descriptions.Item label={t.extraSlots.time}>{planned.timeRange}</Descriptions.Item>
        <Descriptions.Item label={t.extraSlots.teachers}>{planned.teacherNames}</Descriptions.Item>
        <Descriptions.Item label={t.extraSlots.students}>
          {/* Đếm lại từ danh sách mới nhất (sau khi thêm học sinh) — số trên lịch là lúc mở */}
          {students.data
            ? t.attendanceCalendar.plannedCount(
                students.data.length,
                students.data.filter((s) => s.limitedText).length,
              )
            : planned.countText}
        </Descriptions.Item>
      </Descriptions>
      <Space wrap>
        {canSchedule && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onAddStudents(planned)}>
            {t.attendanceCalendar.addBoost}
          </Button>
        )}
        {canCancel && (
          <Button danger icon={<StopOutlined />} onClick={() => onCancel(planned)}>
            {t.attendanceCalendar.reportOff}
          </Button>
        )}
        <Link to={ROUTES.extraSlotDetail(planned.slot.id)}>
          <Button>{t.attendanceCalendar.openSlot}</Button>
        </Link>
      </Space>
      <ErrorAlert error={students.error} onRetry={() => void students.refetch()} />
      <List
        size="small"
        bordered
        loading={students.isFetching && !students.data}
        dataSource={students.data ?? []}
        locale={{ emptyText: t.extraSlots.noStudents }}
        renderItem={(s) => (
          <List.Item key={s.assignmentId}>
            <Space wrap>
              <AvatarImg avatarKey={s.avatarKey} size={24} />
              <Link to={ROUTES.studentDetail(s.studentId)}>{s.fullName}</Link>
              {s.class && <Typography.Text type="secondary">{s.class.name}</Typography.Text>}
              {s.limitedText && <Tag color="blue">{s.limitedText}</Tag>}
            </Space>
          </List.Item>
        )}
      />
    </Flex>
  );
}
