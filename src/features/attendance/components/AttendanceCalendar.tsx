import { LeftOutlined, MoreOutlined, PlusOutlined, RightOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Dropdown, Flex, Grid, Segmented, theme, Tooltip, Typography } from 'antd';
import { type CSSProperties, type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AttendanceService } from '@/features/attendance/api/attendanceService';
import { CancelSessionsModal } from '@/features/attendance/components/CancelSessionsModal';
import { CreateSessionDrawer } from '@/features/attendance/components/CreateSessionDrawer';
import { PlannedSessionDrawer } from '@/features/attendance/components/PlannedSessionDrawer';
import {
  type CalendarMode,
  calendarRange,
  shiftAnchor,
} from '@/features/attendance/components/calendarRange';
import {
  type CalendarEntry,
  type PlannedSessionModel,
} from '@/features/attendance/models/AttendanceSessionModel';
import {
  SlotAssignmentModal,
  type SlotAssignmentAction,
} from '@/features/extra-slots/components/SlotAssignmentModal';
import { useAuth } from '@/features/auth/authStore';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { dayjs } from '@/shared/utils/dayjs';
import { formatDate, isoWeekday, sessionDateText } from '@/shared/utils/format';

/** Lưới tháng: số buổi tối đa mỗi ô, còn lại gom "+N buổi" (bấm để xem tuần đó) */
const MONTH_CELL_LIMIT = 3;

export interface CalendarFilters {
  slotId?: string;
  teacherId?: string;
  status?: string;
}

/**
 * Lịch buổi học (docs/attendance-calendar-design.md §4.1): tuần / tháng, buổi thật (bấm → trang buổi) + buổi dự kiến
 * (bấm → drawer: học sinh, thêm học sinh tăng cường, báo nghỉ trước). Màn hẹp: danh sách theo ngày.
 */
export function AttendanceCalendar({
  filters,
  mode,
  anchor,
  onNavigate,
}: {
  filters: CalendarFilters;
  mode: CalendarMode;
  /** Ngày 'YYYY-MM-DD' nằm trong khoảng đang xem */
  anchor: string;
  onNavigate: (next: { mode?: CalendarMode; anchor?: string }) => void;
}) {
  const { can } = useAuth();
  const navigate = useNavigate();
  const narrow = !Grid.useBreakpoint().md;
  const range = calendarRange(mode, anchor);
  const calendar = AttendanceService.useCalendar({ from: range.from, to: range.to, ...filters });
  const today = calendar.data?.today ?? dayjs().format('YYYY-MM-DD');
  const manageSlots = can('extra.manageSlots');
  const canSchedule = can('extra.manageSchedule');

  const [planned, setPlanned] = useState<PlannedSessionModel>();
  const [assigning, setAssigning] = useState<SlotAssignmentAction>();
  const [makeUpDate, setMakeUpDate] = useState<string>();
  const [cancelPreset, setCancelPreset] = useState<{ date: string; slotIds?: string[] }>();

  const byDay = new Map<string, CalendarEntry[]>();
  for (const e of calendar.data?.entries ?? []) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);

  const open = (e: CalendarEntry) =>
    e.kind === 'SESSION' ? void navigate(ROUTES.attendanceSession(e.session.id)) : setPlanned(e.planned);

  const dayMenu = (date: string) =>
    manageSlots && (
      <Dropdown
        trigger={['click']}
        menu={{
          items: [
            { key: 'makeup', icon: <PlusOutlined />, label: t.attendanceCalendar.addMakeUp },
            { key: 'off', icon: <StopOutlined />, danger: true, label: t.attendanceCalendar.cancelDay },
          ],
          onClick: ({ key }) => (key === 'makeup' ? setMakeUpDate(date) : setCancelPreset({ date })),
        }}
      >
        <Button
          size="small"
          type="text"
          icon={<MoreOutlined />}
          aria-label={`${t.attendanceCalendar.dayActions} ${formatDate(date)}`}
        />
      </Dropdown>
    );

  const title =
    mode === 'week'
      ? `${formatDate(range.from)} – ${formatDate(range.to)}`
      : dayjs(anchor).format(t.attendance.monthFormat);

  return (
    <Flex vertical gap={12}>
      <Flex gap={8} wrap align="center" justify="space-between">
        <Flex gap={8} wrap align="center">
          <Button
            icon={<LeftOutlined />}
            aria-label={t.attendanceCalendar.prev}
            onClick={() => onNavigate({ anchor: shiftAnchor(mode, anchor, -1) })}
          />
          <Button onClick={() => onNavigate({ anchor: today })}>{t.attendanceCalendar.today}</Button>
          <Button
            icon={<RightOutlined />}
            aria-label={t.attendanceCalendar.next}
            onClick={() => onNavigate({ anchor: shiftAnchor(mode, anchor, 1) })}
          />
          <Typography.Text strong>{title}</Typography.Text>
        </Flex>
        <Segmented<CalendarMode>
          value={mode}
          onChange={(m) => onNavigate({ mode: m })}
          options={[
            { value: 'week', label: t.attendanceCalendar.week },
            { value: 'month', label: t.attendanceCalendar.month },
          ]}
        />
      </Flex>
      <ErrorAlert error={calendar.error} onRetry={() => void calendar.refetch()} />

      {narrow ? (
        <DayList
          days={range.days}
          byDay={byDay}
          today={today}
          onOpen={open}
          dayMenu={dayMenu}
          monthOf={mode === 'month' ? dayjs(anchor).month() : undefined}
        />
      ) : (
        <DayGrid
          days={range.days}
          byDay={byDay}
          today={today}
          mode={mode}
          anchorMonth={dayjs(anchor).month()}
          onOpen={open}
          dayMenu={dayMenu}
          onShowWeek={(date) => onNavigate({ mode: 'week', anchor: date })}
        />
      )}

      <PlannedSessionDrawer
        planned={planned}
        canSchedule={canSchedule}
        canCancel={manageSlots}
        onClose={() => setPlanned(undefined)}
        onAddStudents={(p) => setAssigning({ mode: 'add', slotId: p.slot.id, from: p.date, limited: true })}
        onCancel={(p) => setCancelPreset({ date: p.date, slotIds: [p.slot.id] })}
      />
      <SlotAssignmentModal action={assigning} onClose={() => setAssigning(undefined)} />
      <CreateSessionDrawer open={!!makeUpDate} date={makeUpDate} onClose={() => setMakeUpDate(undefined)} />
      <CancelSessionsModal
        open={!!cancelPreset}
        selectedIds={[]}
        preset={cancelPreset}
        onClose={(cancelled) => {
          setCancelPreset(undefined);
          if (cancelled) setPlanned(undefined);
        }}
      />
    </Flex>
  );
}

