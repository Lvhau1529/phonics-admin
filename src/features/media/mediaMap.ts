import type { MediaMap, MediaRef } from '@phonics/contracts';
import { createContext, useContext } from 'react';

export interface MediaMapValue {
  media: MediaMap;
  /** Tra URL theo id; thiếu → undefined (ảnh chưa tải / không thuộc response) */
  get: (id: string | null | undefined) => MediaRef | undefined;
  /** Thêm file vừa upload để preview ngay */
  add: (ref: MediaRef) => void;
  /** Gộp map `media` của response mới (giữ các ref đã có) */
  merge: (map: MediaMap | undefined) => void;
}

export const MediaMapContext = createContext<MediaMapValue>({
  media: {},
  get: () => undefined,
  add: () => undefined,
  merge: () => undefined,
});

export const useMediaMap = (): MediaMapValue => useContext(MediaMapContext);
