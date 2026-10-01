/**
 * Chế độ giao diện: 'light' | 'dark' | 'system' (theo `prefers-color-scheme`), lưu localStorage
 * `phonics-admin:theme`. Chế độ đã resolve ('light' | 'dark') được gắn vào `<html data-theme>` để CSS ngoài
 * antd (vd. màu nền body) theo kịp; Providers đọc `useResolvedTheme()` để dựng `buildTheme(mode)`.
 */
import { useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from '@/shared/config';
import type { ThemeMode } from '@/shared/theme';

export type ThemePreference = ThemeMode | 'system';

const PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];
const DARK_QUERY = '(prefers-color-scheme: dark)';

const listeners = new Set<() => void>();

function readStorage(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return PREFERENCES.includes(raw as ThemePreference) ? (raw as ThemePreference) : 'system';
  } catch {
    return 'system';
  }
}

function writeStorage(pref: ThemePreference): void {
  try {
    if (pref === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Chế độ riêng tư / hết quota: chỉ sống trong phiên này
  }
}

const systemPrefersDark = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY).matches
    : false;

let preference: ThemePreference = readStorage();

/** Chế độ đã resolve theo tuỳ chọn + hệ điều hành */
export const resolveTheme = (pref: ThemePreference): ThemeMode =>
  pref === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : pref;

function applyDom(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
}

function emit(): void {
  applyDom(resolveTheme(preference));
  for (const listener of listeners) listener();
}

export const getThemePreference = (): ThemePreference => preference;
export const getResolvedTheme = (): ThemeMode => resolveTheme(preference);

export function setThemePreference(next: ThemePreference): void {
  if (next === preference) return;
  preference = next;
  writeStorage(next);
  emit();
}

/** Theo dõi đổi theme (và đổi `prefers-color-scheme` của hệ điều hành khi đang ở 'system') */
export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  const media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(DARK_QUERY)
      : null;
  const onMedia = () => {
    if (preference === 'system') emit();
  };
  media?.addEventListener?.('change', onMedia);
  return () => {
    listeners.delete(listener);
    media?.removeEventListener?.('change', onMedia);
  };
}

/** Tuỳ chọn người dùng chọn (light / dark / system) */
export const useThemePreference = (): ThemePreference =>
  useSyncExternalStore(subscribeTheme, getThemePreference, getThemePreference);

/** Chế độ thực tế đang hiển thị */
export const useResolvedTheme = (): ThemeMode =>
  useSyncExternalStore(subscribeTheme, getResolvedTheme, () => 'light');

// Gắn data-theme ngay khi module nạp để tránh nháy màu trước render đầu
applyDom(resolveTheme(preference));
