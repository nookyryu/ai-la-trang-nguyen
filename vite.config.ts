import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import os from 'node:os';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Ổ D: không cho tài khoản thường XOÁ file trong node_modules (lỗi EPERM unlink .vite/deps),
  // nên để bộ đệm Vite trong thư mục Temp của Windows (2026-11-19)
  cacheDir: path.join(os.tmpdir(), 'vite-ai-la-trang-nguyen'),
  server: {
    // lvh.me trỏ về 127.0.0.1; TikTok LIVE Studio không nhận "localhost"
    allowedHosts: ['lvh.me'],
    // server ghi data/*.json lúc đang chơi: không được làm trang stage tải lại
    watch: { ignored: ['**/data/**', '**/settings.json'] },
  },
});
