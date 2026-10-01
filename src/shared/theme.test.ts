import { describe, expect, it } from 'vitest';
import { buildTheme, THEME_COLORS, type ThemeMode } from '@/shared/theme';
import { contrastRatio, hexToRgb, relativeLuminance } from '@/shared/utils/contrast';

describe('contrast (WCAG)', () => {
  it('tính đúng các giá trị chuẩn', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 2);
    expect(() => hexToRgb('#12')).toThrow();
  });
});

describe.each<ThemeMode>(['light', 'dark'])('buildTheme(%s) — tương phản', (mode) => {
  const config = buildTheme(mode);
  const token = config.token!;
  const colors = THEME_COLORS[mode];

  it('chữ trên nút primary (colorTextLightSolid / colorPrimary) ≥ 4.5', () => {
    expect(token.colorTextLightSolid).toBe(colors.onPrimary);
    expect(token.colorPrimary).toBe(colors.primary);
    expect(contrastRatio(token.colorTextLightSolid!, token.colorPrimary!)).toBeGreaterThanOrEqual(4.5);
    // Hover / active vẫn đọc được
    expect(contrastRatio(token.colorTextLightSolid!, token.colorPrimaryHover!)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(token.colorTextLightSolid!, token.colorPrimaryActive!)).toBeGreaterThanOrEqual(4.5);
  });

  it('link trên nền container ≥ 4.5 (và trên nền layout)', () => {
    expect(contrastRatio(token.colorLink!, token.colorBgContainer!)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(token.colorLink!, token.colorBgLayout!)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(token.colorPrimaryText!, token.colorBgContainer!)).toBeGreaterThanOrEqual(4.5);
  });

  it('sider: chữ thường và mục đang chọn đủ tương phản', () => {
    expect(contrastRatio(colors.siderText, colors.sider)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(colors.siderSelectedText, colors.siderSelectedBg)).toBeGreaterThanOrEqual(7);
  });

  it('token chung: radius 8, font Inter, algorithm theo mode', () => {
    expect(token.borderRadius).toBe(8);
    expect(token.fontFamily).toMatch(/Inter/);
    expect(token.colorInfo).toBe(colors.primary);
    expect(config.algorithm).toBeDefined();
  });
});

describe('THEME_COLORS', () => {
  it('light: nút vàng chữ mực ≥ 7:1 (AAA), dark: honey', () => {
    expect(contrastRatio(THEME_COLORS.light.onPrimary, THEME_COLORS.light.primary)).toBeGreaterThanOrEqual(7);
    expect(THEME_COLORS.dark.primary).toBe('#ffc83d');
    expect(THEME_COLORS.light.bgLayout).toBe('#fffaf0');
  });
});
