import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStatus, bootstrapAuth, resetAuthStoreForTests, useAuthState } from '@/features/auth/authStore';
import { AUTH_STORAGE_KEY } from '@/shared/config';

const USER = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'admin@phonics.local',
  role: 'ADMIN',
  status: 'ACTIVE',
  provider: 'LOCAL',
  displayName: 'Admin',
  avatarKey: 'pip',
  class: null,
  createdAt: '2026-10-01T00:00:00.000Z',
};
const STORED = JSON.stringify({ user: USER, refreshToken: 'refresh-old' });

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const apiError = (status: number, code: string) => json(status, { statusCode: status, code, message: code });

const statusNow = () => renderHook(() => useAuthState()).result.current.status;

describe('bootstrapAuth: khôi phục phiên từ localStorage', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    resetAuthStoreForTests();
    localStorage.setItem(AUTH_STORAGE_KEY, STORED);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('refresh bị từ chối (401) → đăng xuất, xoá token đã lưu', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));
    await bootstrapAuth();
    expect(statusNow()).toBe(AuthStatus.ANONYMOUS);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('lỗi tạm thời (429) → thử lại; hết lượt vẫn giữ token để lần tải sau khôi phục', async () => {
    fetchMock.mockImplementation(async () => apiError(429, 'TOO_MANY_REQUESTS'));
    const done = bootstrapAuth();
    await vi.runAllTimersAsync();
    await done;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(statusNow()).toBe(AuthStatus.ANONYMOUS);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe(STORED);
  });

  it('lỗi tạm thời rồi thành công → đăng nhập lại bình thường', async () => {
    fetchMock
      .mockResolvedValueOnce(apiError(429, 'TOO_MANY_REQUESTS'))
      .mockResolvedValueOnce(
        json(200, { accessToken: 'a', refreshToken: 'refresh-new', expiresIn: 900, user: USER }),
      )
      .mockResolvedValueOnce(json(200, { user: USER, permissions: [] }));
    const done = bootstrapAuth();
    await vi.runAllTimersAsync();
    await done;
    expect(statusNow()).toBe(AuthStatus.AUTHENTICATED);
    expect(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? '{}')).toMatchObject({
      refreshToken: 'refresh-new',
    });
  });
});
