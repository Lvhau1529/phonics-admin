import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from '@/shared/config';
import {
  getResolvedTheme,
  getThemePreference,
  resolveTheme,
  setThemePreference,
  subscribeTheme,
} from '@/shared/theme/themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setThemePreference('system');
  });
  afterEach(() => {
    localStorage.clear();
    setThemePreference('system');
  });

  it("'system' resolve theo matchMedia (jsdom: không dark) và không lưu localStorage", () => {
    expect(getThemePreference()).toBe('system');
    expect(resolveTheme('system')).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('setThemePreference lưu localStorage, gắn data-theme và phát sự kiện', () => {
    let calls = 0;
    const unsubscribe = subscribeTheme(() => calls++);
    setThemePreference('dark');
    expect(getResolvedTheme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(calls).toBe(1);

    setThemePreference('dark'); // không đổi → không phát
    expect(calls).toBe(1);

    setThemePreference('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    unsubscribe();
  });
});
