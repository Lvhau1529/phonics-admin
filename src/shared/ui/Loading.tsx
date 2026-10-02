import { Flex, Skeleton, Spin, theme, Typography } from 'antd';
import { t } from '@/shared/i18n';
import { THEME_COLORS } from '@/shared/theme/theme';
import { useThemeMode } from '@/shared/theme/themeStore';
import { BrandMark } from '@/shared/ui/BrandMark';

/**
 * Loading của app: lần tải đầu dùng **skeleton** đúng hình nội dung (trang, bảng, biểu đồ), còn tải lại /
 * khôi phục phiên dùng spinner `Spin` mặc định của antd. Không dùng animation nặng (Lottie).
 */

/** Màn chờ toàn trang (HydrateFallback, khôi phục phiên): logo + spinner + chữ tuỳ chọn */
export function FullscreenLoader({ label }: { label?: string }) {
  const c = THEME_COLORS[useThemeMode()];
  return (
    <Flex
      vertical
      align="center"
      justify="center"
      gap={20}
      role="status"
      aria-label={label ?? t.common.loadingAlt}
      style={{ minHeight: '100vh', background: c.bgLayout }}
    >
      <BrandMark size={56} />
      <Spin />
      {label && <Typography.Text type="secondary">{label}</Typography.Text>}
    </Flex>
  );
}

/** Skeleton một trang danh sách (fallback Suspense khi tải trang lazy): tiêu đề + bộ lọc + bảng */
export function PageSkeleton() {
  return (
    <Flex vertical gap={16} role="status" aria-label={t.common.loadingAlt}>
      <Flex justify="space-between" align="center">
        <Skeleton.Input active style={{ width: 220, height: 32 }} />
        <Skeleton.Button active style={{ width: 130 }} />
      </Flex>
      <Flex gap={8} wrap>
        <Skeleton.Input active style={{ width: 260 }} />
        <Skeleton.Input active style={{ width: 150 }} />
        <Skeleton.Input active style={{ width: 220 }} />
      </Flex>
      <TableSkeleton rows={8} />
    </Flex>
  );
}

/** Khung bảng giả: hàng header + `rows` hàng ô xám nhấp nháy */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  const { token } = theme.useToken();
  return (
    <div
      style={{ background: token.colorBgContainer, borderRadius: token.borderRadiusLG, overflow: 'hidden' }}
    >
      <div
        style={{
          padding: '14px 16px',
          background: token.colorFillQuaternary,
          borderBottom: `1px solid ${token.colorSplit}`,
        }}
      >
        <Skeleton.Input active size="small" block style={{ height: 16 }} />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          style={{
            padding: '14px 16px',
            borderBottom: i < rows - 1 ? `1px solid ${token.colorSplit}` : undefined,
          }}
        >
          <Skeleton.Input active size="small" block style={{ height: 16 }} />
        </div>
      ))}
    </div>
  );
}

/** Khối giả cho biểu đồ / vùng nội dung có chiều cao cố định */
export function BlockSkeleton({ height = 240 }: { height?: number | string }) {
  return (
    <div role="status" aria-label={t.common.loadingAlt} style={{ height }}>
      <Skeleton.Input active block style={{ height: '100%' }} />
    </div>
  );
}
