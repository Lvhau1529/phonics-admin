import { DeleteOutlined, EditOutlined, PlusOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Flex,
  Popconfirm,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ROUTES } from '@/app/routes';
import { RecentSessionsCard } from '@/features/attendance/components/RecentSessionsCard';
import { useAuth } from '@/features/auth/authStore';
import { ExtraSlotsService } from '@/features/extra-slots/api/extraSlotsService';
import { EditRateModal } from '@/features/extra-slots/components/EditRateModal';
import { ExtraSlotFormDrawer } from '@/features/extra-slots/components/ExtraSlotFormDrawer';
import { RateHistoryTable } from '@/features/extra-slots/components/RateHistoryTable';
import { RateSourceTag } from '@/features/extra-slots/components/RateSourceTag';
import {
  RemoveAssignmentModal,
  type RemoveAssignmentTarget,
} from '@/features/extra-slots/components/RemoveAssignmentModal';
import { SetRateModal } from '@/features/extra-slots/components/SetRateModal';
import {
  SlotAssignmentModal,
  type SlotAssignmentAction,
} from '@/features/extra-slots/components/SlotAssignmentModal';
import { SlotTeachersModal } from '@/features/extra-slots/components/SlotTeachersModal';
import type {
  ExtraRateModel,
  ExtraSlotModel,
  SlotStudentModel,
} from '@/features/extra-slots/models/ExtraSlotModel';
import { CreateStudentsDrawer } from '@/features/students/components/CreateStudentsDrawer';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { dayjs } from '@/shared/utils/dayjs';
import { formatDate, formatMoney, toIsoDate } from '@/shared/utils/format';

function buildStudentColumns(
  showRate: boolean,
  onRemove?: (student: SlotStudentModel) => void,
): ColumnsType<SlotStudentModel> {
  const columns: ColumnsType<SlotStudentModel> = [
    {
      title: t.common.student,
      key: 'name',
      render: (_, s) => (
        <Space>
          <AvatarImg avatarKey={s.avatarKey} size={28} />
          <Link to={ROUTES.studentDetail(s.studentId)}>{s.fullName}</Link>
        </Space>
      ),
    },
    { title: t.common.class, key: 'class', render: (_, s) => s.class?.name ?? t.common.none },
    { title: t.studentExtra.from, key: 'from', render: (_, s) => formatDate(s.effectiveFrom) },
    {
      title: t.studentExtra.to,
      key: 'to',
      render: (_, s) => (s.effectiveTo ? formatDate(s.effectiveTo) : t.common.none),
    },
  ];
  if (showRate)
    columns.push({
      title: t.extraSlots.rate,
      key: 'rate',
      render: (_, s) =>
        s.rate && (
          <Space>
            <span>{s.rateText}</span>
            <RateSourceTag source={s.rate.source} />
          </Space>
        ),
    });
  if (onRemove)
    columns.push({
      title: t.common.actions,
      key: 'actions',
      render: (_, s) => (
        <Tooltip title={t.studentExtra.remove}>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            aria-label={t.studentExtra.remove}
            onClick={() => onRemove(s)}
          />
        </Tooltip>
      ),
    });
  return columns;
}

