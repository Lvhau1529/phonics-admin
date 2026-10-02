/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, searchForWorkspaceRoot } from 'vite';

/**
 * Dev cùng phonics-api: launcher phonics-dev đặt PHONICS_CONTRACTS_SRC = thư mục packages/contracts của API →
 * `@phonics/contracts` đọc thẳng mã nguồn (sửa schema thấy ngay, không cần phát hành). Không có biến (CI, Vercel,
 * chạy repo riêng) = dùng gói đã cài từ GitHub Packages.
 */
const contractsSrc = process.env.PHONICS_CONTRACTS_SRC;
const contractsAlias: Record<string, string> = contractsSrc
  ? { '@phonics/contracts': resolve(contractsSrc, 'src/index.ts') }
  : {};
const contractsFs = contractsSrc
  ? { fs: { allow: [searchForWorkspaceRoot(process.cwd()), contractsSrc] } }
  : {};

export default defineConfig({
  resolve: {
    // import '@/features/...' thay cho '../../features/...' (khai báo tương ứng trong tsconfig.json > paths)
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)), ...contractsAlias },
    // contracts đọc từ mã nguồn API vẫn dùng chung một bản zod với app
    dedupe: ['zod'],
  },
  plugins: [react()],
  server: { port: 5174, ...contractsFs },
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
