import { useMutation } from '@tanstack/react-query';
import type { MediaKind } from '@phonics/contracts';
import { mediaService, type UploadOptions } from '@/features/media/api/mediaService';

/** Upload một file (không invalidate gì — kết quả được nhét vào form / MediaMapContext) */
export const useUploadMedia = () =>
  useMutation({
    mutationFn: ({ file, kind, options }: { file: File; kind: MediaKind; options?: UploadOptions }) =>
      mediaService.upload(file, kind, options),
  });
