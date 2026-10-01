/**
 * Theme antd của Web Admin — vàng / cam trùng game (apps/game/src/platform/styles/tailwind.css), có dark mode.
 *
 * Nguyên tắc tương phản (kiểm tra trong theme.test.ts bằng utils/contrast):
 *  - Nút primary: nền vàng + CHỮ TỐI (`colorTextLightSolid` = mực arcade #2e1608) → ≥ 7:1.
 *  - Link / chữ màu primary (Tabs, Pagination, Button text): dùng hổ phách đậm hơn (`INK_AMBER`) vì vàng
 *    tươi trên nền trắng chỉ ~2.3:1; dark mode dùng vàng sáng trên nền nâu tối (> 12:1).
 *  - Checkbox / Radio: dấu tick màu mực thay vì trắng trên nền vàng.
 * Palette của game: gold #ffd23f, honey #ffc83d, orange #ffa62b, ink #2e1608, cream #fff4dc, paper #fffaf0,
 * wood #9a5a26, leaf #4cb034, purple #7a3bb8.
 */
import { theme as antdTheme, type ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

/** Màu game dùng lại trong admin */
export const GAME_COLORS = {
  gold: '#ffd23f',
  honey: '#ffc83d',
  orange: '#ffa62b',
  ink: '#2e1608',
  cream: '#fff4dc',
  paper: '#fffaf0',
  wood: '#9a5a26',
  leaf: '#4cb034',
  purple: '#7a3bb8',
} as const;

/** Token màu theo chế độ — export để test tương phản và cho component không qua ConfigProvider (login, chart) */
export const THEME_COLORS = {
  light: {
    /** Nền nút primary / viền focus */
    primary: '#E0A100',
    primaryHover: '#C98F00',
    primaryActive: '#B37F00',
    /** Chữ trên nền primary (nút, menu đang chọn) */
    onPrimary: GAME_COLORS.ink,
    /** Link + chữ màu primary trên nền sáng (≥ 4.5:1 trên trắng) */
    link: '#9A6B00',
    linkHover: '#7A5500',
    bgLayout: GAME_COLORS.paper,
    bgContainer: '#ffffff',
    bgElevated: '#ffffff',
    sider: GAME_COLORS.ink,
    siderSub: '#1f0e04',
    siderText: '#f5e6c8',
    siderSelectedBg: GAME_COLORS.honey,
    siderSelectedText: GAME_COLORS.ink,
    header: '#ffffff',
    headerBorder: GAME_COLORS.honey,
    /** Màu series biểu đồ (Recharts) theo thứ tự */
    chart: ['#E0A100', GAME_COLORS.purple, GAME_COLORS.leaf, '#3B82F6', '#EF4444', GAME_COLORS.orange],
  },
  dark: {
    primary: GAME_COLORS.honey,
    primaryHover: GAME_COLORS.gold,
    primaryActive: '#E0A100',
    onPrimary: GAME_COLORS.ink,
    link: '#ffd86a',
    linkHover: '#ffe48f',
    bgLayout: '#1a1208',
    bgContainer: '#241a0e',
    bgElevated: '#2c2114',
    sider: '#120c05',
    siderSub: '#0b0702',
    siderText: '#f5e6c8',
    siderSelectedBg: GAME_COLORS.honey,
    siderSelectedText: GAME_COLORS.ink,
    header: '#241a0e',
    headerBorder: '#5a3f14',
    chart: [GAME_COLORS.honey, '#b388e6', '#7ad463', '#60a5fa', '#f87171', GAME_COLORS.orange],
  },
} as const;

export type ThemeColors = (typeof THEME_COLORS)[ThemeMode];

export const FONT_FAMILY =
  "'Inter', 'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif";

/** Dựng ThemeConfig cho ConfigProvider theo chế độ sáng / tối */
export function buildTheme(mode: ThemeMode): ThemeConfig {
  const c = THEME_COLORS[mode];
  const dark = mode === 'dark';
  return {
    algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: c.primary,
      colorPrimaryHover: c.primaryHover,
      colorPrimaryActive: c.primaryActive,
      // Chữ trên nền primary (nút primary, badge…) — tối để đủ tương phản trên vàng
      colorTextLightSolid: c.onPrimary,
      // Chữ màu primary (Button type=text/link, Tabs, Pagination…) — hổ phách đậm ở light mode
      colorPrimaryText: c.link,
      colorPrimaryTextHover: c.linkHover,
      colorPrimaryTextActive: c.linkHover,
      colorLink: c.link,
      colorLinkHover: c.linkHover,
      colorLinkActive: c.linkHover,
      colorInfo: c.primary,
      colorBgLayout: c.bgLayout,
      colorBgContainer: c.bgContainer,
      colorBgElevated: c.bgElevated,
      borderRadius: 8,
      fontFamily: FONT_FAMILY,
    },
    components: {
      Layout: {
        siderBg: c.sider,
        triggerBg: c.siderSub,
        headerBg: c.header,
        headerPadding: '0 24px',
        bodyBg: c.bgLayout,
      },
      Menu: {
        darkItemBg: c.sider,
        darkSubMenuItemBg: c.siderSub,
        darkItemColor: c.siderText,
        darkItemHoverColor: '#ffffff',
        darkItemHoverBg: 'rgba(255, 200, 61, 0.14)',
        darkItemSelectedBg: c.siderSelectedBg,
        darkItemSelectedColor: c.siderSelectedText,
      },
      Button: {
        // Nút default khi hover: chữ hổ phách đậm (không phải vàng tươi) để đọc được trên nền trắng
        defaultHoverColor: c.link,
        defaultHoverBorderColor: c.primaryHover,
        defaultActiveColor: c.linkHover,
        defaultActiveBorderColor: c.primaryActive,
      },
      Checkbox: { colorWhite: c.onPrimary },
      Radio: { colorWhite: c.onPrimary },
      Tabs: { itemSelectedColor: c.link, itemHoverColor: c.linkHover, itemActiveColor: c.linkHover },
      Pagination: { colorPrimary: c.link, colorPrimaryHover: c.linkHover },
      Table: { headerBg: dark ? '#2c2114' : GAME_COLORS.cream },
      Card: { headerBg: 'transparent' },
    },
  };
}
