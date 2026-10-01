import { useEffect, useRef, useState } from 'react';

export interface DelayedLoadingOptions {
  /** Chỉ hiện spinner nếu vẫn đang tải sau `delay` ms (phản hồi nhanh → không nháy) */
  delay?: number;
  /** Đã hiện thì giữ ít nhất `minDuration` ms để không chớp tắt */
  minDuration?: number;
}

/**
 * Chống nháy spinner: `loading` phải kéo dài quá `delay` mới hiện, và khi đã hiện thì giữ tối thiểu
 * `minDuration`. Dùng cho bảng / biểu đồ đang refetch (dữ liệu cũ vẫn hiển thị nhờ keepPreviousData).
 */
export function useDelayedLoading(
  loading: boolean,
  { delay = 200, minDuration = 400 }: DelayedLoadingOptions = {},
): boolean {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    if (loading) {
      if (shownAt.current !== null) return; // đang hiện rồi
      const timer = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }
    // loading = false: chưa kịp hiện thì thôi; đã hiện thì chờ đủ minDuration
    if (shownAt.current === null) return;
    const elapsed = Date.now() - shownAt.current;
    const remaining = Math.max(0, minDuration - elapsed);
    const timer = setTimeout(() => {
      shownAt.current = null;
      setVisible(false);
    }, remaining);
    return () => clearTimeout(timer);
  }, [loading, delay, minDuration]);

  return visible;
}
