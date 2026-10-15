/**
 * Message validate của zod theo ngôn ngữ giao diện (ADR 0025):
 *  - message mặc định (min / max / type...): `z.config({ localeError })` đọc `getLang()` lúc sinh lỗi → đổi ngôn
 *    ngữ không cần cấu hình lại;
 *  - message tự viết trong contracts là khoá (`ValidationMessage`) → `issueMessage` dịch bằng hàm của contracts.
 */
import { type ValidationLocale, translateIssueMessage } from '@phonics/contracts';
import { z } from 'zod';
import { getLang, type Lang } from '@/shared/i18n/langStore';

const ZOD_LOCALES: Record<Lang, ReturnType<typeof z.locales.vi>> = {
  vi: z.locales.vi(),
  en: z.locales.en(),
};

/** Gọi một lần lúc khởi động (`main.tsx`, setup test) */
export function configureZodLocale(): void {
  z.config({ localeError: (issue) => ZOD_LOCALES[getLang()].localeError(issue) });
}

/** Câu hiển thị của một issue zod theo ngôn ngữ hiện tại (khoá contracts → câu đã dịch, còn lại giữ nguyên) */
export const issueMessage = (issue: { message: string; params?: unknown }): string =>
  translateIssueMessage(issue, getLang() satisfies ValidationLocale);
