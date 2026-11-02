import { Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ExtraRateModel, RateState } from '@/features/extra-slots/models/ExtraSlotModel';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { formatDate, formatDateTime } from '@/shared/utils/format';

const STATE_COLOR: Record<RateState, string | undefined> = {
  current: 'green',
  ended: undefined,
  superseded: 'default',
};

function stateLabel(state: RateState): string {
  if (state === 'current') return t.extraSlots.current;
  return state === 'superseded' ? t.extraSlots.superseded : t.extraSlots.ended;
}

function buildColumns(): ColumnsType<ExtraRateModel> {
  return [
    {
      title: t.extraSlots.price,
      key: 'price',
      render: (_, r) => (
        <Typography.Text strong={r.state === 'current'} delete={r.state === 'superseded'}>
          {r.priceText}
        </Typography.Text>
      ),
    },
    { title: t.extraSlots.effectiveFrom, key: 'from', render: (_, r) => formatDate(r.effectiveFrom) },
    {
      title: t.extraSlots.effectiveTo,
      key: 'to',
      render: (_, r) =>
        r.state === 'superseded' || !r.effectiveTo ? t.common.none : formatDate(r.effectiveTo),
    },
    {
      title: t.common.status,
      key: 'state',
      render: (_, r) => <Tag color={STATE_COLOR[r.state]}>{stateLabel(r.state)}</Tag>,
    },
    {
      title: t.extraSlots.createdBy,
      key: 'createdBy',
      render: (_, r) => (
        <>
          {r.createdBy?.displayName ?? t.common.none}
          <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
            {formatDateTime(r.createdAt)}
          </Typography.Text>
        </>
      ),
    },
    { title: t.common.note, dataIndex: 'note', render: (note: string | null) => note ?? t.common.none },
  ];
}

/** Lịch sử đơn giá (mới nhất trước — server sắp xếp); dòng bị thay thế từ đầu gạch ngang */
export function RateHistoryTable({
  rates,
  loading,
  emptyText = t.extraSlots.noPrice,
}: {
  rates: ExtraRateModel[] | undefined;
  loading?: boolean;
  emptyText?: string;
}) {
  return (
    <DataTable.Static<ExtraRateModel>
      rowKey="id"
      size="small"
      loading={loading}
      columns={buildColumns()}
      dataSource={rates}
      pagination={false}
      locale={{ emptyText }}
    />
  );
}