/** Giá mặc định của ca: giá hiện tại + lịch sử + đặt giá mới */
function SlotPriceCard({ slot }: { slot: ExtraSlotModel }) {
  const { can } = useAuth();
  const rates = ExtraSlotsService.useSlotRates(slot.id, true);
  const createRate = ExtraSlotsService.useCreateSlotRate();
  const [open, setOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ExtraRateModel>();
  return (
    <Card
      title={t.extraSlots.defaultPrice}
      extra={
        can('extra.managePricing') && <Button onClick={() => setOpen(true)}>{t.extraSlots.setPrice}</Button>
      }
    >
      <ErrorAlert error={rates.error} onRetry={() => void rates.refetch()} />
      <Statistic
        value={slot.defaultPrice === null ? t.extraSlots.noPrice : formatMoney(slot.defaultPrice)}
        suffix={slot.defaultPrice === null ? undefined : t.extraSlots.perSession}
        valueStyle={{ fontSize: 20 }}
      />
      <Typography.Paragraph type="secondary">{t.extraSlots.defaultPriceHint}</Typography.Paragraph>
      <Typography.Title level={5}>{t.extraSlots.priceHistory}</Typography.Title>
      <RateHistoryTable
        rates={rates.data}
        loading={rates.isFetching}
        onEdit={can('extra.managePricing') ? setEditingRate : undefined}
      />
      <EditRateModal rate={editingRate} onClose={() => setEditingRate(undefined)} />
      <SetRateModal
        open={open}
        title={`${t.extraSlots.setPrice} · ${slot.name}`}
        hint={t.extraSlots.defaultPriceHint}
        currentPrice={slot.defaultPrice}
        loading={createRate.isPending}
        onSubmit={(body) => createRate.mutateAsync({ id: slot.id, body })}
        onClose={() => setOpen(false)}
      />
    </Card>
  );
}

/** Chi tiết ca: thông tin, giá mặc định, học sinh học ở một ngày */
export function ExtraSlotDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { can, isAdmin } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const detail = ExtraSlotsService.useDetail(id);
  const [date, setDate] = useState(() => toIsoDate(dayjs()));
  const students = ExtraSlotsService.useStudents(id, date);
  const archive = ExtraSlotsService.useArchive();
  const [editing, setEditing] = useState(false);
  const [teachersOf, setTeachersOf] = useState<ExtraSlotModel>();
  const [assigning, setAssigning] = useState<SlotAssignmentAction>();
  const [creatingStudents, setCreatingStudents] = useState(false);
  const [removing, setRemoving] = useState<RemoveAssignmentTarget>();

  const slot = detail.data;
  if (detail.error) return <ErrorAlert error={detail.error} onRetry={() => void detail.refetch()} />;
  if (!slot) return <Skeleton active />;

  const manage = can('extra.manageSlots') && !slot.isArchived;
  const handleArchive = async () => {
    try {
      await archive.mutateAsync(slot.id);
      message.success(t.extraSlots.archivedDone);
      void navigate(ROUTES.extraSlots);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  return (
    <>
      <PageHeader
        title={slot.name}
        subtitle={`${slot.weekdayLabel} · ${slot.timeRange}`}
        backTo={ROUTES.extraSlots}
        extra={
          manage && (
            <Space wrap>
              <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
                {t.common.edit}
              </Button>
              {/* Chọn GV cần danh sách giáo viên (chỉ admin) */}
              {isAdmin && (
                <Button icon={<TeamOutlined />} onClick={() => setTeachersOf(slot)}>
                  {t.extraSlots.setTeachers}
                </Button>
              )}
              <Popconfirm
                title={t.extraSlots.archiveConfirm}
                okText={t.extraSlots.archive}
                cancelText={t.common.cancel}
                onConfirm={() => void handleArchive()}
              >
                <Button danger icon={<DeleteOutlined />} loading={archive.isPending}>
                  {t.extraSlots.archive}
                </Button>
              </Popconfirm>
            </Space>
          )
        }
      />

      <Flex vertical gap={16}>
        <Card>
          <Descriptions column={{ xs: 1, md: 2, xl: 3 }} size="small">
            <Descriptions.Item label={t.extraSlots.time}>{slot.timeText}</Descriptions.Item>
            <Descriptions.Item label={t.extraSlots.room}>{slot.room ?? t.common.none}</Descriptions.Item>
            <Descriptions.Item label={t.extraSlots.capacity}>{slot.studentCountText}</Descriptions.Item>
            <Descriptions.Item label={t.extraSlots.teachers}>{slot.teacherNames}</Descriptions.Item>
            <Descriptions.Item label={t.extraSlots.mainClass}>
              {slot.class ? (
                <Link to={ROUTES.classDetail(slot.class.id)}>{slot.class.name}</Link>
              ) : (
                t.common.none
              )}
            </Descriptions.Item>
            {slot.isArchived && (
              <Descriptions.Item label={t.common.status}>
                <Tag>{t.extraSlots.archived}</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {can('extra.viewPricing') && <SlotPriceCard slot={slot} />}

        <Card
          title={t.extraSlots.students}
          extra={
            !slot.isArchived && (
              <Space wrap>
                {can('students.create') && (
                  <Button icon={<UserAddOutlined />} onClick={() => setCreatingStudents(true)}>
                    {t.students.addNew}
                  </Button>
                )}
                {can('extra.manageSchedule') && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setAssigning({ mode: 'add', slotId: slot.id })}
                  >
                    {t.extraSlots.addStudent}
                  </Button>
                )}
              </Space>
            )
          }
        >
          <Flex gap={8} align="center" style={{ marginBottom: 12 }}>
            <Typography.Text>{t.extraSlots.studentsOn}</Typography.Text>
            <DatePicker
              value={dayjs(date)}
              allowClear={false}
              format={t.format.date}
              onChange={(d) => d && setDate(toIsoDate(d))}
            />
          </Flex>
          <ErrorAlert error={students.error} onRetry={() => void students.refetch()} />
          <DataTable.Static<SlotStudentModel>
            rowKey="assignmentId"
            loading={students.isFetching}
            columns={buildStudentColumns(
              can('extra.viewPricing'),
              can('extra.manageSchedule')
                ? (s) =>
                    setRemoving({
                      studentId: s.studentId,
                      assignmentId: s.assignmentId,
                      studentName: s.fullName,
                      slotName: slot.name,
                      rangeText: s.rangeText,
                    })
                : undefined,
            )}
            dataSource={students.data}
            pagination={false}
            locale={{ emptyText: t.extraSlots.noStudents }}
          />
        </Card>

        <RecentSessionsCard slotId={slot.id} />
      </Flex>

      {/* Modal gán GV tải danh sách GV (API chỉ admin) ngay khi render */}
      {manage && <ExtraSlotFormDrawer open={editing} slot={slot} onClose={() => setEditing(false)} />}
      {manage && isAdmin && <SlotTeachersModal slot={teachersOf} onClose={() => setTeachersOf(undefined)} />}
      <SlotAssignmentModal action={assigning} onClose={() => setAssigning(undefined)} />
      <RemoveAssignmentModal target={removing} onClose={() => setRemoving(undefined)} />
      <CreateStudentsDrawer
        open={creatingStudents}
        slotId={slot.id}
        onClose={() => setCreatingStudents(false)}
      />
    </>
  );
}

export default ExtraSlotDetailPage;
