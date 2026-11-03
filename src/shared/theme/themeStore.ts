/**
 * Chế độ giao diện: 'light' | 'dark', mặc định **tối**; lựa chọn lưu localStorage `phonics-admin:theme`. Chế độ
 * được gắn vào `<html data-theme>` để CSS ngoài antd (vd. màu nền body) theo kịp; Providers đọc `useThemeMode()`
 * để dựng `buildTheme(mode)`.
 */
import { useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from '@/shared/config';
import { ThemeMode } from '@/shared/theme/theme';

export const DEFAULT_THEME: ThemeMode = ThemeMode.DARK;

const MODES: readonly ThemeMode[] = Object.values(ThemeMode);

const listeners = new Set<() => void>();

function readStorage(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return MODES.includes(raw as ThemeMode) ? (raw as ThemeMode) : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function writeStorage(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Chế độ riêng tư / hết quota: chỉ sống trong phiên này
  }
}

let current: ThemeMode = readStorage();

function applyDom(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
}

export const getThemeMode = (): ThemeMode => current;

/**
 * Tắt mọi CSS transition trong lúc đổi theme: component antd mỗi cái có `transition` riêng nên nếu để nguyên, màu
 * đổi lệch nhịp nhau → nháy. Bật lại sau hai frame (React đã commit + trình duyệt đã vẽ màu mới).
 */
function suppressTransitions(): void {
  if (typeof document === 'undefined' || typeof requestAnimationFrame === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = '*,*::before,*::after{transition:none!important;animation-duration:0s!important}';
  document.head.append(style);
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
}

export function setThemeMode(next: ThemeMode): void {
  if (next === current) return;
  current = next;
  writeStorage(next);
  suppressTransitions();
  applyDom(next);
  for (const listener of listeners) listener();
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Chế độ đang hiển thị (re-render khi đổi) */
export const useThemeMode = (): ThemeMode =>
  useSyncExternalStore(subscribeTheme, getThemeMode, () => DEFAULT_THEME);

/** Chỉ dùng trong test: đọc lại từ localStorage */
export function resetThemeForTest(): void {
  current = readStorage();
  applyDom(current);
  for (const listener of listeners) listener();
}

// Gắn data-theme ngay khi module nạp để tránh nháy màu trước render đầu
applyDom(current);
