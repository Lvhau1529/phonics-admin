import { PlusOutlined, StopOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Select, Space, Tooltip, Typography } from 'antd';
import { AttendanceSessionStatus } from '@phonics/contracts';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AttendanceService } from '@/features/attendance/api/attendanceService';
import { AttendanceStatusTag } from '@/features/attendance/components/AttendanceStatusTag';
import { CancelSessionsModal } from '@/features/attendance/components/CancelSessionsModal';
import { ResendDigestButton } from '@/features/attendance/components/ResendDigestButton';
import { CreateSessionDrawer } from '@/features/attendance/components/CreateSessionDrawer';
import type { AttendanceSessionModel } from '@/features/attendance/models/AttendanceSessionModel';
import { useAuth } from '@/features/auth/authStore';
import { ExtraSlotSelect } from '@/features/extra-slots/components/ExtraSlotSelect';
import { TeacherSelect } from '@/features/teachers/components/TeacherSelect';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { dayjs } from '@/shared/utils/dayjs';
import { toIsoDate } from '@/shared/utils/format';

function buildColumns(): ColumnsType<AttendanceSessionModel> {
  return [
    {
      title: t.attendance.date,
      key: 'date',
      sorter: true,
      render: (_, s) => <Link to={ROUTES.attendanceSession(s.id)}>{s.dateText}</Link>,
    },
    { title: t.extraSlots.time, key: 'time', render: (_, s) => s.timeRange },
    {
      title: t.attendance.session,
      key: 'slot',
      render: (_, s) =>
        s.isMakeUp ? (
          <Typography.Text italic>{s.title}</Typography.Text>
        ) : (
          <Link to={ROUTES.extraSlotDetail(s.slot!.id)}>{s.title}</Link>
        ),
    },
    {
      title: t.extraSlots.teachers,
      key: 'teachers',
      render: (_, s) => <Tooltip title={s.teacherNames}>{s.teacherNamesShort}</Tooltip>,
    },
    { title: t.attendance.present, key: 'present', render: (_, s) => s.presentText },
    {
      title: t.common.status,
      key: 'status',
      sorter: true,
      render: (_, s) => <AttendanceStatusTag status={s.status} />,
    },
    {
      title: t.attendance.confirmed,
      key: 'confirmed',
      render: (_, s) =>
        s.confirmedText ?? (
          <Typography.Text type="secondary">{s.cancelReason ?? t.common.none}</Typography.Text>
        ),
    },
  ];
}

/** Điểm danh học thêm: danh sách buổi (GV: buổi mình dạy), tạo buổi bù / huỷ buổi (admin) */
export function AttendancePage() {
  const { can, isAdmin } = useAuth();
  const table = useTableQuery({
    filterKeys: ['from', 'to', 'status', 'slotId', 'teacherId'] as const,
    defaultSort: 'date:desc',
  });
  const list = AttendanceService.useList(table.params);
  const manage = can('extra.manageSlots');
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const { from, to } = table.filters;
  // Gửi lại mail chỉ áp cho buổi chưa xác nhận đang chọn (trên trang hiện tại)
  const pendingSelected = (list.data?.items ?? [])
    .filter((s) => s.isPending && selected.includes(s.id))
    .map((s) => s.id);

  return (
    <>
      <PageHeader
        title={t.attendance.title}
        extra={
          manage && (
            <Space wrap>
              {isAdmin && (
                <ResendDigestButton sessionIds={pendingSelected} showCount onSent={() => setSelected([])} />
              )}
              <Button icon={<StopOutlined />} onClick={() => setCancelling(true)}>
                {t.attendance.cancelSessions}
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
                {t.attendance.createMakeUp}
              </Button>
            </Space>
          )
        }
      >
        <Flex gap={8} wrap>
          <DatePicker.RangePicker
            format={t.format.date}
            value={from && to ? [dayjs(from), dayjs(to)] : null}
            onChange={(range) =>
              table.setFilters({
                from: range?.[0] ? toIsoDate(range[0]) : undefined,
                to: range?.[1] ? toIsoDate(range[1]) : undefined,
              })
            }
          />
          <Select
            allowClear
            placeholder={t.common.status}
            value={table.filters.status}
            onChange={(v) => table.setFilter('status', v)}
            options={AttendanceSessionStatus.options.map((s) => ({ value: s, label: t.attendanceStatus[s] }))}
            style={{ width: 170 }}
          />
          <ExtraSlotSelect value={table.filters.slotId} onChange={(v) => table.setFilter('slotId', v)} />
          {isAdmin && (
            <TeacherSelect
              value={table.filters.teacherId}
              onChange={(v) => table.setFilter('teacherId', typeof v === 'string' ? v : undefined)}
              style={{ width: 200 }}
            />
          )}
        </Flex>
      </PageHeader>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <DataTable<AttendanceSessionModel>
        columns={buildColumns()}
        data={list.data}
        loading={list.isFetching}
        page={table.page}
        pageSize={table.pageSize}
        sort={table.sort}
        onPageChange={table.setPage}
        onSortChange={table.setSort}
        rowSelection={
          manage
            ? {
                selectedRowKeys: selected,
                onChange: (keys) => setSelected(keys.map(String)),
                getCheckboxProps: (s) => ({ disabled: s.isCancelled }),
              }
            : undefined
        }
      />
      <CreateSessionDrawer open={creating} onClose={() => setCreating(false)} />
      <CancelSessionsModal
        open={cancelling}
        selectedIds={selected}
        onClose={(cancelled) => {
          setCancelling(false);
          if (cancelled) setSelected([]);
        }}
      />
    </>
  );
}

export default AttendancePage;
