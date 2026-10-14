import { MEDIA_LIMITS, baseMimeType, isMimeAllowed, type MediaKind } from '@phonics/contracts';

export type FileCheck = { ok: true } | { ok: false; reason: 'type' | 'size' };

/** Chuỗi `accept` cho antd Upload theo loại */
export const acceptFor = (kind: MediaKind): string => MEDIA_LIMITS[kind].mimeTypes.join(',');

export const maxMb = (kind: MediaKind): number => Math.round(MEDIA_LIMITS[kind].maxBytes / (1024 * 1024));

/** Kiểm tra client trước khi presign (API kiểm lại): mime nằm trong danh sách, size trong giới hạn */
export function validateFile(file: { type: string; size: number }, kind: MediaKind): FileCheck {
  if (!isMimeAllowed(kind, file.type)) return { ok: false, reason: 'type' };
  if (file.size <= 0 || file.size > MEDIA_LIMITS[kind].maxBytes) return { ok: false, reason: 'size' };
  return { ok: true };
}

/** Đọc kích thước ảnh / thời lượng audio ở trình duyệt (gợi ý hiển thị, API không bắt buộc) */
export async function probeFile(
  file: File,
  kind: MediaKind,
): Promise<{ width?: number; height?: number; durationMs?: number }> {
  const url = URL.createObjectURL(file);
  try {
    if (kind === 'IMAGE') {
      return await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({});
        img.src = url;
      });
    }
    return await new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () =>
        resolve(Number.isFinite(audio.duration) ? { durationMs: Math.round(audio.duration * 1000) } : {});
      audio.onerror = () => resolve({});
      audio.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export { baseMimeType };
