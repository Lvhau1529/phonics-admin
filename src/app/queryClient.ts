import { keepPreviousData, QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/shared/api/errors';

/** QueryClient dùng chung: 30 s stale, không retry lỗi 4xx, giữ trang cũ khi đổi tham số */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status > 0 && error.status < 500) return false;
          return failureCount < 1;
        },
      },
      mutations: { retry: false },
    },
  });
}
