import { ApiErrorBody, ErrorCode } from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { type ValueOf } from '@/shared/types';

/** Mã lỗi riêng của client: không tới được server / response sai định dạng / upload thẳng lên storage lỗi */
export const ClientErrorCode = {
  NETWORK: 'NETWORK',
  BAD_RESPONSE: 'BAD_RESPONSE',
  UPLOAD: 'UPLOAD',
} as const;
export type ClientErrorCode = ValueOf<typeof ClientErrorCode>;

/** Mã lỗi của API + mã lỗi riêng của client */
export type ApiErrorCode = ErrorCode | ClientErrorCode;

/** Mã lỗi client tự tạo `ApiError` (cần câu trong `t.errors`); lỗi từ API dùng `message` server trả về */
export type LocalErrorCode =
  | ClientErrorCode
  | typeof ErrorCode.enum.UNAUTHORIZED
  | typeof ErrorCode.enum.MEDIA_TYPE_UNSUPPORTED
  | typeof ErrorCode.enum.MEDIA_TOO_LARGE;

/** Lỗi thống nhất cho mọi lời gọi API (envelope `ApiErrorBody` của server hoặc lỗi client) */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  /** Lỗi validate theo field `{ email: ['Invalid email'] }` — đưa lại vào form bằng applyServerErrors */
  readonly details?: Record<string, string[]>;
  readonly requestId?: string;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details?: Record<string, string[]>,
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  /** Dựng từ response lỗi của server; body không đúng envelope thì suy ra từ status */
  static async fromResponse(response: Response): Promise<ApiError> {
    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      raw = undefined;
    }
    const parsed = ApiErrorBody.safeParse(raw);
    if (parsed.success) {
      const { statusCode, code, message, details, requestId } = parsed.data;
      return new ApiError(statusCode, code, message, details, requestId);
    }
    const code: ApiErrorCode =
      response.status === 401
        ? ErrorCode.enum.UNAUTHORIZED
        : response.status === 403
          ? ErrorCode.enum.FORBIDDEN
          : response.status === 404
            ? ErrorCode.enum.NOT_FOUND
            : ErrorCode.enum.INTERNAL;
    // Không phải envelope của API (proxy / gateway trả HTML...) → câu chung, không hiện statusText tiếng Anh
    return new ApiError(response.status, code, t.common.errorTitle);
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

/** Câu ghi đè theo mã lỗi cho một thao tác cụ thể: `{ CONFLICT: t.classes.nameTaken }` */
export type ErrorOverrides = Partial<Record<ApiErrorCode, string>>;

/**
 * Thông báo cho người dùng (ADR 0025): API đã trả `message` đúng ngôn ngữ giao diện (header `Accept-Language`) →
 * hiện thẳng; lỗi do client tự tạo (mạng, upload, file sai...) đã mang câu từ `t.errors`. Chỉ ghi đè khi cần.
 */
export function errorMessage(error: unknown, overrides?: ErrorOverrides): string {
  if (isApiError(error)) return overrides?.[error.code] ?? (error.message || t.common.errorTitle);
  if (error instanceof Error && error.message) return error.message;
  return t.common.errorTitle;
}