interface DayViewProps {
  days: string[];
  byDay: ReadonlyMap<string, CalendarEntry[]>;
  today: string;
  onOpen: (e: CalendarEntry) => void;
  dayMenu: (date: string) => ReactNode;
}

/** Lưới 7 cột (màn rộng) */
function DayGrid({
  days,
  byDay,
  today,
  mode,
  anchorMonth,
  onOpen,
  dayMenu,
  onShowWeek,
}: DayViewProps & {
  mode: CalendarMode;
  anchorMonth: number;
  onShowWeek: (date: string) => void;
}) {
  const { token } = theme.useToken();
  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    overflow: 'hidden',
  };
  return (
    <div style={grid}>
      {days.slice(0, 7).map((d) => (
        <div
          key={`h${d}`}
          style={{
            padding: '6px 8px',
            background: token.colorFillQuaternary,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Typography.Text type="secondary">{t.weekday[isoWeekday(dayjs(d).day() || 7)]}</Typography.Text>
        </div>
      ))}
      {days.map((date) => {
        const entries = byDay.get(date) ?? [];
        const outside = mode === 'month' && dayjs(date).month() !== anchorMonth;
        const shown = mode === 'month' ? entries.slice(0, MONTH_CELL_LIMIT) : entries;
        const isToday = date === today;
        return (
          <div
            key={date}
            style={{
              minHeight: mode === 'week' ? 220 : 120,
              padding: 6,
              borderTop: `1px solid ${token.colorBorderSecondary}`,
              borderLeft: `1px solid ${token.colorBorderSecondary}`,
              background: isToday
                ? token.colorFillSecondary
                : outside
                  ? token.colorFillQuaternary
                  : undefined,
              opacity: outside ? 0.6 : 1,
            }}
          >
            <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
              <Typography.Text
                strong={isToday}
                style={
                  isToday
                    ? {
                        background: token.colorPrimary,
                        color: token.colorTextLightSolid,
                        borderRadius: token.borderRadiusSM,
                        padding: '0 6px',
                      }
                    : undefined
                }
              >
                {dayjs(date).format('D')}
              </Typography.Text>
              {dayMenu(date)}
            </Flex>
            <Flex vertical gap={4}>
              {shown.map((e) => (
                <EntryChip key={e.key} entry={e} onOpen={onOpen} compact={mode === 'month'} />
              ))}
              {entries.length > shown.length && (
                <Button size="small" type="link" style={{ padding: 0 }} onClick={() => onShowWeek(date)}>
                  {t.attendanceCalendar.more(entries.length - shown.length)}
                </Button>
              )}
            </Flex>
          </div>
        );
      })}
    </div>
  );
}

/** Danh sách theo ngày (màn hẹp) — bỏ ngày trống, ngoài tháng */
function DayList({ days, byDay, today, onOpen, dayMenu, monthOf }: DayViewProps & { monthOf?: number }) {
  const visible = days.filter(
    (d) => (monthOf === undefined || dayjs(d).month() === monthOf) && (byDay.get(d)?.length || d === today),
  );
  if (!visible.length)
    return <Typography.Text type="secondary">{t.attendanceCalendar.empty}</Typography.Text>;
  return (
    <Flex vertical gap={12}>
      {visible.map((date) => (
        <Flex key={date} vertical gap={4}>
          <Flex justify="space-between" align="center">
            <Typography.Text strong>
              {sessionDateText(date)}
              {date === today && ` · ${t.attendanceCalendar.today}`}
            </Typography.Text>
            {dayMenu(date)}
          </Flex>
          {(byDay.get(date) ?? []).map((e) => (
            <EntryChip key={e.key} entry={e} onOpen={onOpen} />
          ))}
        </Flex>
      ))}
    </Flex>
  );
}

/** Thẻ buổi: màu theo trạng thái, buổi dự kiến viền nét đứt */
function EntryChip({
  entry,
  onOpen,
  compact,
}: {
  entry: CalendarEntry;
  onOpen: (e: CalendarEntry) => void;
  compact?: boolean;
}) {
  const { token } = theme.useToken();
  const isSession = entry.kind === 'SESSION';
  const status = isSession ? entry.session.status : undefined;
  const accent =
    status === 'CONFIRMED'
      ? token.colorSuccess
      : status === 'PENDING'
        ? token.colorWarning
        : status === 'CANCELLED'
          ? token.colorTextQuaternary
          : token.colorBorder;
  const title = isSession ? entry.session.title : entry.planned.title;
  const time = isSession ? entry.session.timeRange : entry.planned.timeRange;
  const meta = isSession
    ? status === 'CANCELLED'
      ? entry.session.statusLabel
      : `${entry.session.presentText} · ${entry.session.statusLabel}`
    : `${entry.planned.countText} · ${t.attendanceCalendar.planned}`;
  const tooltip = isSession
    ? [entry.session.teacherNames, entry.session.cancelReason].filter(Boolean).join(' · ')
    : entry.planned.teacherNames;
  return (
    // Lưới tháng chỉ hiện giờ + tên → đưa sĩ số / trạng thái vào tooltip
    <Tooltip title={compact ? `${time} · ${meta} · ${tooltip}` : tooltip}>
      <button
        type="button"
        onClick={() => onOpen(entry)}
        style={{
          font: 'inherit',
          color: 'inherit',
          textAlign: 'left',
          width: '100%',
          boxSizing: 'border-box',
          cursor: 'pointer',
          display: 'block',
          padding: '4px 6px',
          borderRadius: token.borderRadiusSM,
          border: `1px ${isSession ? 'solid' : 'dashed'} ${token.colorBorder}`,
          borderLeft: `3px solid ${accent}`,
          background: isSession ? token.colorBgContainer : 'transparent',
          textDecoration: status === 'CANCELLED' ? 'line-through' : undefined,
          minWidth: 0,
        }}
      >
        <Typography.Text style={{ fontSize: token.fontSizeSM }} ellipsis={compact}>
          <strong>{entry.startTime}</strong> {title}
        </Typography.Text>
        {!compact && (
          <Typography.Text type="secondary" style={{ display: 'block', fontSize: token.fontSizeSM }}>
            {time} · {meta}
          </Typography.Text>
        )}
      </button>
    </Tooltip>
  );
}
