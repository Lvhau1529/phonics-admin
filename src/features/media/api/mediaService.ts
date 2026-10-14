/**
 * Service media: presign → PUT thẳng lên bucket (`putFile`, có tiến độ) → complete. Trả `MediaRef` (id, url, kind)
 * để nhét vào config câu hỏi (`*MediaId`) và map `media` hiển thị.
 */
import type { MediaKind, MediaRef } from '@phonics/contracts';
import { mediaRepository } from '@/features/media/api/mediaRepository';
import { probeFile, validateFile } from '@/features/media/utils/mediaLimits';
import { ApiError } from '@/shared/api/errors';
import { putFile, type UploadProgress } from '@/shared/api/upload';

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export const mediaService = {
  async upload(file: File, kind: MediaKind, options: UploadOptions = {}): Promise<MediaRef> {
    const check = validateFile(file, kind);
    if (!check.ok) {
      throw new ApiError(
        400,
        check.reason === 'type' ? 'MEDIA_TYPE_UNSUPPORTED' : 'MEDIA_TOO_LARGE',
        'Invalid file',
      );
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
