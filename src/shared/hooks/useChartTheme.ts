import { theme } from 'antd';
import type { CSSProperties } from 'react';
import { THEME_COLORS } from '@/shared/theme';
import { useResolvedTheme } from '@/shared/theme/themeStore';

export interface ChartTheme {
  /** Màu series theo thứ tự (khác nhau giữa light / dark để đủ tương phản trên nền) */
  colors: readonly string[];
  grid: string;
  axis: string;
  /** Màu chữ trục / legend */
  text: string;
  tooltip: {
    contentStyle: CSSProperties;
    labelStyle: CSSProperties;
    itemStyle: CSSProperties;
    cursor: { fill?: string; stroke?: string };
  };
  legend: { wrapperStyle: CSSProperties };
}

/** Màu cho Recharts lấy từ token antd của theme hiện tại (sáng / tối) */
export function useChartTheme(): ChartTheme {
  const { token } = theme.useToken();
  const mode = useResolvedTheme();
  return {
    colors: THEME_COLORS[mode].chart,
    grid: token.colorSplit,
    axis: token.colorBorder,
    text: token.colorTextSecondary,
    tooltip: {
      contentStyle: {
        background: token.colorBgElevated,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
        color: token.colorText,
        fontSize: token.fontSizeSM,
      },
      labelStyle: { color: token.colorTextSecondary, marginBottom: 4 },
      itemStyle: { color: token.colorText },
      cursor: { fill: token.colorFillTertiary, stroke: token.colorBorder },
    },
    legend: { wrapperStyle: { color: token.colorText, fontSize: token.fontSizeSM } },
  };
}
