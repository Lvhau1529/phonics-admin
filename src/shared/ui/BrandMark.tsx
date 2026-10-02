import { TrophyOutlined } from '@ant-design/icons';
import { Flex } from 'antd';
import { THEME_COLORS } from '@/shared/theme/theme';
import { useThemeMode } from '@/shared/theme/themeStore';

/** Logo ô vàng bo góc + cúp (sider, trang đăng nhập, màn chờ) */
export function BrandMark({ size = 32 }: { size?: number }) {
  const c = THEME_COLORS[useThemeMode()];
  return (
    <Flex
      align="center"
      justify="center"
      style={{
        flex: 'none',
        width: size,
        height: size,
        borderRadius: Math.round(size / 4),
        background: c.primary,
        color: c.onPrimary,
        fontSize: Math.round(size * 0.55),
      }}
    >
      <TrophyOutlined />
    </Flex>
  );
}
