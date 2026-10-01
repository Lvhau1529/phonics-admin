import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import type { AnimationItem, LottiePlayer } from 'lottie-web';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { t } from '@/shared/i18n';

/** Animation ba chấm nảy (120×60) ở public/lottie/loading.json — tải một lần, dùng chung cho mọi loader */
const LOTTIE_PATH = '/lottie/loading.json';
const ASPECT = 2; // 120 / 60

let loader: Promise<{ player: LottiePlayer; data: unknown }> | null = null;
/** Nạp player (lazy — tách chunk, và không chạy lúc import trong jsdom) + JSON animation; cache một lần */
function loadLottie(): Promise<{ player: LottiePlayer; data: unknown }> {
  loader ??= Promise.all([
    import('lottie-web/build/player/lottie_light').then((m) => m.default),
    fetch(LOTTIE_PATH).then((res) => {
      if (!res.ok) throw new Error(`lottie ${res.status}`);
      return res.json() as Promise<unknown>;
    }),
  ])
    .then(([player, data]) => ({ player, data }))
    .catch((error: unknown) => {
      loader = null; // lần sau thử lại
      throw error;
    });
  return loader;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface LottieLoaderProps {
  /** Chiều cao px (rộng = cao × 2) */
  size?: number;
  /**
   * Dùng làm `indicator` của antd Spin: antd gắn class `.ant-spin-dot` (absolute 50%/50%, margin -10px cho chấm
   * 20px) → render hộp 0×0 làm mốc và căn giữa nội dung bằng transform để không lệch với mọi kích thước.
   */
  indicator?: boolean;
  style?: CSSProperties;
  className?: string;
}

/**
 * Loader Lottie dùng toàn app (chỉ báo mặc định của Spin, HydrateFallback, Suspense, bảng…).
 * `prefers-reduced-motion` hoặc không tải được file → icon Spin tĩnh của antd.
 */
export function LottieLoader({ size = 48, indicator = false, style, className }: LottieLoaderProps) {
  const container = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(() => prefersReducedMotion() || typeof fetch === 'undefined');

  useEffect(() => {
    if (fallback) return;
    const el = container.current;
    if (!el) return;
    let item: AnimationItem | null = null;
    let cancelled = false;
    loadLottie()
      .then(({ player, data }) => {
        if (cancelled || !container.current) return;
        item = player.loadAnimation({
          container: container.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: data,
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true },
        });
      })
      .catch(() => {
        if (!cancelled) setFallback(true);
      });
    return () => {
      cancelled = true;
      item?.destroy();
    };
  }, [fallback]);

  const width = size * ASPECT;
  const outer: CSSProperties = indicator
    ? {
        display: 'inline-block',
        width: 0,
        height: 0,
        margin: 0,
        overflow: 'visible',
        lineHeight: 0,
        ...style,
      }
    : { display: 'inline-block', width, height: size, lineHeight: 0, ...style };
  const inner: CSSProperties = indicator
    ? { width, height: size, transform: 'translate(-50%, -50%)' }
    : { width: '100%', height: '100%' };

  return (
    <span className={className} role="status" aria-label={t.common.loadingAlt} style={outer}>
      {fallback ? (
        <div style={{ ...inner, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: Math.round(size * 0.6) }} />} />
        </div>
      ) : (
        <div ref={container} style={inner} />
      )}
    </span>
  );
}

/** Loader giữa khối nội dung (trang lazy, bootstrapping, tab) — kèm chữ tuỳ chọn */
export function CenteredLoader({ label, minHeight = 240 }: { label?: string; minHeight?: number | string }) {
  return (
    <div
      style={{
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <LottieLoader size={56} />
      {label && <span style={{ opacity: 0.65 }}>{label}</span>}
    </div>
  );
}
