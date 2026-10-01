/**
 * Gọi API Phonics Arcade (`${API_URL}/api${path}`), parse response bằng zod schema của @phonics/contracts,
 * lỗi gom về `ApiError`.
 *
 * Token:
 *  - access token chỉ giữ trong bộ nhớ module này, gắn `Authorization: Bearer`;
 *  - refresh token nhận qua body (header `X-Refresh-Transport: body` cho mọi route /auth/*), authStore lưu
 *    localStorage. Server xoay refresh token mỗi lần refresh → luôn ghi đè bản mới.
 *  - 401 ở bất kỳ lời gọi nào → refresh (single-flight: nhiều lời gọi 401 cùng lúc chỉ refresh một lần) → gọi
 *    lại đúng một lần; vẫn 401 hoặc refresh bị từ chối → xoá phiên, phát sự kiện `signedOut` (authStore nghe).
 */
import { API_PREFIX, AuthResponse, ENDPOINTS, REFRESH_TRANSPORT_HEADER } from '@phonics/contracts';
import type { ZodType } from 'zod';
import { ApiError } from '@/shared/api/errors';
import { API_URL } from '@/shared/config';
import { filenameFromDisposition } from '@/shared/utils/download';

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions<T> {
  method?: HttpMethod;
  body?: unknown;
  /** Query string — bỏ qua undefined / null / chuỗi rỗng */
  query?: QueryParams;
  /** Parse response; không có thì trả JSON thô (hoặc undefined với 204) */
  schema?: ZodType<T>;
  /** false = không gắn bearer, không refresh (đăng nhập, public) */
  auth?: boolean;
  signal?: AbortSignal;
}

export interface Session {
  accessToken: string | null;
  refreshToken: string | null;
}

export type SessionEvent = { type: 'refreshed'; auth: AuthResponse } | { type: 'signedOut' };
type SessionListener = (event: SessionEvent) => void;

let session: Session = { accessToken: null, refreshToken: null };
const listeners = new Set<SessionListener>();
let refreshing: Promise<AuthResponse> | null = null;

export const getSession = (): Session => session;

export function setSession(next: Partial<Session>): void {
  session = { ...session, ...next };
}

export function clearSession(): void {
  session = { accessToken: null, refreshToken: null };
}

/** authStore đăng ký để lưu refresh token mới / về trạng thái chưa đăng nhập */
export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(event: SessionEvent): void {
  for (const listener of listeners) listener(event);
}

/** Ghép URL đầy đủ, bỏ qua tham số rỗng */
export function buildUrl(path: string, query?: QueryParams): string {
  const url = new URL(`${API_URL}${API_PREFIX}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Mất phiên: xoá token và báo cho store (không gọi server) */
function dropSession(): void {
  clearSession();
  emit({ type: 'signedOut' });
}

/**
 * Lấy access token mới bằng refresh token hiện có. Gộp nhiều lời gọi đồng thời thành một.
 * Thất bại → xoá phiên + `signedOut`.
 */
export function refreshSession(): Promise<AuthResponse> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refreshToken = session.refreshToken;
    if (!refreshToken) {
      dropSession();
      throw new ApiError(401, 'UNAUTHORIZED', 'No refresh token');
    }
    let response: Response;
    try {
      response = await fetch(buildUrl(ENDPOINTS.auth.refresh), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [REFRESH_TRANSPORT_HEADER]: 'body' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      // Mất mạng: giữ nguyên phiên để thử lại sau, không đăng xuất
      throw new ApiError(0, 'NETWORK', error instanceof Error ? error.message : 'Network error');
    }
    if (!response.ok) {
      const apiError = await ApiError.fromResponse(response);
      if (response.status === 401 || response.status === 403) dropSession();
      throw apiError;
    }
    const parsed = AuthResponse.safeParse(await response.json());
    if (!parsed.success) {
      dropSession();
      throw new ApiError(response.status, 'BAD_RESPONSE', 'Invalid refresh response');
    }
    const auth = parsed.data;
    // LUÔN lưu refresh token xoay vòng (token cũ bị thu hồi ngay sau khi dùng)
    session = { accessToken: auth.accessToken, refreshToken: auth.refreshToken ?? refreshToken };
    emit({ type: 'refreshed', auth });
    return auth;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Gửi request có gắn bearer; 401 thì refresh rồi gửi lại một lần */
async function send<T>(path: string, options: RequestOptions<T>, retried = false): Promise<Response> {
  const auth = options.auth !== false;
  const headers = new Headers();
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (path.startsWith('/auth/')) headers.set(REFRESH_TRANSPORT_HEADER, 'body');
  if (auth) {
    // Khởi động: có refresh token (localStorage) nhưng chưa có access token → refresh trước
    if (!session.accessToken && session.refreshToken) await refreshSession();
    if (session.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK', error instanceof Error ? error.message : 'Network error');
  }

  if (response.status === 401 && auth) {
    if (retried || !session.refreshToken) {
      dropSession();
      throw await ApiError.fromResponse(response);
    }
    await refreshSession();
    return send(path, options, true);
  }
  return response;
}

/** Gọi API, trả JSON đã parse (schema) hoặc undefined khi 204 */
export async function request<T = unknown>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const response = await send(path, options);
  if (!response.ok) throw await ApiError.fromResponse(response);
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(response.status, 'BAD_RESPONSE', 'Response is not JSON');
  }
  if (!options.schema) return data as T;
  const parsed = options.schema.safeParse(data);
  if (!parsed.success) {
    console.error('[api] response lệch contract', path, parsed.error.issues);
    throw new ApiError(response.status, 'BAD_RESPONSE', 'Response does not match contract');
  }
  return parsed.data;
}

export interface DownloadedFile {
  blob: Blob;
  filename: string;
}

/** Tải file (xlsx / pdf) có gắn bearer; tên file lấy từ Content-Disposition (`filename*=UTF-8''...`) */
export async function downloadFile(
  path: string,
  query?: QueryParams,
  fallbackName = 'download',
): Promise<DownloadedFile> {
  const response = await send(path, { query });
  if (!response.ok) throw await ApiError.fromResponse(response);
  const blob = await response.blob();
  const filename = filenameFromDisposition(response.headers.get('Content-Disposition')) ?? fallbackName;
  return { blob, filename };
}
