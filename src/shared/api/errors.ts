import { ApiErrorBody, type ErrorCode } from '@phonics/contracts';
import { t } from '@/shared/i18n/vi';

/** Mã lỗi của API + hai mã riêng của client (không tới được server / response sai định dạng) */
export type ApiErrorCode = ErrorCode | 'NETWORK' | 'BAD_RESPONSE';

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
        ? 'UNAUTHORIZED'
        : response.status === 403
          ? 'FORBIDDEN'
          : response.status === 404
            ? 'NOT_FOUND'
            : 'INTERNAL';
    return new ApiError(response.status, code, response.statusText || code);
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

/** Thông báo tiếng Việt cho người dùng: ưu tiên mã lỗi; lỗi lạ hiện chuỗi chung */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) {
    // Lỗi validate: nếu server chỉ ra field thì message chung, chi tiết đã vào form
    return t.errors[error.code] ?? error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return t.common.errorTitle;
}
