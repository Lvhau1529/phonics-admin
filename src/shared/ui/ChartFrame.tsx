import { Spin } from 'antd';
import type { ReactNode } from 'react';
import { useDelayedLoading } from '@/shared/hooks/useDelayedLoading';
import { BlockSkeleton } from '@/shared/ui/Loading';

interface ChartFrameProps {
  loading: boolean;
  /** Đã có dữ liệu (kể cả dữ liệu cũ từ keepPreviousData) → giữ biểu đồ, chỉ phủ spinner mờ khi refetch */
  hasData: boolean;
  height?: number;
  children: ReactNode;
}

/**
 * Khung biểu đồ / khối thống kê chống nháy: lần tải đầu hiện skeleton đúng chiều cao khung; refetch sau đó giữ
 * nguyên nội dung cũ và chỉ phủ spinner sau 200 ms (useDelayedLoading) để phản hồi nhanh không chớp.
 */
export function ChartFrame({ loading, hasData, height = 280, children }: ChartFrameProps) {
  const spinning = useDelayedLoading(loading && hasData);
  if (loading && !hasData) return <BlockSkeleton height={height} />;
  return (
    <Spin spinning={spinning} delay={0}>
      {children}
    </Spin>
  );
}
