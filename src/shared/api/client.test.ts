import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_PREFIX } from '@phonics/contracts';
import { z } from 'zod';
import {
  clearSession,
  downloadFile,
  getSession,
  request,
  setSession,
  subscribeSession,
  type SessionEvent,
} from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';

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

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

const authOk = (suffix: string) =>
  json(200, {
    accessToken: `access-${suffix}`,
    refreshToken: `refresh-${suffix}`,
    expiresIn: 900,
    user: USER,
  });

describe('client.request', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const events: SessionEvent[] = [];
  let unsubscribe: () => void;

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    events.length = 0;
    unsubscribe = subscribeSession((e) => events.push(e));
    setSession({ accessToken: 'access-old', refreshToken: 'refresh-old' });
  });

  afterEach(() => {
    unsubscribe();
    clearSession();
    vi.unstubAllGlobals();
  });

  it('gắn bearer, bỏ query rỗng, parse response bằng schema', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { items: [], total: 0, page: 1, pageSize: 20 }));
    const data = await request('/classes', {
      query: { page: 1, q: undefined, archived: '', sort: 'name:asc' },
      schema: z.object({ total: z.number() }),
    });
    expect(data).toEqual({ total: 0 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`http://localhost:3000${API_PREFIX}/classes?page=1&sort=name%3Aasc`);
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer access-old');
  });

  it('401 → refresh (một lần cho nhiều lời gọi) → gọi lại với token mới, lưu refresh token xoay vòng', async () => {
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      const auth = new Headers(init?.headers).get('Authorization');
      if (url.endsWith('/auth/refresh')) {
        expect(new Headers(init?.headers).get('X-Refresh-Transport')).toBe('body');
        expect(JSON.parse(String(init?.body))).toEqual({ refreshToken: 'refresh-old' });
        return authOk('new');
      }
      if (auth === 'Bearer access-old')
        return json(401, { statusCode: 401, code: 'TOKEN_EXPIRED', message: 'expired' });
      return json(200, { ok: url });
    });

    const [a, b] = await Promise.all([
      request<{ ok: string }>('/classes'),
      request<{ ok: string }>('/students'),
    ]);
    expect(a.ok).toContain('/classes');
    expect(b.ok).toContain('/students');

    const refreshCalls = fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
    expect(getSession()).toEqual({ accessToken: 'access-new', refreshToken: 'refresh-new' });
    expect(events).toEqual([
      { type: 'refreshed', auth: expect.objectContaining({ accessToken: 'access-new' }) },
    ]);
  });

  it('refresh bị từ chối → xoá phiên, phát signedOut, ném ApiError', async () => {
    fetchMock.mockImplementation(async (input) => {
      if (String(input).endsWith('/auth/refresh')) {
        return json(401, { statusCode: 401, code: 'REFRESH_REUSED', message: 'reused' });
      }
      return json(401, { statusCode: 401, code: 'TOKEN_EXPIRED', message: 'expired' });
    });
    await expect(request('/classes')).rejects.toMatchObject({ code: 'REFRESH_REUSED', status: 401 });
    expect(getSession()).toEqual({ accessToken: null, refreshToken: null });
    expect(events).toEqual([{ type: 'signedOut' }]);
  });

  it('vẫn 401 sau khi refresh → chỉ gọi lại một lần rồi đăng xuất', async () => {
    fetchMock.mockImplementation(async (input) => {
      if (String(input).endsWith('/auth/refresh')) return authOk('new');
      return json(401, { statusCode: 401, code: 'UNAUTHORIZED', message: 'no' });
    });
    await expect(request('/classes')).rejects.toBeInstanceOf(ApiError);
    const apiCalls = fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/classes'));
    expect(apiCalls).toHaveLength(2);
    expect(events.at(-1)).toEqual({ type: 'signedOut' });
  });

  it('lỗi 4xx → ApiError có code + details; 204 → undefined; lỗi mạng → NETWORK', async () => {
    fetchMock.mockResolvedValueOnce(
      json(400, {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'bad',
        details: { email: ['Invalid'] },
      }),
    );
    await expect(request('/x', { method: 'POST', body: {} })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { email: ['Invalid'] },
    });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(request('/x', { method: 'DELETE' })).resolves.toBeUndefined();
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(request('/x')).rejects.toMatchObject({ code: 'NETWORK', status: 0 });
  });

  it('response lệch contract → BAD_RESPONSE', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { total: 'x' }));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(request('/x', { schema: z.object({ total: z.number() }) })).rejects.toMatchObject({
      code: 'BAD_RESPONSE',
    });
    spy.mockRestore();
  });

  it('downloadFile lấy tên file từ Content-Disposition (filename*=UTF-8)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('abc', {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="x.xlsx"; filename*=UTF-8''x%E1%BA%BFp%20h%E1%BA%A1ng.xlsx`,
        },
      }),
    );
    const file = await downloadFile('/reports/classes/1/ranking.xlsx', { range: 'week' });
    expect(file.filename).toBe('xếp hạng.xlsx');
    expect(await file.blob.text()).toBe('abc');
  });
});
