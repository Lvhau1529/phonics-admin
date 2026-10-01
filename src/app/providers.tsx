import { App as AntApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { useEffect, useState, type ReactNode } from 'react';
import { bootstrapAuth } from '@/features/auth/authStore';
import { createQueryClient } from '@/app/queryClient';
import { theme } from '@/shared/theme';

dayjs.locale('vi');

interface ProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  /** false trong test: không khôi phục phiên từ localStorage */
  bootstrap?: boolean;
}

/** antd (locale vi + theme tím) + TanStack Query + khôi phục phiên đăng nhập */
export function Providers({ children, queryClient, bootstrap = true }: ProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient());

  useEffect(() => {
    if (bootstrap) void bootstrapAuth();
  }, [bootstrap]);

  return (
    <ConfigProvider locale={viVN} theme={theme}>
      <AntApp>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}
