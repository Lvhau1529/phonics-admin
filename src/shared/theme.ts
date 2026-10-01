import type { ThemeConfig } from 'antd';

/** Màu tím của Phonics Arcade (trùng game) */
export const COLOR_PRIMARY = '#7A3BB8';
export const COLOR_SIDER = '#3D1C6E';
export const COLOR_SIDER_DARK = '#2E1454';

/** Màu cho biểu đồ (Recharts) — theo thứ tự series */
export const CHART_COLORS = ['#7A3BB8', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'] as const;

export const theme: ThemeConfig = {
  token: {
    colorPrimary: COLOR_PRIMARY,
    borderRadius: 8,
    fontFamily:
      "'Inter', 'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  },
  components: {
    Layout: {
      siderBg: COLOR_SIDER,
      triggerBg: COLOR_SIDER_DARK,
      headerBg: '#ffffff',
      headerPadding: '0 24px',
    },
    Menu: {
      darkItemBg: COLOR_SIDER,
      darkSubMenuItemBg: COLOR_SIDER_DARK,
      darkItemSelectedBg: COLOR_PRIMARY,
      darkItemHoverBg: 'rgba(255, 255, 255, 0.08)',
    },
  },
};
