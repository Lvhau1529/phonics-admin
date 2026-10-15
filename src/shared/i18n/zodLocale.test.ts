import { Email, UpdateClassBody } from '@phonics/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { setLang } from '@/shared/i18n';
import { issueMessage } from '@/shared/i18n/zodLocale';
import { parseForm } from '@/shared/utils/zodForm';

// configureZodLocale() đã gọi trong src/test/setup.ts (như main.tsx)
const firstIssue = (
  schema: { safeParse: (v: unknown) => { error?: { issues: { message: string }[] } } },
  value: unknown,
) => {
  const issue = schema.safeParse(value).error?.issues[0];
  if (!issue) throw new Error('phải lỗi');
  return issue;
};

describe('Message validate theo ngôn ngữ giao diện', () => {
  afterEach(() => setLang('vi'));

  it('message mặc định của zod theo getLang() lúc validate', () => {
    setLang('en');
    const en = issueMessage(firstIssue(Email, 'không-phải-email'));
    setLang('vi');
    const vi = issueMessage(firstIssue(Email, 'không-phải-email'));
    expect(en).toMatch(/invalid/i);
    expect(vi).not.toBe(en);
  });

  it('khoá message của contracts dịch theo ngôn ngữ (cả lỗi cấp form của parseForm)', () => {
    setLang('en');
    expect(issueMessage(firstIssue(UpdateClassBody, {}))).toBe('At least one field is required');
    const result = parseForm(UpdateClassBody, {});
    expect(result.success).toBe(false);
    if (!result.success) expect(result.formErrors).toEqual(['At least one field is required']);
    setLang('vi');
    expect(issueMessage(firstIssue(UpdateClassBody, {}))).toBe('Cần ít nhất một trường');
  });
});
