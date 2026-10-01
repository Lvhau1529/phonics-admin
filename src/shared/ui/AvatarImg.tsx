import { Avatar, type AvatarProps } from 'antd';
import { DEFAULT_AVATAR, type AvatarKey } from '@phonics/contracts';
import { AVATAR_COLORS, avatarLabel, avatarUrl } from '@/shared/utils/avatar';

interface AvatarImgProps extends Omit<AvatarProps, 'src'> {
  avatarKey: AvatarKey | null | undefined;
  /** Tên hiển thị — chữ cái đầu làm fallback */
  name?: string;
}

/** Avatar preset có fallback chữ cái đầu + màu theo key */
export function AvatarImg({ avatarKey, name, ...rest }: AvatarImgProps) {
  const key = avatarKey ?? DEFAULT_AVATAR;
  const initial = (name?.trim().charAt(0) || avatarLabel(key).charAt(0)).toUpperCase();
  return (
    <Avatar
      src={avatarUrl(key)}
      alt={avatarLabel(key)}
      style={{ backgroundColor: AVATAR_COLORS[key], flexShrink: 0 }}
      {...rest}
    >
      {initial}
    </Avatar>
  );
}
