import { Flex, Select, type SelectProps } from 'antd';
import { AVATARS, type AvatarKey } from '@phonics/contracts';
import { AvatarImg } from '@/shared/ui/AvatarImg';

type AvatarSelectProps = Omit<SelectProps<AvatarKey>, 'options'>;

/** Chọn avatar preset (ảnh + nhãn) */
export function AvatarSelect(props: AvatarSelectProps) {
  return (
    <Select<AvatarKey>
      {...props}
      optionLabelProp="label"
      options={AVATARS.map((a) => ({
        value: a.key,
        label: (
          <Flex align="center" gap={8}>
            <AvatarImg avatarKey={a.key} size="small" />
            {a.label}
          </Flex>
        ),
      }))}
    />
  );
}
