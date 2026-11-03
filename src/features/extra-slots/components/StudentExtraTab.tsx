import { DeleteOutlined, EditOutlined, LogoutOutlined, PlusOutlined, SwapOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Flex, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { StudentAttendanceCard } from '@/features/attendance/components/StudentAttendanceCard';
import { ExtraSlotsService } from '@/features/extra-slots/api/extraSlotsService';
import { EditRateModal } from '@/features/extra-slots/components/EditRateModal';
import { EndRateModal, type EndRateTarget } from '@/features/extra-slots/components/EndRateModal';
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
import {
  appliedRateText,
  slotTimeText,
  type ExtraRateModel,
  type SlotAssignmentModel,
} from '@/features/extra-slots/models/ExtraSlotModel';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { dayjs } from '@/shared/utils/dayjs';
import { formatDate, toIsoDate } from '@/shared/utils/format';

const STATUS_COLOR = { active: 'green', upcoming: 'blue', ended: undefined } as const;

function buildColumns(
  today: string,
  canManage: boolean,
  act: (action: SlotAssignmentAction) => void,
  remove: (assignment: SlotAssignmentModel) => void,
  studentId: string,
): ColumnsType<SlotAssignmentModel> {
  const columns: ColumnsType<SlotAssignmentModel> = [
    {
      title: t.studentExtra.slot,
      key: 'slot',
      render: (_, a) => (
        <>
          <Link to={ROUTES.extraSlotDetail(a.slot.id)}>{a.slot.name}</Link>
          <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
            {slotTimeText(a.slot)}
          </Typography.Text>
        </>
      ),
    },
    { title: t.studentExtra.from, key: 'from', render: (_, a) => a.fromText },
    { title: t.studentExtra.to, key: 'to', render: (_, a) => a.toText },
    {
      title: t.common.status,
      key: 'status',
      render: (_, a) => {
        const status = a.statusOn(today);
        return <Tag color={STATUS_COLOR[status]}>{t.studentExtra[status]}</Tag>;
      },
    },
    { title: t.common.note, dataIndex: 'note', render: (note: string | null) => note ?? t.common.none },
  ];
  if (canManage)
    columns.push({
      title: t.common.actions,
      key: 'actions',
      render: (_, a) => (
        <Space size={4}>
          <Tooltip title={t.studentExtra.editDates}>
            <Button
              size="small"
              icon={<EditOutlined />}
              aria-label={t.studentExtra.editDates}
              onClick={() => act({ mode: 'edit', studentId, assignment: a })}
            />
          </Tooltip>
          {a.isOpen(today) && (
            <>
              <Tooltip title={t.studentExtra.leave}>
                <Button
                  size="small"
                  icon={<LogoutOutlined />}
                  aria-label={t.studentExtra.leave}
                  onClick={() => act({ mode: 'leave', studentId, assignment: a })}
                />
              </Tooltip>
              <Tooltip title={t.studentExtra.move}>
                <Button
                  size="small"
                  icon={<SwapOutlined />}
                  aria-label={t.studentExtra.move}
                  onClick={() => act({ mode: 'move', studentId, assignment: a })}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title={t.studentExtra.remove}>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              aria-label={t.studentExtra.remove}
              onClick={() => remove(a)}
            />
          </Tooltip>
        </Space>
      ),
    });
  return columns;
}

/** Tab "Học thêm" ở trang học sinh: lịch học các ca + đơn giá (nút theo cờ quyền server trả về) */
export function StudentExtraTab({ studentId, studentName }: { studentId: string; studentName: string }) {
  const extra = ExtraSlotsService.useStudentExtra(studentId);
  const createRate = ExtraSlotsService.useCreateStudentRate();
  const [action, setAction] = useState<SlotAssignmentAction>();
  const [settingPrice, setSettingPrice] = useState(false);
  const [removing, setRemoving] = useState<RemoveAssignmentTarget>();
  const [editingRate, setEditingRate] = useState<ExtraRateModel>();
  const [ending, setEnding] = useState<EndRateTarget>();
  const today = toIsoDate(dayjs());
  const data = extra.data;
  const currentOwnPrice = data?.rates?.find((r) => r.state === 'current' && !r.slotId)?.pricePerSession;
  const openAssignments = (data?.assignments ?? []).filter((a) => a.isOpen(today));

  return (
    <Flex vertical gap={16}>
      <ErrorAlert error={extra.error} onRetry={() => void extra.refetch()} />
      <Card
        title={t.studentExtra.schedule}
        extra={
          data?.canManageSchedule && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAction({ mode: 'add', studentId })}
            >
              {t.studentExtra.addToSlot}
            </Button>
          )
        }
      >
        <DataTable.Static<SlotAssignmentModel>
          rowKey="id"
          loading={extra.isFetching}
          columns={buildColumns(
            today,
            !!data?.canManageSchedule,
            setAction,
            (a) =>
              setRemoving({
                studentId,
                assignmentId: a.id,
                studentName,
                slotName: a.slotLabel,
                rangeText: a.rangeText,
              }),
            studentId,
          )}
          dataSource={data?.assignments}
          pagination={false}
          locale={{ emptyText: t.studentExtra.noAssignments }}
        />
      </Card>

      {data?.rates && (
        <Card
          title={t.studentExtra.studentPrice}
          extra={
            data.canManagePricing && (
              <Button onClick={() => setSettingPrice(true)}>{t.studentExtra.setStudentPrice}</Button>
            )
          }
        >
          <Typography.Title level={5}>{t.studentExtra.appliedRates}</Typography.Title>
          {openAssignments.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.studentExtra.noOpenSlots} />
          ) : (
            <Flex vertical gap={4} style={{ marginBottom: 16 }}>
              {openAssignments.map((a) => {
                const applied = data.appliedRates?.find((r) => r.slotId === a.slot.id)?.rate;
                return (
                  <Flex key={a.id} gap={8} align="center" wrap>
                    <Typography.Text>{a.slotLabel}</Typography.Text>
                    {applied && (
                      <>
                        <Typography.Text strong>{appliedRateText(applied)}</Typography.Text>
                        <RateSourceTag source={applied.source} />
                        {applied.effectiveTo && applied.source !== 'SLOT' && (
                          <Tag color="orange">
                            {t.extraSlots.rateEndsFrom(formatDate(applied.effectiveTo))}
                          </Tag>
                        )}
                      </>
                    )}
                  </Flex>
                );
              })}
            </Flex>
          )}
          <Typography.Title level={5}>{t.extraSlots.priceHistory}</Typography.Title>
          <RateHistoryTable
            rates={data.rates}
            loading={extra.isFetching}
            emptyText={t.studentExtra.noStudentRates}
            onEdit={data.canManagePricing ? setEditingRate : undefined}
            onEnd={
              data.canManagePricing
                ? (r) =>
                    setEnding({
                      rateId: r.id,
                      name: studentName,
                      priceText: r.priceText,
                      effectiveFrom: r.effectiveFrom,
                      effectiveTo: r.effectiveTo,
                    })
                : undefined
            }
          />
        </Card>
      )}

      <StudentAttendanceCard studentId={studentId} />

      <SlotAssignmentModal action={action} onClose={() => setAction(undefined)} />
      <RemoveAssignmentModal target={removing} onClose={() => setRemoving(undefined)} />
      <EditRateModal rate={editingRate} onClose={() => setEditingRate(undefined)} />
      <EndRateModal target={ending} onClose={() => setEnding(undefined)} />
      <SetRateModal
        open={settingPrice}
        title={t.studentExtra.setStudentPrice}
        hint={t.studentExtra.studentPriceHint}
        currentPrice={currentOwnPrice}
        withEnd
        loading={createRate.isPending}
        onSubmit={(body) => createRate.mutateAsync({ studentId, body })}
        onClose={() => setSettingPrice(false)}
      />
    </Flex>
  );
}
