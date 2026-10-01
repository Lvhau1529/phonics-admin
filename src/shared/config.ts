/** Cấu hình từ biến môi trường (Vite chỉ lộ biến có prefix VITE_) */
const trimSlash = (url: string) => url.replace(/\/+$/, '');

/** Gốc API (không có `/api`), ví dụ http://localhost:3000 */
export const API_URL = trimSlash(import.meta.env.VITE_API_URL ?? 'http://localhost:3000');

/** Gốc app game — ảnh avatar preset lấy từ `${GAME_URL}/assets/...` */
export const GAME_URL = trimSlash(import.meta.env.VITE_GAME_URL ?? 'http://localhost:5173');

/** Khoá localStorage lưu phiên đăng nhập `{ user, refreshToken }` */
export const AUTH_STORAGE_KEY = 'phonics-admin:auth';

/** Số dòng mặc định của bảng */
export const DEFAULT_PAGE_SIZE = 20;
