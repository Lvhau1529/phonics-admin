import {
  CheckOutlined,
  DeleteOutlined,
  PlusOutlined,
  ScheduleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Flex,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
  Skeleton,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  AttendanceMark,
  BILLING_POLICY,
  type AttendanceRecordChange,
  type UpdateAttendanceRecordsBody,
} from '@phonics/contracts';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AttendanceService } from '@/features/attendance/api/attendanceService';
import { AttendanceMarkTag, AttendanceStatusTag } from '@/features/attendance/components/AttendanceStatusTag';
import { ResendDigestButton } from '@/features/attendance/components/ResendDigestButton';
import type {
  AttendanceRecordModel,
  AttendanceSessionDetailModel,
} from '@/features/attendance/models/AttendanceSessionModel';
import { useAuth } from '@/features/auth/authStore';
import { StudentPickSelect } from '@/features/extra-slots/components/StudentPickSelect';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { formatMoney, formatPriceInput, parsePriceInput } from '@/shared/utils/format';

/** Thay đổi chưa lưu của một học sinh (trừ studentId) */
type RecordEdit = Omit<AttendanceRecordChange, 'studentId'>;

/** Đánh dấu / tính phí đang hiển thị = thay đổi chưa lưu, không có thì giá trị đã lưu */
function effective(record: AttendanceRecordModel, edit: RecordEdit | undefined) {
  const mark = edit?.mark ?? record.mark;
  return {
    mark,
    note: edit?.note !== undefined ? edit.note : record.note,
    // Đổi điểm danh mà chưa chọn tính phí → theo BILLING_POLICY (server làm y như vậy)
    charged: edit?.charged ?? (edit?.mark ? BILLING_POLICY[mark] : record.charged),
    unitPrice: edit?.unitPrice ?? record.unitPrice,
  };
}

interface ColumnContext {
  session: AttendanceSessionDetailModel;
  edits: Record<string, RecordEdit>;
  edit: (studentId: string, patch: RecordEdit) => void;
  remove: (studentId: string) => void;
}

function buildColumns({ session, edits, edit, remove }: ColumnContext): ColumnsType<AttendanceRecordModel> {
  const editable = session.editable;
  const billing = editable && session.canEditBilling;
  const showPrice = session.records.some((r) => r.unitPrice !== null);
  const columns: ColumnsType<AttendanceRecordModel> = [
    {
      title: t.common.student,
      key: 'student',
      render: (_, r) => (
        <Space>
          <AvatarImg avatarKey={r.avatarKey} size={28} />
          <Link to={ROUTES.studentDetail(r.studentId)}>{r.fullName}</Link>
        </Space>
      ),
    },
    {
      title: t.attendance.mark,
      key: 'mark',
      render: (_, r) => {
        const value = effective(r, edits[r.studentId]).mark;
        return editable ? (
          <Segmented<AttendanceMark>
            size="small"
            value={value}
            onChange={(mark) => edit(r.studentId, { mark })}
            options={AttendanceMark.options.map((m) => ({ value: m, label: t.attendanceMark[m] }))}
          />
        ) : (
          <AttendanceMarkTag mark={value} />
        );
      },
    },
    {
      title: t.common.note,
      key: 'note',
      render: (_, r) => {
        const value = effective(r, edits[r.studentId]).note;
        return editable ? (
          <Input
            size="small"
            maxLength={200}
            value={value ?? ''}
            onChange={(e) => edit(r.studentId, { note: e.target.value.trim() ? e.target.value : null })}
            style={{ minWidth: 160 }}
          />
        ) : (
          (value ?? t.common.none)
        );
      },
    },
    {
      title: t.common.source,
      key: 'source',
      render: (_, r) => <Tag color={r.isManual ? 'blue' : undefined}>{r.sourceLabel}</Tag>,
    },
  ];
  if (showPrice)
    columns.push(
      {
        title: t.attendance.unitPrice,
        key: 'price',
        render: (_, r) => {
          const value = effective(r, edits[r.studentId]).unitPrice;
          return (
            <Space size={4}>
              {billing ? (
                <InputNumber<number>
                  size="small"
                  min={0}
                  step={10_000}
                  value={value ?? 0}
                  formatter={formatPriceInput}
                  parser={parsePriceInput}
                  onChange={(v) => edit(r.studentId, { unitPrice: v ?? 0 })}
                  style={{ width: 130 }}
                />
              ) : (
                formatMoney(value)
              )}
              {r.missingRate && <Tag color="warning">{t.rateSource.NONE}</Tag>}
            </Space>
          );
        },
      },
      {
        title: t.attendance.charged,
        key: 'charged',
        render: (_, r) => {
          const value = effective(r, edits[r.studentId]).charged;
          return billing ? (
            <Switch size="small" checked={value} onChange={(charged) => edit(r.studentId, { charged })} />
          ) : value ? (
            t.common.yes
          ) : (
            t.common.no
          );
        },
      },
    );
  columns.push({
    title: t.common.actions,
    key: 'actions',
    render: (_, r) => (
      <Space size={4}>
        <Tooltip title={t.attendance.editSchedule}>
          <Link to={`${ROUTES.studentDetail(r.studentId)}?tab=extra`}>
            <Button
              size="small"
              type="text"
              icon={<ScheduleOutlined />}
              aria-label={t.attendance.editSchedule}
            />
          </Link>
        </Tooltip>
        {editable && r.isManual && (
          <Popconfirm
            title={t.attendance.removeConfirm}
            okText={t.common.delete}
            cancelText={t.common.cancel}
            onConfirm={() => remove(r.studentId)}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} aria-label={t.common.delete} />
          </Popconfirm>
        )}
      </Space>
    ),
  });
  return columns;
}

