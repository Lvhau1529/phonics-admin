import { Segmented } from 'antd';
import { LANG_LABELS, LANGS, setLang, t, useLang, type Lang } from '@/shared/i18n';

/** Đổi ngôn ngữ giao diện (VI / EN) — Providers remount cây React theo `key={lang}` */
export function LangSwitch({ size = 'small' }: { size?: 'small' | 'middle' }) {
  const lang = useLang();
  return (
    <Segmented<Lang>
      size={size}
      value={lang}
      onChange={setLang}
      aria-label={t.common.language}
      options={LANGS.map((value) => ({ value, label: value.toUpperCase(), title: LANG_LABELS[value] }))}
    />
  );
}
