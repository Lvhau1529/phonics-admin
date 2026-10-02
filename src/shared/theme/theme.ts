/**
 * Theme antd của Web Admin — giữ nguyên kiểu dáng antd, chỉ đổi bảng màu:
 *  - Điểm nhấn: vàng #ffdc58 (lấy từ neobrutalism.com) cho nút primary / mục đang chọn, chữ trên nền vàng là mực đen.
 *  - Nền / viền / chữ: thang xám trung tính "zinc" (kiểu shadcn/ui, Vercel, Linear) — sáng: nền #f4f4f5, thẻ trắng;
 *    tối: nền #09090b, thẻ #18181b, viền #27272a / #3f3f46. Mặc định tối (themeStore).
 *
 * Nguyên tắc tương phản (kiểm tra trong theme.test.ts bằng utils/contrast):
 *  - Nút primary: nền vàng + CHỮ MỰC (`colorTextLightSolid`) → > 7:1.
 *  - Link / chữ màu primary (Tabs, Pagination, Button text): nâu vàng đậm ở light mode vì vàng trên nền trắng chỉ
 *    ~1.4:1; dark mode dùng chính vàng trên nền than (> 10:1).
 *  - Checkbox / Radio: dấu tick màu mực thay vì trắng trên nền vàng.
 */
