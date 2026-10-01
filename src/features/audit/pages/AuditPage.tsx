import { DatePicker, Flex, Select, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AuditAction, type AuditLogView } from '@phonics/contracts';
import dayjs from 'dayjs';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/features/audit/api';
import { qk } from '@/shared/api/queryKeys';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { formatDateTime, toIsoDate } from '@/shared/utils/format';

/** Link tới trang chi tiết theo loại đối tượng (nếu có) */
function targetLink(log: AuditLogView) {
  if (!log.targetId) return <Typography.Text type="secondary">{log.targetType}</Typography.Text>;
  const type = log.targetType.toLowerCase();
  const to =
    type === 'student' || type === 'user'
      ? ROUTES.studentDetail(log.targetId)
      : type === 'class'
        ? ROUTES.classDetail(log.targetId)
        : type === 'game'
          ? ROUTES.gameDetail(log.targetId)
          : undefined;
  const label = `${log.targetType} · ${log.targetId.slice(0, 8)}`;
  return to ? <Link to={to}>{label}</Link> : <Typography.Text code>{label}</Typography.Text>;
}

/** JSON trước / sau của một dòng nhật ký */
function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div style={{ flex: 1, minWidth: 240 }}>
      <Typography.Text strong>{label}</Typography.Text>
      <pre
        style={{
          margin: '4px 0 0',
          padding: 8,
          background: '#fafafa',
          borderRadius: 6,
          fontSize: 12,
          overflow: 'auto',
          maxHeight: 320,
        }}
      >
        {value === null || value === undefined ? t.common.none : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

const buildColumns = (): ColumnsType<AuditLogView> => [
  {
    title: t.common.time,
    dataIndex: 'createdAt',
    key: 'createdAt',
    sorter: true,
    render: formatDateTime,
    width: 150,
  },
  { title: t.audit.actor, dataIndex: 'actorName', render: (n: string | null) => n ?? t.points.system },
  {
    title: t.audit.action,
    dataIndex: 'action',
    render: (a: AuditAction) => <Tag color="purple">{t.audit.actions[a]}</Tag>,
  },
  { title: t.audit.target, key: 'target', render: (_, log) => targetLink(log) },
];

export function AuditPage() {
  const table = useTableQuery({
    filterKeys: ['action', 'from', 'to'] as const,
    defaultSort: 'createdAt:desc',
  });
  const list = useQuery({
    queryKey: qk.audit.list(table.params),
    queryFn: () => auditApi.list(table.params),
  });
  const { from, to } = table.filters;

  return (
    <>
      <PageHeader title={t.audit.title}>
        <Flex gap={8} wrap>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={t.audit.filterAction}
            value={table.filters.action as AuditAction | undefined}
            onChange={(v) => table.setFilter('action', v)}
            options={AuditAction.options.map((a) => ({ value: a, label: t.audit.actions[a] }))}
            style={{ width: 220 }}
          />
          <DatePicker.RangePicker
            format="DD/MM/YYYY"
            value={from && to ? [dayjs(from), dayjs(to)] : null}
            onChange={(dates) => {
              if (!dates || !dates[0] || !dates[1]) {
                table.setFilter('from', undefined);
                table.setFilter('to', undefined);
                return;
              }
              table.setFilter('from', toIsoDate(dates[0]));
              table.setFilter('to', toIsoDate(dates[1]));
            }}
          />
        </Flex>
      </PageHeader>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <DataTable<AuditLogView>
        columns={buildColumns()}
        data={list.data}
        loading={list.isFetching}
        page={table.page}
        pageSize={table.pageSize}
        sort={table.sort}
        onPageChange={table.setPage}
        onSortChange={table.setSort}
        expandable={{
          expandedRowRender: (log) => (
            <Flex gap={16} wrap>
              <JsonBlock label={t.audit.before} value={log.before} />
              <JsonBlock label={t.audit.after} value={log.after} />
            </Flex>
          ),
          rowExpandable: (log) => log.before !== null || log.after !== null,
        }}
      />
    </>
  );
}

export default AuditPage;
