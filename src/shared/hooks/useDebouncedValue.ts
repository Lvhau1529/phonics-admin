import { useEffect, useState } from 'react';

/** Giá trị trễ `delay` ms sau lần đổi cuối (ô tìm kiếm → query API) */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
