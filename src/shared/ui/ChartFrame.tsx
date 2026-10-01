import { Spin } from 'antd';
import type { ReactNode } from 'react';
import { useDelayedLoading } from '@/shared/hooks/useDelayedLoading';
import { CenteredLoader, LottieLoader } from '@/shared/ui/LottieLoader';

interface ChartFrameProps {
  loading: boolean;
  /** Đã có dữ liệu (kể cả dữ liệu cũ từ keepPreviousData) → giữ biểu đồ, chỉ phủ spinner mờ khi refetch */
  hasData: boolean;
  height?: number;
  children: ReactNode;
}

/**
 * Khung biểu đồ / khối thống kê chống nháy: lần tải đầu hiện loader Lottie giữa khung; refetch sau đó giữ
 * nguyên nội dung cũ và chỉ phủ spinner sau 200 ms (useDelayedLoading) để phản hồi nhanh không chớp.
 */
export function ChartFrame({ loading, hasData, height = 280, children }: ChartFrameProps) {
  const spinning = useDelayedLoading(loading && hasData);
  if (loading && !hasData) return <CenteredLoader minHeight={height} />;
  return (
    <Spin spinning={spinning} indicator={<LottieLoader size={40} indicator />} delay={0}>
      {children}
    </Spin>
  );
}
