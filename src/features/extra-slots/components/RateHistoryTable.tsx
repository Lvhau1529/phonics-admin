import { EditOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ExtraRateModel, RateState } from '@/features/extra-slots/models/ExtraSlotModel';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { formatDate, formatDateTime } from '@/shared/utils/format';

const STATE_COLOR: Record<RateState, string | undefined> = {
  current: 'green',
  upcoming: 'blue',
  ended: undefined,
  superseded: 'default',
};

function stateLabel(state: RateState): string {
  return t.extraSlots[state];
}

function buildColumns(
  onEdit?: (rate: ExtraRateModel) => void,
  onEnd?: (rate: ExtraRateModel) => void,
): ColumnsType<ExtraRateModel> {
  const columns: ColumnsType<ExtraRateModel> = [
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
  if (onEdit || onEnd)
    columns.push({
      title: t.common.actions,
      key: 'actions',
      render: (_, r) =>
        r.state !== 'superseded' && (
          <Space size={4}>
            {onEdit && (
              <Tooltip title={t.extraSlots.editPrice}>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  aria-label={t.extraSlots.editPrice}
                  onClick={() => onEdit(r)}
                />
              </Tooltip>
            )}
            {onEnd && r.canEnd && (
              <Tooltip title={t.extraSlots.endRate}>
                <Button
                  size="small"
                  icon={<StopOutlined />}
                  aria-label={t.extraSlots.endRate}
                  onClick={() => onEnd(r)}
                />
              </Tooltip>
            )}
          </Space>
        ),
    });
  return columns;
}

/**
 * Lịch sử đơn giá (mới nhất trước — server sắp xếp); dòng bị thay thế từ đầu gạch ngang. `onEdit` (người có quyền đặt
 * giá) thêm nút sửa giá cho dòng còn ngày hiệu lực; `onEnd` thêm nút kết thúc cho giá riêng học sinh chưa hết.
 */
export function RateHistoryTable({
  rates,
  loading,
  emptyText = t.extraSlots.noPrice,
  onEdit,
  onEnd,
}: {
  rates: ExtraRateModel[] | undefined;
  loading?: boolean;
  emptyText?: string;
  onEdit?: (rate: ExtraRateModel) => void;
  onEnd?: (rate: ExtraRateModel) => void;
}) {
  return (
    <DataTable.Static<ExtraRateModel>
      rowKey="id"
      size="small"
      loading={loading}
      columns={buildColumns(onEdit, onEnd)}
      dataSource={rates}
      pagination={false}
      locale={{ emptyText }}
    />
  );
}
