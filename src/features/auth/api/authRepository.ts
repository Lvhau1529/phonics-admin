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
  type LoginBody,
  type LogoutBody,
  type UpdateProfileBody,
} from '@phonics/contracts';
import { HttpMethod, request } from '@/shared/api/client';

export const authRepository = {
  /** Đăng nhập email / mật khẩu (header body-transport do client tự gắn cho /auth/*) */
  login: (body: LoginBody) =>
    request(ENDPOINTS.auth.login, { method: HttpMethod.POST, body, schema: AuthResponse, auth: false }),

  /** Thu hồi refresh token hiện tại (all = mọi thiết bị) */
  logout: (body: LogoutBody) => request<void>(ENDPOINTS.auth.logout, { method: HttpMethod.POST, body, auth: false }),

  /** Người đang đăng nhập + quyền hiệu lực */
  me: () => request(ENDPOINTS.auth.me, { schema: MeResponse }),

  changePassword: (body: ChangePasswordBody) =>
    request<void>(ENDPOINTS.auth.changePassword, { method: HttpMethod.POST, body }),

  updateProfile: (body: UpdateProfileBody) =>
    request(ENDPOINTS.me.profile, { method: HttpMethod.PATCH, body, schema: User }),
};
