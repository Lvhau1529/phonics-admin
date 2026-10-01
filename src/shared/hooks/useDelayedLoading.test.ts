import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDelayedLoading } from '@/shared/hooks/useDelayedLoading';

describe('useDelayedLoading', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('phản hồi nhanh hơn delay → không bao giờ hiện spinner', () => {
    const { result, rerender } = renderHook(({ loading }) => useDelayedLoading(loading), {
      initialProps: { loading: true },
    });
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(150));
    expect(result.current).toBe(false);
    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(false);
  });

  it('tải lâu → hiện sau delay, và giữ ≥ minDuration dù đã xong', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDelayedLoading(loading, { delay: 200, minDuration: 400 }),
      { initialProps: { loading: true } },
    );
    act(() => vi.advanceTimersByTime(199));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);

    // Xong ngay sau 50 ms hiển thị → vẫn giữ tới đủ 400 ms
    act(() => vi.advanceTimersByTime(50));
    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(349));
    expect(result.current).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  it('đã hiện quá minDuration → tắt ngay khi xong', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDelayedLoading(loading, { delay: 100, minDuration: 300 }),
      { initialProps: { loading: true } },
    );
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(true);
    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(0));
    expect(result.current).toBe(false);
  });

  it('refetch lại trong lúc đang giữ minDuration → tiếp tục hiện, không chớp', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDelayedLoading(loading, { delay: 100, minDuration: 300 }),
      { initialProps: { loading: true } },
    );
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe(true);
    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(100));
    rerender({ loading: true });
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe(true);
    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(0));
    expect(result.current).toBe(false);
  });
});
