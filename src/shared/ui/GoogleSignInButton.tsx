/**
 * Nút Google chính thức (Google Identity Services): nạp script khi nút hiện, trả ID token qua `onCredential`.
 * Không có VITE_GOOGLE_CLIENT_ID thì không hiện gì.
 *
 * Chống nháy khi đổi sáng / tối: vẽ sẵn **cả hai** biến thể (filled_black + outline) chồng lên nhau, đổi theme chỉ
 * bật / tắt lớp tương ứng — không tải lại iframe GIS (tải lại mất ~0,5–1 s, trong lúc đó nút cũ lệch màu với trang).
 * Bề ngang theo khung chứa (GIS chỉ nhận px cố định 200–400) → trên mobile nút không tràn ra mép thẻ.
 */
import { Typography } from 'antd';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '@/shared/config';
import { initGis, loadGis } from '@/shared/google/loadGis';
import { t, useLang } from '@/shared/i18n';
import { ThemeMode } from '@/shared/theme/theme';
import { useThemeMode } from '@/shared/theme/themeStore';

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void;
  /** Chữ trên nút: đăng nhập (mặc định) hoặc tiếp tục (liên kết ở trang hồ sơ) */
  text?: 'signin_with' | 'continue_with';
  disabled?: boolean;
  /** Bề ngang tối đa (px); thực tế = min(maxWidth, bề ngang khung chứa), kẹp trong 200–400 theo giới hạn GIS */
  maxWidth?: number;
}

const GIS_MIN_WIDTH = 200;
const GIS_MAX_WIDTH = 400;
/** Bỏ qua thay đổi bề ngang nhỏ (thanh cuộn hiện / ẩn) để không vẽ lại iframe vô ích */
const WIDTH_STEP = 8;
const GIS_THEME = { [ThemeMode.DARK]: 'filled_black', [ThemeMode.LIGHT]: 'outline' } as const;
const MODES = Object.values(ThemeMode);

const clampWidth = (available: number, max: number) =>
  Math.round(Math.max(GIS_MIN_WIDTH, Math.min(available, max, GIS_MAX_WIDTH)));

/** Hiện lớp đúng theme, ẩn lớp còn lại (vẫn giữ trong DOM để đổi tức thì) */
function showMode(set: HTMLElement | null, mode: ThemeMode): void {
  if (!set) return;
  for (const layer of set.children) {
    const active = (layer as HTMLElement).dataset.mode === mode;
    (layer as HTMLElement).style.cssText = active
      ? 'display:flex;justify-content:center'
      : 'position:absolute;inset:0;display:flex;justify-content:center;visibility:hidden;pointer-events:none';
  }
}

export function GoogleSignInButton({
  onCredential,
  text = 'signin_with',
  disabled = false,
  maxWidth = GIS_MAX_WIDTH,
}: GoogleSignInButtonProps) {
  const host = useRef<HTMLDivElement>(null);
  /** Bộ nút đang hiển thị (hai lớp theme) */
  const current = useRef<HTMLDivElement | null>(null);
  // GIS giữ callback từ lúc initialize: trỏ qua ref để luôn gọi bản mới nhất
  const callback = useRef(onCredential);
  useEffect(() => {
    callback.current = onCredential;
  });
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState<number | null>(null);
  const lang = useLang();
  const mode = useThemeMode();
  const modeRef = useRef(mode);

  // Đo khung chứa trước khi vẽ nút; theo dõi xoay màn hình / đổi cỡ cửa sổ
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    const measure = () => {
      const next = clampWidth(el.clientWidth, maxWidth);
      setWidth((prev) => (prev !== null && Math.abs(prev - next) < WIDTH_STEP ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxWidth]);

  // Đổi theme: chỉ bật / tắt lớp, không chạm tới GIS
  useLayoutEffect(() => {
    modeRef.current = mode;
    showMode(current.current, mode);
  }, [mode]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || width === null) return undefined;
    let active = true;
    let fallback: number | undefined;
    loadGis()
      .then(() => {
        const hostEl = host.current;
        if (!active || !hostEl) return;
        initGis(GOOGLE_CLIENT_ID, (credential) => callback.current(credential));
        // Bộ nút mới vẽ ở lớp ẩn chồng lên bộ cũ; iframe đúng theme tải xong mới thay → không khoảng trống / nháy
        const set = document.createElement('div');
        set.style.cssText = 'position:absolute;inset:0;opacity:0;pointer-events:none';
        for (const m of MODES) {
          const layer = document.createElement('div');
          layer.dataset.mode = m;
          set.append(layer);
          google.accounts.id.renderButton(layer, {
            type: 'standard',
            theme: GIS_THEME[m],
            size: 'large',
            shape: 'rectangular',
            text,
            width,
            locale: lang,
          });
        }
        hostEl.append(set);
        const reveal = () => {
          if (!active || !set.isConnected) return;
          set.style.cssText = 'position:relative';
          showMode(set, modeRef.current);
          for (const child of [...hostEl.children]) if (child !== set) child.remove();
          current.current = set;
        };
        const iframe = set.querySelector<HTMLIFrameElement>(`[data-mode="${modeRef.current}"] iframe`);
        if (iframe) {
          iframe.addEventListener('load', reveal, { once: true });
          fallback = window.setTimeout(reveal, 1500);
        } else {
          reveal();
        }
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
      window.clearTimeout(fallback);
    };
  }, [lang, text, width]);

  if (!GOOGLE_CLIENT_ID) return null;
  if (failed) return <Typography.Text type="secondary">{t.auth.googleUnavailable}</Typography.Text>;
  return (
    <div
      ref={host}
      inert={disabled ? true : undefined}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth,
        minHeight: 40,
        opacity: disabled ? 0.6 : 1,
        // iframe GIS luôn là light: nếu trang đang dark mà để lệch color-scheme, Chrome tô nền iframe trắng đục
        // → viền trắng quanh nút bo góc. Đồng bộ 'light' để nền iframe trong suốt.
        colorScheme: 'light',
      }}
    />
  );
}