/** Thêm học sinh học bù / học thử vào buổi (bản ghi MANUAL) */
function AddStudentModal({
  open,
  loading,
  onAdd,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  onAdd: (studentId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [studentId, setStudentId] = useState<string>();
  return (
    <Modal
      open={open}
      title={t.attendance.addStudent}
      okText={t.common.add}
      cancelText={t.common.cancel}
      okButtonProps={{ disabled: !studentId }}
      confirmLoading={loading}
      onOk={() => studentId && void onAdd(studentId).then(() => setStudentId(undefined))}
      onCancel={onClose}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">{t.attendance.addStudentHint}</Typography.Paragraph>
      <StudentPickSelect value={studentId} onChange={setStudentId} />
    </Modal>
  );
}

/** Trang một buổi: điểm danh từng học sinh, thêm học sinh học bù, lưu, xác nhận */
export function AttendanceSessionPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { message } = App.useApp();
  const { isAdmin } = useAuth();
  const detail = AttendanceService.useDetail(id);
  const update = AttendanceService.useUpdateRecords();
  const confirm = AttendanceService.useConfirm();
  const [edits, setEdits] = useState<Record<string, RecordEdit>>({});
  const [sessionNote, setSessionNote] = useState<string | null>();
  const [adding, setAdding] = useState(false);

  const session = detail.data;
  if (detail.error) return <ErrorAlert error={detail.error} onRetry={() => void detail.refetch()} />;
  if (!session) return <Skeleton active />;

  const dirty = Object.keys(edits).length > 0 || sessionNote !== undefined;
  const edit = (studentId: string, patch: RecordEdit) =>
    setEdits((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));

  const save = async (body: UpdateAttendanceRecordsBody): Promise<boolean> => {
    try {
      await update.mutateAsync({ id: session.id, body });
      return true;
    } catch (error) {
      message.error(errorMessage(error));
      return false;
    }
  };

  const pendingBody = (): UpdateAttendanceRecordsBody => ({
    records: Object.entries(edits).map(([studentId, change]) => ({ studentId, ...change })),
    ...(sessionNote !== undefined ? { note: sessionNote } : {}),
  });

  const handleSave = async () => {
    if (!dirty) return void message.info(t.common.noChanges);
    if (await save(pendingBody())) {
      setEdits({});
      setSessionNote(undefined);
      message.success(t.common.saved);
    }
  };

  const handleConfirm = async () => {
    if (dirty && !(await save(pendingBody()))) return;
    setEdits({});
    setSessionNote(undefined);
    try {
      await confirm.mutateAsync(session.id);
      message.success(t.attendance.confirmedDone);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const remove = (studentId: string) => {
    void save({ remove: [studentId] }).then((ok) => {
      if (!ok) return;
      setEdits(({ [studentId]: _removed, ...rest }) => rest);
      message.success(t.common.deleted);
    });
  };

  const add = async (studentId: string) => {
    if (await save({ records: [{ studentId, mark: 'PRESENT' }] })) {
      message.success(t.common.saved);
      setAdding(false);
    }
  };

  const chargedTotal = session.chargedTotal;
  return (
    <>
      <PageHeader
        title={session.title}
        subtitle={`${session.dateText} · ${session.timeRange}`}
        backTo={ROUTES.attendance}
        extra={
          (session.editable || (isAdmin && session.isPending)) && (
            <Space wrap>
              {isAdmin && session.isPending && <ResendDigestButton sessionIds={[session.id]} />}
              {session.editable && (
                <>
                  <Button icon={<PlusOutlined />} onClick={() => setAdding(true)}>
                    {t.attendance.addStudent}
                  </Button>
                  <Button
                    icon={<SaveOutlined />}
                    disabled={!dirty}
                    loading={update.isPending}
                    onClick={() => void handleSave()}
                  >
                    {t.common.save}
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={confirm.isPending}
                    onClick={() => void handleConfirm()}
                  >
                    {session.isPending ? t.attendance.confirm : t.attendance.confirmAgain}
                  </Button>
                </>
              )}
            </Space>
          )
        }
      />
      <Flex vertical gap={16}>
        {session.missingRateCount > 0 && (
          <Alert type="warning" showIcon message={t.attendance.missingRate(session.missingRateCount)} />
        )}
        {session.status === 'CONFIRMED' && session.editable && (
          <Alert type="info" showIcon message={t.attendance.confirmedEditHint} />
        )}
        <Card>
          <Descriptions column={{ xs: 1, md: 2, xl: 3 }} size="small">
            <Descriptions.Item label={t.common.status}>
              <AttendanceStatusTag status={session.status} />
            </Descriptions.Item>
            <Descriptions.Item label={t.extraSlots.teachers}>{session.teacherNames}</Descriptions.Item>
            <Descriptions.Item label={t.attendance.present}>{session.presentText}</Descriptions.Item>
            {session.slot && (
              <Descriptions.Item label={t.studentExtra.slot}>
                <Link to={ROUTES.extraSlotDetail(session.slot.id)}>{session.slot.name}</Link>
              </Descriptions.Item>
            )}
            {session.confirmedText && (
              <Descriptions.Item label={t.attendance.confirmed}>{session.confirmedText}</Descriptions.Item>
            )}
            {session.cancelReason && (
              <Descriptions.Item label={t.attendance.cancelReason}>{session.cancelReason}</Descriptions.Item>
            )}
            {chargedTotal !== null && (
              <Descriptions.Item label={t.attendance.chargedTotal}>
                {formatMoney(chargedTotal)}
              </Descriptions.Item>
            )}
          </Descriptions>
          {session.editable ? (
            <Input.TextArea
              placeholder={t.attendance.sessionNote}
              maxLength={500}
              autoSize={{ minRows: 1, maxRows: 4 }}
              value={sessionNote !== undefined ? (sessionNote ?? '') : (session.note ?? '')}
              onChange={(e) => setSessionNote(e.target.value.trim() ? e.target.value : null)}
              style={{ marginTop: 12 }}
            />
          ) : (
            session.note && (
              <Typography.Paragraph style={{ marginTop: 12 }}>{session.note}</Typography.Paragraph>
            )
          )}
        </Card>
        <Card title={t.attendance.students}>
          <DataTable.Static<AttendanceRecordModel>
            rowKey="studentId"
            loading={detail.isFetching}
            columns={buildColumns({ session, edits, edit, remove })}
            dataSource={session.records}
            pagination={false}
            locale={{ emptyText: t.attendance.noStudents }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </Flex>
      <AddStudentModal
        open={adding}
        loading={update.isPending}
        onAdd={add}
        onClose={() => setAdding(false)}
      />
    </>
  );
}

export default AttendanceSessionPage;
