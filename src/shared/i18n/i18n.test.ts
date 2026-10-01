import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LANG_STORAGE_KEY } from '@/shared/config';
import { en } from '@/shared/i18n/en';
import { detectLang, getLang, resetLangForTest, setLang, subscribeLang } from '@/shared/i18n/langStore';
import { vi } from '@/shared/i18n/vi';
import { dictionaries, t } from '@/shared/i18n';

/** Liệt kê đường dẫn khoá dạng `a.b.c` kèm kiểu (string / function) để so hai từ điển */
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') out.push(...keyPaths(value as Record<string, unknown>, path));
    else out.push(`${path}:${typeof value}`);
  }
  return out.sort();
}

describe('từ điển vi / en', () => {
  it('có cùng tập khoá và cùng kiểu giá trị', () => {
    expect(keyPaths(en)).toEqual(keyPaths(vi));
  });

  it('không có chuỗi rỗng', () => {
    const empty = (obj: Record<string, unknown>, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        v && typeof v === 'object'
          ? empty(v as Record<string, unknown>, `${prefix}${k}.`)
          : typeof v === 'string' && v.trim() === ''
            ? [`${prefix}${k}`]
            : [],
      );
    expect(empty(vi)).toEqual([]);
    expect(empty(en)).toEqual([]);
  });

  it('hàm định dạng nhận cùng tham số', () => {
    expect(vi.app.title('X')).toContain('X');
    expect(en.app.title('X')).toContain('X');
    expect(en.common.pageTotal([1, 20], 55)).toBe('1–20 of 55');
    expect(vi.common.pageTotal([1, 20], 55)).toBe('1–20 / 55');
  });
});

describe('langStore + Proxy t', () => {
  beforeEach(() => {
    localStorage.clear();
    resetLangForTest();
  });
  afterEach(() => {
    localStorage.clear();
    resetLangForTest();
  });

  it('detectLang: vi-VN → vi, còn lại → en', () => {
    expect(detectLang('vi-VN')).toBe('vi');
    expect(detectLang('vi')).toBe('vi');
    expect(detectLang('en-US')).toBe('en');
    expect(detectLang('fr')).toBe('en');
    expect(detectLang(undefined)).toBe('en');
  });

  it('setLang lưu localStorage, phát sự kiện và t đọc từ điển mới', () => {
    setLang('vi'); // jsdom: navigator.language = en-US → bắt đầu từ vi cho chắc
    const seen: string[] = [];
    const unsubscribe = subscribeLang(() => seen.push(getLang()));

    setLang('en');
    expect(getLang()).toBe('en');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en');
    expect(t.nav.dashboard).toBe(en.nav.dashboard);
    expect(t.format.numberLocale).toBe('en-US');

    setLang('vi');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('vi');
    expect(t.nav.dashboard).toBe(vi.nav.dashboard);
    expect(seen).toEqual(['en', 'vi']);

    setLang('vi'); // không đổi → không phát
    expect(seen).toEqual(['en', 'vi']);
    unsubscribe();
  });

  it('khởi động đọc lại ngôn ngữ đã lưu; giá trị lạ bị bỏ qua', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'en');
    resetLangForTest();
    expect(getLang()).toBe('en');

    localStorage.setItem(LANG_STORAGE_KEY, 'xx');
    resetLangForTest();
    expect(getLang()).toBe(detectLang(navigator.language));
  });

  it('Proxy t hỗ trợ Object.keys / in', () => {
    expect(Object.keys(t)).toEqual(Object.keys(dictionaries[getLang()]));
    expect('nav' in t).toBe(true);
  });
});
