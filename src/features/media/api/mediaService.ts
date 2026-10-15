/**
 * Service media: presign → PUT thẳng lên bucket (`putFile`, có tiến độ) → complete. Trả `MediaRef` (id, url, kind)
 * để nhét vào config câu hỏi (`*MediaId`) và map `media` hiển thị. Kèm hook `MediaService.useUpload()`.
 */
import { useMutation } from '@tanstack/react-query';
import type { MediaKind, MediaRef } from '@phonics/contracts';
import { mediaRepository } from '@/features/media/api/mediaRepository';
import { probeFile, validateFile } from '@/features/media/utils/mediaLimits';
import { ApiError } from '@/shared/api/errors';
import { putFile, type UploadProgress } from '@/shared/api/upload';
import { t } from '@/shared/i18n';

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

const api = {
  async upload(file: File, kind: MediaKind, options: UploadOptions = {}): Promise<MediaRef> {
    const check = validateFile(file, kind);
    if (!check.ok) {
      // Chặn ở client trước khi gọi API → tự mang câu thông báo
      const code = check.reason === 'type' ? 'MEDIA_TYPE_UNSUPPORTED' : 'MEDIA_TOO_LARGE';
      throw new ApiError(400, code, t.errors[code]);
    }
    const presigned = await mediaRepository.presign({
      kind,
      mimeType: file.type,
      sizeBytes: file.size,
      fileName: file.name,
    });
    await putFile(presigned.uploadUrl, file, {
      headers: presigned.headers,
      onProgress: options.onProgress,
      signal: options.signal,
    });
    const hints = await probeFile(file, kind).catch(() => ({}));
    const view = await mediaRepository.complete(presigned.mediaId, hints);
    return { id: view.id, url: view.url, kind: view.kind };
  },
  detail: (id: string) => mediaRepository.detail(id),
};

export const MediaService = {
  ...api,

  /** Upload một file (không invalidate gì — kết quả được nhét vào form / MediaMapContext) */
  useUpload: () =>
    useMutation({
      mutationFn: ({ file, kind, options }: { file: File; kind: MediaKind; options?: UploadOptions }) =>
        api.upload(file, kind, options),
    }),
};
