import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { t } from '@/shared/i18n';
import { setThemeMode, useThemeMode } from '@/shared/theme/themeStore';

/** Nút đổi sáng / tối (mặc định tối, lưu localStorage) — icon là chế độ sẽ chuyển sang */
export function ThemeSwitch() {
  const mode = useThemeMode();
  const next = mode === 'dark' ? 'light' : 'dark';
  const label = `${t.common.theme}: ${next === 'light' ? t.common.themeLight : t.common.themeDark}`;
  return (
    <Tooltip title={label}>
      <Button
        icon={next === 'light' ? <SunOutlined /> : <MoonOutlined />}
        aria-label={label}
        onClick={() => setThemeMode(next)}
      />
    </Tooltip>
  );
}
