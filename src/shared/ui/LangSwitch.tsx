import { CheckOutlined, DownOutlined, GlobalOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import { LANG_LABELS, LANGS, setLang, t, useLang } from '@/shared/i18n';

/**
 * Chọn ngôn ngữ giao diện (Tiếng Việt / English) — đặt ở góc trên bên phải; `compact` chỉ hiện mã (VI / EN) cho
 * màn hẹp. Providers remount cây React theo `key={lang}`.
 */
export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const lang = useLang();
  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        selectable: true,
        selectedKeys: [lang],
        items: LANGS.map((value) => ({
          key: value,
          label: LANG_LABELS[value],
          extra: value === lang ? <CheckOutlined /> : undefined,
          onClick: () => setLang(value),
        })),
      }}
    >
      <Button icon={<GlobalOutlined />} aria-label={t.common.language}>
        {compact ? lang.toUpperCase() : LANG_LABELS[lang]}
        <DownOutlined style={{ fontSize: 10 }} />
      </Button>
    </Dropdown>
  );
}
