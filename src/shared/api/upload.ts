import { ApiError, ClientErrorCode } from '@/shared/api/errors';

export interface UploadProgress {
  loaded: number;
  total: number;
  /** 0..100 */
  percent: number;
}

export interface PutFileOptions {
  /** Header đã ký kèm presigned URL (Content-Type, Cache-Control…) — phải gửi đúng */
  headers?: Record<string, string>;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

/**
 * PUT file lên link upload có chữ ký (`uploadUrl` của presign). Khác `request()`: URL tuyệt đối, body là Blob,
 * không bearer, không parse JSON, không refresh 401. Dùng XMLHttpRequest vì fetch không có tiến độ upload.
 */
export function putFile(url: string, file: Blob, options: PutFileOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    for (const [name, value] of Object.entries(options.headers ?? {})) {
      if (name.toLowerCase() === 'authorization') continue;
      xhr.setRequestHeader(name, value);
    }
    xhr.upload.onprogress = (event) => {
      if (!options.onProgress) return;
      const total = event.lengthComputable ? event.total : file.size;
      const loaded = Math.min(event.loaded, total);
      options.onProgress({ loaded, total, percent: total ? Math.round((loaded / total) * 100) : 0 });
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new ApiError(xhr.status, ClientErrorCode.UPLOAD, `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new ApiError(0, ClientErrorCode.NETWORK, 'Upload network error'));
    xhr.onabort = () => reject(new DOMException('Upload aborted', 'AbortError'));
    if (options.signal) {
      if (options.signal.aborted) {
        reject(new DOMException('Upload aborted', 'AbortError'));
        return;
      }
      options.signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }
    xhr.send(file);
  });
}
