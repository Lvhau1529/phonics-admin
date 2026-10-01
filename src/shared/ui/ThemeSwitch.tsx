import { DesktopOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';
import type { ReactNode } from 'react';
import { t } from '@/shared/i18n';
import { setThemePreference, useThemePreference, type ThemePreference } from '@/shared/theme/themeStore';

/** Chọn chế độ giao diện: sáng / tối / theo hệ thống (lưu localStorage) */
export function ThemeSwitch({ size = 'small' }: { size?: 'small' | 'middle' }) {
  const pref = useThemePreference();
  const options: { value: ThemePreference; title: string; icon: ReactNode }[] = [
    { value: 'light', title: t.common.themeLight, icon: <SunOutlined /> },
    { value: 'dark', title: t.common.themeDark, icon: <MoonOutlined /> },
    { value: 'system', title: t.common.themeSystem, icon: <DesktopOutlined /> },
  ];
  return (
    <Segmented<ThemePreference>
      size={size}
      value={pref}
      onChange={setThemePreference}
      aria-label={t.common.theme}
      options={options}
    />
  );
}
