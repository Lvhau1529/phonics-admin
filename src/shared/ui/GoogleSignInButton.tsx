/**
 * Nút Google chính thức (Google Identity Services): nạp script khi nút hiện, trả ID token qua `onCredential`.
 * Không có VITE_GOOGLE_CLIENT_ID thì không hiện gì. Vẽ lại khi đổi ngôn ngữ / giao diện sáng tối (giữ nút cũ tới khi
 * nút mới tải xong).
 */
import { Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '@/shared/config';
import { loadGis } from '@/shared/google/loadGis';
import { t, useLang } from '@/shared/i18n';
import { ThemeMode } from '@/shared/theme/theme';
import { useThemeMode } from '@/shared/theme/themeStore';

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void;
  /** Chữ trên nút: đăng nhập (mặc định) hoặc tiếp tục (liên kết ở trang hồ sơ) */
  text?: 'signin_with' | 'continue_with';
  disabled?: boolean;
  /** px, GIS giới hạn 200–400 */
  width?: number;
}

export function GoogleSignInButton({
  onCredential,
  text = 'signin_with',
  disabled = false,
  width = 356,
}: GoogleSignInButtonProps) {
  const host = useRef<HTMLDivElement>(null);
  // Google giữ callback từ lúc initialize: trỏ qua ref để luôn gọi bản mới nhất
  const callback = useRef(onCredential);
  useEffect(() => {
    callback.current = onCredential;
  });
  const [failed, setFailed] = useState(false);
  const lang = useLang();
  const mode = useThemeMode();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    let active = true;
    let fallback: number | undefined;
    loadGis()
      .then(() => {
        if (!active || !host.current) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => callback.current(credential),
          ux_mode: 'popup',
          itp_support: true,
        });
        // Vẽ nút mới vào lớp ẩn chồng lên nút cũ, đợi iframe tải xong mới đổi → không bị khoảng trống / nháy
        const hostEl = host.current;
        const layer = document.createElement('div');
        layer.style.cssText = 'position:absolute;inset:0;display:flex;justify-content:center;opacity:0;pointer-events:none';
        hostEl.append(layer);
        google.accounts.id.renderButton(layer, {
          type: 'standard',
          theme: mode === ThemeMode.DARK ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          width,
          locale: lang,
        });
        const reveal = () => {
          if (!active || !layer.isConnected) return;
          layer.style.cssText = 'display:flex;justify-content:center';
          for (const child of [...hostEl.children]) if (child !== layer) child.remove();
        };
        const iframe = layer.querySelector('iframe');
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
  }, [lang, mode, text, width]);

  if (!GOOGLE_CLIENT_ID) return null;
  if (failed) return <Typography.Text type="secondary">{t.auth.googleUnavailable}</Typography.Text>;
  return (
    <div
      ref={host}
      inert={disabled ? true : undefined}
      style={{
        position: 'relative',
        minHeight: 40,
        opacity: disabled ? 0.6 : 1,
        // iframe GIS luôn là light: nếu trang đang dark mà để lệch color-scheme, Chrome tô nền iframe trắng đục
        // → viền trắng quanh nút bo góc. Đồng bộ 'light' để nền iframe trong suốt.
        colorScheme: 'light',
      }}
    />
  );
}
