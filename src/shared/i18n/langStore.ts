/**
 * Ngôn ngữ giao diện: 'vi' | 'en', lưu localStorage `phonics-admin:lang`; chưa chọn thì suy ra từ
 * `navigator.language` (tiếng Việt → vi, còn lại → en). Đổi ngôn ngữ → Providers remount cây React
 * (`key={lang}`) nên mọi `t.xxx` (Proxy đọc từ điển hiện tại) đều cập nhật.
 */
import { useSyncExternalStore } from 'react';
import { LANG_STORAGE_KEY } from '@/shared/config';

export type Lang = 'vi' | 'en';

export const LANGS: readonly Lang[] = ['vi', 'en'];

const isLang = (value: unknown): value is Lang => LANGS.includes(value as Lang);

/** Ngôn ngữ trình duyệt → Lang (vi-VN → vi; mọi thứ khác → en) */
export function detectLang(navigatorLanguage: string | undefined): Lang {
  return navigatorLanguage?.toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

function readStorage(): Lang | null {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY);
    return isLang(raw) ? raw : null;
  } catch {
    return null;
  }
}

function writeStorage(lang: Lang): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Chế độ riêng tư / hết quota: chỉ sống trong phiên này
  }
}

const initialLang = (): Lang =>
  readStorage() ?? detectLang(typeof navigator !== 'undefined' ? navigator.language : undefined);

let lang: Lang = initialLang();
const listeners = new Set<() => void>();

export const getLang = (): Lang => lang;

export function setLang(next: Lang): void {
  if (next === lang) return;
  lang = next;
  writeStorage(next);
  if (typeof document !== 'undefined') document.documentElement.lang = next;
  for (const listener of listeners) listener();
}

export function subscribeLang(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Hook đọc ngôn ngữ hiện tại (re-render khi đổi) */
export const useLang = (): Lang => useSyncExternalStore(subscribeLang, getLang, getLang);

/** Chỉ dùng trong test: đặt lại theo storage / navigator */
export function resetLangForTest(): void {
  lang = initialLang();
  for (const listener of listeners) listener();
}

if (typeof document !== 'undefined') document.documentElement.lang = lang;
