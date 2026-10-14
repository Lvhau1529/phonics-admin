import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { t } from '@/shared/i18n';
import { ThemeMode } from '@/shared/theme/theme';
import { setThemeMode, useThemeMode } from '@/shared/theme/themeStore';

/** Nút đổi sáng / tối (mặc định tối, lưu localStorage) — icon là chế độ sẽ chuyển sang */
export function ThemeSwitch() {
  const mode = useThemeMode();
  const next = mode === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;
  const label = `${t.common.theme}: ${next === ThemeMode.LIGHT ? t.common.themeLight : t.common.themeDark}`;
  return (
    <Tooltip title={label}>
      <Button
        icon={next === ThemeMode.LIGHT ? <SunOutlined /> : <MoonOutlined />}
        aria-label={label}
        onClick={() => setThemeMode(next)}
      />
    </Tooltip>
  );
}
