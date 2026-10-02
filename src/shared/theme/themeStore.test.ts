import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from '@/shared/config';
import {
  DEFAULT_THEME,
  getThemeMode,
  resetThemeForTest,
  setThemeMode,
  subscribeTheme,
} from '@/shared/theme/themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetThemeForTest();
  });
  afterEach(() => {
    localStorage.clear();
    resetThemeForTest();
  });

  it('mặc định là tối khi chưa chọn (bỏ qua giá trị lạ như "system" của bản cũ)', () => {
    expect(DEFAULT_THEME).toBe('dark');
    expect(getThemeMode()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    localStorage.setItem(THEME_STORAGE_KEY, 'system');
    resetThemeForTest();
    expect(getThemeMode()).toBe('dark');
  });

  it('setThemeMode lưu localStorage, gắn data-theme và phát sự kiện', () => {
    let calls = 0;
    const unsubscribe = subscribeTheme(() => calls++);
    setThemeMode('light');
    expect(getThemeMode()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(calls).toBe(1);

    setThemeMode('light'); // không đổi → không phát
    expect(calls).toBe(1);

    setThemeMode('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    unsubscribe();
  });
});
