import type { MediaMap, MediaRef } from '@phonics/contracts';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { MediaMapContext, type MediaMapValue } from '@/features/media/mediaMap';

/**
 * JSON câu hỏi / câu trả lời chỉ giữ `*MediaId`; URL nằm trong map `media` của response. Provider này gom map của
 * mọi response đã nạp + file vừa upload để editor / renderer tra URL mà không truyền prop lòng vòng.
 */
export function MediaMapProvider({ initial, children }: { initial?: MediaMap; children: ReactNode }) {
  const [media, setMedia] = useState<MediaMap>(initial ?? {});
  const add = useCallback((ref: MediaRef) => setMedia((prev) => ({ ...prev, [ref.id]: ref })), []);
  const merge = useCallback((map: MediaMap | undefined) => {
    if (!map || !Object.keys(map).length) return;
    setMedia((prev) => ({ ...prev, ...map }));
  }, []);
  const value = useMemo<MediaMapValue>(
    () => ({ media, get: (id) => (id ? media[id] : undefined), add, merge }),
    [media, add, merge],
  );
  return <MediaMapContext.Provider value={value}>{children}</MediaMapContext.Provider>;
}
