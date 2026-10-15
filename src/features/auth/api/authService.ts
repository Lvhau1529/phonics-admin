/**
 * Service xác thực / hồ sơ: gọi `authRepository` rồi đổi `user` trong response → `UserModel`, kèm hook sửa hồ sơ /
 * đổi mật khẩu. authStore và trang chỉ gọi service. Phiên đăng nhập (`useAuth`, `useCan`) nằm ở authStore.
 */
import { useMutation } from '@tanstack/react-query';
import type {
  ChangePasswordBody,
  LoginBody,
  LogoutBody,
  Permission,
  UpdateProfileBody,
} from '@phonics/contracts';
import { authRepository } from '@/features/auth/api/authRepository';
// authStore cũng import service này: vòng import an toàn vì hai bên chỉ dùng nhau bên trong hàm
import { setCurrentUser } from '@/features/auth/authStore';
import { UserModel } from '@/features/auth/models/UserModel';

export interface LoginResult {
  accessToken: string;
  /** Chỉ có khi dùng body transport (admin luôn dùng) */
  refreshToken: string | null;
  user: UserModel;
}

export interface CurrentUser {
  user: UserModel;
  permissions: Permission[];
}

const api = {
  login: async (body: LoginBody): Promise<LoginResult> => {
    const auth = await authRepository.login(body);
    return {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken ?? null,
      user: new UserModel(auth.user),
    };
  },
  logout: (body: LogoutBody) => authRepository.logout(body),
  me: async (): Promise<CurrentUser> => {
    const me = await authRepository.me();
    return { user: new UserModel(me.user), permissions: me.permissions };
  },
  changePassword: (body: ChangePasswordBody) => authRepository.changePassword(body),
  updateProfile: async (body: UpdateProfileBody) => new UserModel(await authRepository.updateProfile(body)),
};

export const AuthService = {
  ...api,

  /** Sửa hồ sơ của chính mình; xong thì cập nhật user trong authStore */
  useUpdateProfile: () =>
    useMutation({
      mutationFn: (body: UpdateProfileBody) => api.updateProfile(body),
      onSuccess: setCurrentUser,
    }),

  useChangePassword: () =>
    useMutation({ mutationFn: (body: ChangePasswordBody) => api.changePassword(body) }),
};
