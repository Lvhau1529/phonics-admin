// Cài matcher của jest-dom (toBeInTheDocument...) cho mọi test Vitest
import '@testing-library/jest-dom/vitest';

// antd dùng matchMedia (responsive) — jsdom không có
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
