import { Empty, Flex, Spin, Typography, type SelectProps } from 'antd';
import { t } from '@/shared/i18n';
import { SelectOptionsSkeleton } from '@/shared/ui/Loading';

/**
 * Loading cho ô chọn tìm phía server: chưa có kết quả → skeleton trong dropdown; đã có kết quả cũ mà đang tìm lại →
 * dòng "Đang tìm…" trên đầu danh sách; không có kết quả → Empty. Trải vào `<Select {...selectLoading(...)} />`.
 */
export function selectLoading(
  fetching: boolean,
  hasOptions: boolean,
): Pick<SelectProps, 'loading' | 'notFoundContent' | 'popupRender'> {
  return {
    loading: fetching,
    notFoundContent: fetching ? (
      <SelectOptionsSkeleton />
    ) : (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.common.noMatches} />
    ),
    popupRender: (menu) => (
      <>
        {fetching && hasOptions && (
          <Flex gap={8} align="center" style={{ padding: '6px 12px' }}>
            <Spin size="small" />
            <Typography.Text type="secondary">{t.common.searching}</Typography.Text>
          </Flex>
        )}
        {menu}
      </>
    ),
  };
}
