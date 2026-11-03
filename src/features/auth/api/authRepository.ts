/**
 * Repository xác thực / hồ sơ: chỉ khai báo endpoint (đường dẫn `ENDPOINTS`, method, body, schema contracts) và
 * trả DTO đúng như BE. Không map / format ở đây — việc đó của `AuthService`.
 */
import {
  AuthResponse,
  ENDPOINTS,
  MeResponse,
  User,
  type ChangePasswordBody,
  type GoogleBody,
  type LinkGoogleBody,
  type LoginBody,
  type LogoutBody,
  type UpdateProfileBody,
} from '@phonics/contracts';
import { HttpMethod, request } from '@/shared/api/client';

export const authRepository = {
  /** Đăng nhập email / mật khẩu (header body-transport do client tự gắn cho /auth/*) */
  login: (body: LoginBody) =>
    request(ENDPOINTS.auth.login, { method: HttpMethod.POST, body, schema: AuthResponse, auth: false }),

  /** Đăng nhập Google (`app: 'admin'`: email lạ → yêu cầu tài khoản giáo viên, 403 ACCOUNT_PENDING) */
  google: (body: GoogleBody) =>
    request(ENDPOINTS.auth.google, { method: HttpMethod.POST, body, schema: AuthResponse, auth: false }),

  /** Liên kết / gỡ Google của tài khoản đang đăng nhập → user mới */
  linkGoogle: (body: LinkGoogleBody) =>
    request(ENDPOINTS.auth.googleLink, { method: HttpMethod.POST, body, schema: User }),
  unlinkGoogle: () => request(ENDPOINTS.auth.googleLink, { method: HttpMethod.DELETE, schema: User }),

  /** Thu hồi refresh token hiện tại (all = mọi thiết bị) */
  logout: (body: LogoutBody) =>
    request<void>(ENDPOINTS.auth.logout, { method: HttpMethod.POST, body, auth: false }),

  /** Người đang đăng nhập + quyền hiệu lực */
  me: () => request(ENDPOINTS.auth.me, { schema: MeResponse }),

  changePassword: (body: ChangePasswordBody) =>
    request<void>(ENDPOINTS.auth.changePassword, { method: HttpMethod.POST, body }),

  updateProfile: (body: UpdateProfileBody) =>
    request(ENDPOINTS.me.profile, { method: HttpMethod.PATCH, body, schema: User }),
};
