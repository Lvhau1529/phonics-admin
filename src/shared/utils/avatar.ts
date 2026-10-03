import { AVATARS, DEFAULT_AVATAR, type AvatarKey } from '@phonics/contracts';
import { GAME_URL } from '@/shared/config';

/**
 * Ảnh avatar preset — file nằm trong app game (public/assets), lấy qua `${GAME_URL}/...`.
 * Đường dẫn chép từ phonics-game src/platform/account/avatars.ts.
 * pip / girl / boy: avatar cũ (không còn trong AVATARS) — vẫn hiển thị cho tài khoản đã chọn.
 *
 * Kiểu `Record<AvatarKey, …> & Record<string, …>`: đủ mọi key của contracts, và chấp nhận key của contracts mới hơn
 * bản đang cài (elephant / monkey / dog / cat từ 1.1.0) để build được trước khi `pnpm up @phonics/contracts`.
 */
const AVATAR_PATHS: Record<AvatarKey, string> & Record<string, string> = {
  tiger: 'assets/shared/avatars/tiger.webp',
  elephant: 'assets/shared/avatars/elephant.webp',
  lion: 'assets/shared/avatars/lion.webp',
  monkey: 'assets/shared/avatars/monkey.webp',
  dog: 'assets/shared/avatars/dog.webp',
  cat: 'assets/shared/avatars/cat.webp',
  panda: 'assets/shared/avatars/panda.webp',
  bunny: 'assets/shared/avatars/bunny.webp',
  pip: 'assets/shared/ui/mascot/hello.webp',
  girl: 'assets/food-stream/characters/girl_happy.png',
  boy: 'assets/food-stream/characters/boy_happy.png',
};

/** Màu nền fallback (khi ảnh không tải được) theo avatar */
export const AVATAR_COLORS: Record<AvatarKey, string> & Record<string, string> = {
  tiger: '#EA580C',
  elephant: '#64748B',
  lion: '#D97706',
  monkey: '#92400E',
  dog: '#B45309',
  cat: '#6B7280',
  panda: '#475569',
  bunny: '#EC4899',
  pip: '#F59E0B',
  girl: '#7A3BB8',
  boy: '#2563EB',
};

export const avatarUrl = (key: AvatarKey | null | undefined): string =>
  `${GAME_URL}/${AVATAR_PATHS[key ?? DEFAULT_AVATAR] ?? AVATAR_PATHS[DEFAULT_AVATAR]}`;

/** Nhãn theo AVATARS; avatar cũ không còn trong danh sách -> viết hoa chữ đầu của key */
export const avatarLabel = (key: AvatarKey | null | undefined): string => {
  const value = key ?? DEFAULT_AVATAR;
  return AVATARS.find((a) => a.key === value)?.label ?? value.charAt(0).toUpperCase() + value.slice(1);
};
