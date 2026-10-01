import { Table, type TableProps } from 'antd';
import type { ColumnsType, SorterResult } from 'antd/es/table/interface';
import type { Paginated } from '@phonics/contracts';
import { useMemo } from 'react';
import { useDelayedLoading } from '@/shared/hooks/useDelayedLoading';
import { t } from '@/shared/i18n';
import { LottieLoader } from '@/shared/ui/LottieLoader';

export interface DataTableProps<T extends { id: string }> extends Omit<
  TableProps<T>,
  'dataSource' | 'pagination' | 'onChange' | 'columns' | 'rowKey' | 'loading'
> {
  columns: ColumnsType<T>;
  /** Trang dữ liệu từ API; undefined khi đang tải lần đầu */
  data: Paginated<T> | undefined;
  /** Đang tải / refetch — spinner chỉ hiện sau 200 ms và giữ ≥ 400 ms (chống nháy) */
  loading?: boolean;
  page: number;
  pageSize: number;
  /** `field:asc|desc` hiện tại — cột có `sorter: true` và `key` trùng field sẽ hiện mũi tên */
  sort?: string;
  onPageChange: (page: number, pageSize: number) => void;
  onSortChange?: (sort: string | undefined) => void;
}

/** Tách `field:dir` → antd sortOrder */
function parseSort(sort: string | undefined): { field: string; order: 'ascend' | 'descend' } | undefined {
  if (!sort) return undefined;
  const [field, dir] = sort.split(':');
  return { field, order: dir === 'asc' ? 'ascend' : 'descend' };
}

/** Prop `loading` của antd Table với chỉ báo Lottie, đã qua useDelayedLoading */
function useTableLoading(loading: boolean | undefined): TableProps<never>['loading'] {
  const spinning = useDelayedLoading(!!loading);
  return useMemo(() => ({ spinning, indicator: <LottieLoader size={40} indicator />, delay: 0 }), [spinning]);
}

/**
 * Bảng phân trang phía server: nhận `Paginated<T>`, `rowKey='id'`, đổi trang / sort gọi callback
 * (kết hợp với useTableQuery để đồng bộ URL). Cột muốn sort server đặt `key` = tên field + `sorter: true`.
 * Dữ liệu cũ giữ nguyên khi refetch (keepPreviousData) — chỉ phủ spinner sau một khoảng trễ.
 */
export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  page,
  pageSize,
  sort,
  onPageChange,
  onSortChange,
  ...rest
}: DataTableProps<T>) {
  const current = parseSort(sort);
  const tableLoading = useTableLoading(loading);

  // Gắn sortOrder điều khiển để mũi tên khớp URL
  const controlledColumns = useMemo<ColumnsType<T>>(
    () =>
      columns.map((col) =>
        col.sorter
          ? { ...col, sortOrder: current && String(col.key) === current.field ? current.order : null }
          : col,
      ),
    [columns, current],
  );

  const handleChange: TableProps<T>['onChange'] = (pagination, _filters, sorter, extra) => {
    if (extra.action === 'sort' && onSortChange) {
      const single = (Array.isArray(sorter) ? sorter[0] : sorter) as SorterResult<T> | undefined;
      const field = single?.columnKey ?? single?.field;
      if (single?.order && field)
        onSortChange(`${String(field)}:${single.order === 'ascend' ? 'asc' : 'desc'}`);
      else onSortChange(undefined);
      return;
    }
    if (extra.action === 'paginate') onPageChange(pagination.current ?? 1, pagination.pageSize ?? pageSize);
  };

  return (
    <Table<T>
      rowKey="id"
      size="middle"
      scroll={{ x: 'max-content' }}
      {...rest}
      loading={tableLoading}
      columns={controlledColumns}
      dataSource={data?.items}
      onChange={handleChange}
      pagination={{
        current: page,
        pageSize,
        total: data?.total ?? 0,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (total, range) => t.common.pageTotal([range[0], range[1]], total),
      }}
    />
  );
}

export interface StaticTableProps<T> extends Omit<TableProps<T>, 'loading'> {
  loading?: boolean;
}

/** antd Table thường (không phân trang server) nhưng dùng cùng chỉ báo Lottie + chống nháy */
function StaticTable<T extends object>({ loading, ...rest }: StaticTableProps<T>) {
  const tableLoading = useTableLoading(loading);
  return <Table<T> size="middle" {...rest} loading={tableLoading} />;
}

DataTable.Static = StaticTable;