import { theme as antdTheme, type ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

/** Màu game dùng lại trong admin (palette của apps/game) */
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

const BRAND_YELLOW = '#ffdc58';

/** Token màu theo chế độ — export để test tương phản và cho component không qua ConfigProvider (login, chart) */
export const THEME_COLORS = {
  light: {
    /** Nền nút primary */
    primary: BRAND_YELLOW,
    primaryHover: '#ffd12e',
    primaryActive: '#f5c400',
    /** Chữ trên nền primary (nút primary) */
    onPrimary: '#09090b',
    /** Link + chữ màu primary trên nền sáng (≥ 4.5:1 trên trắng và nền layout) */
    link: '#854d0e',
    linkHover: '#713f12',
    bgLayout: '#f4f4f5',
    bgContainer: '#ffffff',
    bgElevated: '#ffffff',
    border: '#d4d4d8',
    borderSecondary: '#e4e4e7',
    sider: '#ffffff',
    siderText: '#3f3f46',
    /** Mục menu đang chọn: nền vàng nhạt + chữ nâu đậm (kiểu Ant Design Pro) */
    siderSelectedBg: '#fef3c7',
    siderSelectedText: '#78350f',
    siderHoverBg: '#f4f4f5',
    header: '#ffffff',
    headerBorder: '#e4e4e7',
    /** Tooltip đảo màu so với nền (sáng → tooltip than chữ trắng) để nổi rõ */
    tooltipBg: '#18181b',
    tooltipText: '#fafafa',
    /** Màu series biểu đồ (Recharts) theo thứ tự — bão hoà vừa, phân biệt rõ trên nền trắng */
    chart: ['#f59e0b', '#6366f1', '#10b981', '#3b82f6', '#ef4444', '#ec4899'],
  },
  dark: {
    primary: BRAND_YELLOW,
    primaryHover: '#ffe37a',
    primaryActive: '#ffd12e',
    onPrimary: '#09090b',
    link: BRAND_YELLOW,
    linkHover: '#ffe9a0',
    bgLayout: '#09090b',
    bgContainer: '#18181b',
    bgElevated: '#202024',
    border: '#3f3f46',
    borderSecondary: '#27272a',
    sider: '#18181b',
    siderText: '#d4d4d8',
    siderSelectedBg: '#3a3115',
    siderSelectedText: BRAND_YELLOW,
    siderHoverBg: '#27272a',
    header: '#18181b',
    headerBorder: '#27272a',
    /** Tối → tooltip sáng chữ mực (nền xám mặc định của antd chìm vào thẻ #18181b) */
    tooltipBg: '#f4f4f5',
    tooltipText: '#09090b',
    /** Bản nhạt hơn của cùng bộ màu để nổi trên nền tối mà không chói */
    chart: ['#fcd34d', '#a5b4fc', '#6ee7b7', '#93c5fd', '#fca5a5', '#f9a8d4'],
  },
} as const;

export type ThemeColors = (typeof THEME_COLORS)[ThemeMode];

export const FONT_FAMILY =
  "'Inter', 'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif";

type MappingAlgorithm = Exclude<NonNullable<ThemeConfig['algorithm']>, readonly unknown[]>;

/**
 * darkAlgorithm của antd tự pha màu primary với nền tối (vàng #ffdc58 → #dcbe4e, xỉn). Thuật toán chạy sau cùng
 * này ghim lại đúng màu thương hiệu cho nút primary ở cả hai chế độ.
 */
const pinPrimary =
  (c: ThemeColors): MappingAlgorithm =>
  (seed, map) => ({
    ...(map ?? antdTheme.defaultAlgorithm(seed)),
    colorPrimary: c.primary,
    colorPrimaryHover: c.primaryHover,
    colorPrimaryActive: c.primaryActive,
  });

/** Dựng ThemeConfig cho ConfigProvider theo chế độ sáng / tối */
export function buildTheme(mode: ThemeMode): ThemeConfig {
  const c = THEME_COLORS[mode];
  return {
    algorithm: [mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm, pinPrimary(c)],
    token: {
      colorPrimary: c.primary,
      colorPrimaryHover: c.primaryHover,
      colorPrimaryActive: c.primaryActive,
      // Chữ trên nền primary (nút primary, badge…) — mực để đủ tương phản trên vàng
      colorTextLightSolid: c.onPrimary,
      // Chữ màu primary (Button type=text/link, Tabs, Pagination…) — nâu vàng đậm ở light mode
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
      colorBorder: c.border,
      colorBorderSecondary: c.borderSecondary,
      colorSplit: c.borderSecondary,
      borderRadius: 8,
      fontFamily: FONT_FAMILY,
    },
    components: {
      Layout: {
        siderBg: c.sider,
        triggerBg: c.sider,
        headerBg: c.header,
        headerPadding: '0 24px',
        bodyBg: c.bgLayout,
      },
      Menu: {
        itemBg: 'transparent',
        subMenuItemBg: 'transparent',
        itemColor: c.siderText,
        itemHoverColor: c.siderText,
        itemHoverBg: c.siderHoverBg,
        itemSelectedBg: c.siderSelectedBg,
        itemSelectedColor: c.siderSelectedText,
        itemActiveBg: c.siderHoverBg,
        activeBarBorderWidth: 0,
      },
      Button: {
        // Nút default khi hover: chữ / viền màu link (không phải vàng tươi) để đọc được trên nền trắng
        defaultHoverColor: c.link,
        defaultHoverBorderColor: c.link,
        defaultActiveColor: c.linkHover,
        defaultActiveBorderColor: c.linkHover,
        primaryShadow: 'none',
      },
      Checkbox: { colorWhite: c.onPrimary },
      Radio: { colorWhite: c.onPrimary },
      Tabs: {
        itemSelectedColor: c.link,
        itemHoverColor: c.linkHover,
        itemActiveColor: c.linkHover,
        inkBarColor: c.link,
      },
      Pagination: { colorPrimary: c.link, colorPrimaryHover: c.linkHover },
      Segmented: { itemSelectedBg: c.primary, itemSelectedColor: c.onPrimary },
      Card: { headerBg: 'transparent' },
      // Tooltip đọc chữ từ colorTextLightSolid (đã đặt là mực cho nút vàng) → phải đặt riêng cả nền lẫn chữ
      Tooltip: { colorBgSpotlight: c.tooltipBg, colorTextLightSolid: c.tooltipText },
    },
  };
}
