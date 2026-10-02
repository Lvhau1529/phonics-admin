import { App as AntApp, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { bootstrapAuth } from '@/features/auth/authStore';
import { createQueryClient } from '@/app/queryClient';
import { useLang, type Lang } from '@/shared/i18n';
import { buildTheme } from '@/shared/theme/theme';
import { useThemeMode } from '@/shared/theme/themeStore';

const ANTD_LOCALES = { vi: viVN, en: enUS } as const satisfies Record<Lang, unknown>;

interface ProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  /** false trong test: không khôi phục phiên từ localStorage */
  bootstrap?: boolean;
}

/**
 * antd (locale + theme sáng / tối theo themeStore) + TanStack Query + khôi phục phiên đăng nhập.
 * Đổi ngôn ngữ → `key={lang}` remount toàn bộ cây con để mọi `t.xxx` (Proxy) đọc từ điển mới; QueryClient
 * giữ nguyên nên cache không mất.
 */
export function Providers({ children, queryClient, bootstrap = true }: ProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  const lang = useLang();
  const mode = useThemeMode();
  const theme = useMemo(() => buildTheme(mode), [mode]);

  // dayjs.locale toàn cục phải đặt trước khi render con (format ngày / RangePicker)
  dayjs.locale(lang);

  useEffect(() => {
    if (bootstrap) void bootstrapAuth();
  }, [bootstrap]);

  return (
    <ConfigProvider key={lang} locale={ANTD_LOCALES[lang]} theme={theme}>
      <AntApp>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}
