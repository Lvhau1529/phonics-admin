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
import { request } from '@/shared/api/client';

export const authApi = {
  /** Đăng nhập email / mật khẩu (header body-transport do client tự gắn cho /auth/*) */
  login: (body: LoginBody) =>
    request(ENDPOINTS.auth.login, { method: 'POST', body, schema: AuthResponse, auth: false }),

  /** Thu hồi refresh token hiện tại (all = mọi thiết bị) */
  logout: (body: LogoutBody) => request<void>(ENDPOINTS.auth.logout, { method: 'POST', body, auth: false }),

  /** Người đang đăng nhập + quyền hiệu lực */
  me: () => request(ENDPOINTS.auth.me, { schema: MeResponse }),

  changePassword: (body: ChangePasswordBody) =>
    request<void>(ENDPOINTS.auth.changePassword, { method: 'POST', body }),

  updateProfile: (body: UpdateProfileBody) =>
    request(ENDPOINTS.me.profile, { method: 'PATCH', body, schema: User }),
};
