import { AVATARS, DEFAULT_AVATAR, type AvatarKey } from '@phonics/contracts';
import { GAME_URL } from '@/shared/config';

/**
 * Ảnh avatar preset — file nằm trong app game (apps/game/public/assets), lấy qua `${GAME_URL}/...`.
 * Đường dẫn chép từ apps/game/src/platform/account/avatars.ts.
 */
const AVATAR_PATHS: Record<AvatarKey, string> = {
  pip: 'assets/shared/ui/mascot/hello.webp',
  lion: 'assets/bread-catcher/phonics/mascot_lion.png',
  tiger: 'assets/bread-catcher/phonics/mascot_tiger.png',
  panda: 'assets/bread-catcher/phonics/mascot_panda.png',
  bunny: 'assets/bread-catcher/phonics/mascot_bunny.png',
  girl: 'assets/food-stream/characters/girl_happy.png',
  boy: 'assets/food-stream/characters/boy_happy.png',
};

/** Màu nền fallback (khi ảnh không tải được) theo avatar */
export const AVATAR_COLORS: Record<AvatarKey, string> = {
  pip: '#F59E0B',
  lion: '#D97706',
  tiger: '#EA580C',
  panda: '#475569',
  bunny: '#EC4899',
  girl: '#7A3BB8',
  boy: '#2563EB',
};

export const avatarUrl = (key: AvatarKey | null | undefined): string =>
  `${GAME_URL}/${AVATAR_PATHS[key ?? DEFAULT_AVATAR] ?? AVATAR_PATHS[DEFAULT_AVATAR]}`;

export const avatarLabel = (key: AvatarKey | null | undefined): string =>
  AVATARS.find((a) => a.key === key)?.label ?? AVATARS[0].label;
