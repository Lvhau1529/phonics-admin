/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    // import '@/features/...' thay cho '../../features/...' (khai báo tương ứng trong tsconfig.json > paths)
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [react()],
  server: { port: 5174 },
  preview: { port: 4174 },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Tách vendor lớn để cache lâu: antd, recharts, phần còn lại
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/antd/') || id.includes('@ant-design') || id.includes('rc-')) return 'antd';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('lottie-web')) return 'lottie';
          return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
});
