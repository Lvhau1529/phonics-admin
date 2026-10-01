/**
 * i18n của Web Admin: hai từ điển cùng cấu trúc (`vi.ts` là nguồn, `en.ts` phải `satisfies Dict`).
 * `t` là Proxy đọc từ điển của ngôn ngữ HIỆN TẠI tại thời điểm truy cập (`t.common.save`), nên code cũ
 * giữ nguyên cách dùng. Lưu ý: không cache `t.xxx` ở cấp module (hằng ngoài component) — dựng trong
 * component / hàm để nhận ngôn ngữ mới sau khi Providers remount.
 */
import { en } from '@/shared/i18n/en';
import { getLang, type Lang } from '@/shared/i18n/langStore';
import { vi } from '@/shared/i18n/vi';

export type { Lang } from '@/shared/i18n/langStore';
export { LANGS, detectLang, getLang, setLang, subscribeLang, useLang } from '@/shared/i18n/langStore';

export type Dict = typeof vi;

export const dictionaries: Record<Lang, Dict> = { vi, en };

/** Từ điển của ngôn ngữ hiện tại (object thật, không phải Proxy) */
export const currentDict = (): Dict => dictionaries[getLang()];

const handler: ProxyHandler<Dict> = {
  get: (_target, key) => currentDict()[key as keyof Dict],
  has: (_target, key) => key in currentDict(),
  ownKeys: () => Reflect.ownKeys(currentDict()),
  getOwnPropertyDescriptor: (_target, key) => {
    const desc = Object.getOwnPropertyDescriptor(currentDict(), key);
    return desc ? { ...desc, configurable: true } : undefined;
  },
};

/** Chuỗi giao diện theo ngôn ngữ hiện tại: `t.nav.dashboard`, `t.app.title('Lớp học')` */
export const t: Dict = new Proxy({} as Dict, handler);

/** Nhãn hiển thị của từng ngôn ngữ (bằng chính ngôn ngữ đó) */
export const LANG_LABELS: Record<Lang, string> = { vi: 'Tiếng Việt', en: 'English' };
