/**
 * Chế độ giao diện: 'light' | 'dark', mặc định **tối**; lựa chọn lưu localStorage `phonics-admin:theme`. Chế độ
 * được gắn vào `<html data-theme>` để CSS ngoài antd (vd. màu nền body) theo kịp; Providers đọc `useThemeMode()`
 * để dựng `buildTheme(mode)`.
 */
import { useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from '@/shared/config';
import type { ThemeMode } from '@/shared/theme/theme';

export const DEFAULT_THEME: ThemeMode = 'dark';

const MODES: readonly ThemeMode[] = ['light', 'dark'];

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

export function setThemeMode(next: ThemeMode): void {
  if (next === current) return;
  current = next;
  writeStorage(next);
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
