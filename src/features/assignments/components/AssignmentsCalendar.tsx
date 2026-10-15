import { Badge, Calendar, Flex, Typography, theme } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { AssignmentDayDrawer } from '@/features/assignments/components/AssignmentDayDrawer';
import { AssignmentsService } from '@/features/assignments/api/assignmentsService';
import type { AssignmentModel } from '@/features/assignments/models/AssignmentModel';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { toIsoDate } from '@/shared/utils/format';

const MAX_PER_CELL = 3;

/** Lịch tháng: mỗi ô liệt kê bài giao (tối đa 3 + "còn n"); bấm ngày → Drawer */
export function AssignmentsCalendar({ classId }: { classId?: string }) {
  const { token } = theme.useToken();
  // Ngày đang chọn trên lịch (mặc định hôm nay); tháng hiển thị suy ra từ đây
  const [month, setMonth] = useState<Dayjs>(() => dayjs());
  const [selected, setSelected] = useState<string | null>(null);
  // Lấy rộng ±7 ngày để các ô tháng trước / sau trên lưới cũng có dữ liệu
  const from = toIsoDate(month.startOf('month').subtract(7, 'day'));
  const to = toIsoDate(month.endOf('month').add(7, 'day'));
  const query = AssignmentsService.useCalendar(from, to, classId);

  const byDate = useMemo(() => {
    const map = new Map<string, AssignmentModel[]>();
    for (const a of query.data ?? []) {
      const list = map.get(a.scheduledFor) ?? [];
      list.push(a);
      map.set(a.scheduledFor, list);
    }
    return map;
  }, [query.data]);

  const statusColor = (a: AssignmentModel) =>
    a.status === 'OPEN'
      ? token.colorSuccess
      : a.status === 'SCHEDULED'
        ? token.colorInfo
        : token.colorTextQuaternary;

  return (
    <>
      <ErrorAlert error={query.error} onRetry={() => void query.refetch()} />
      <Calendar
        value={month}
        onPanelChange={(d) => setMonth(d)}
        onSelect={(d, { source }) => {
          setMonth(d);
          if (source === 'date') setSelected(toIsoDate(d));
        }}
        cellRender={(d, info) => {
          if (info.type !== 'date') return info.originNode;
          const items = byDate.get(toIsoDate(d)) ?? [];
          if (!items.length) return null;
          return (
            <Flex vertical gap={2}>
              {items.slice(0, MAX_PER_CELL).map((a) => (
                <Badge
                  key={a.id}
                  color={statusColor(a)}
                  text={
                    <Typography.Text
                      ellipsis
                      style={{ fontSize: 12, maxWidth: 140 }}
                      title={`${a.className} · ${a.worksheetTitle}`}
                    >
                      {a.className}: {a.worksheetTitle}
                    </Typography.Text>
                  }
                />
              ))}
              {items.length > MAX_PER_CELL && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t.assignments.more(items.length - MAX_PER_CELL)}
                </Typography.Text>
              )}
            </Flex>
          );
        }}
      />
      <AssignmentDayDrawer
        date={selected}
        items={selected ? (byDate.get(selected) ?? []) : []}
        classId={classId}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
