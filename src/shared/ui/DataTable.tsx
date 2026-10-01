import { Table, type TableProps } from 'antd';
import type { ColumnsType, SorterResult } from 'antd/es/table/interface';
import type { Paginated } from '@phonics/contracts';
import { useMemo } from 'react';
import { t } from '@/shared/i18n/vi';

export interface DataTableProps<T extends { id: string }> extends Omit<
  TableProps<T>,
  'dataSource' | 'pagination' | 'onChange' | 'columns' | 'rowKey'
> {
  columns: ColumnsType<T>;
  /** Trang dữ liệu từ API; undefined khi đang tải lần đầu */
  data: Paginated<T> | undefined;
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

/**
 * Bảng phân trang phía server: nhận `Paginated<T>`, `rowKey='id'`, đổi trang / sort gọi callback
 * (kết hợp với useTableQuery để đồng bộ URL). Cột muốn sort server đặt `key` = tên field + `sorter: true`.
 */
export function DataTable<T extends { id: string }>({
  columns,
  data,
  page,
  pageSize,
  sort,
  onPageChange,
  onSortChange,
  ...rest
}: DataTableProps<T>) {
  const current = parseSort(sort);

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
