import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { putFile } from '@/shared/api/upload';

/** XMLHttpRequest giả: ghi lại header, phát progress / load / error theo kịch bản */
class FakeXhr {
  static instances: FakeXhr[] = [];
  static nextStatus = 200;
  static fail = false;
  method = '';
  url = '';
  status = 0;
  headers: Record<string, string> = {};
  upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } =
    {
      onprogress: null,
    };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  aborted = false;

  constructor() {
    FakeXhr.instances.push(this);
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: Blob) {
    this.upload.onprogress?.({ lengthComputable: true, loaded: body.size / 2, total: body.size });
    this.upload.onprogress?.({ lengthComputable: true, loaded: body.size, total: body.size });
    if (FakeXhr.fail) return this.onerror?.();
    this.status = FakeXhr.nextStatus;
    this.onload?.();
  }
  abort() {
    this.aborted = true;
    this.onabort?.();
  }
}

describe('putFile', () => {
  beforeEach(() => {
    FakeXhr.instances = [];
    FakeXhr.nextStatus = 200;
    FakeXhr.fail = false;
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('PUT với header đã ký, báo tiến độ, bỏ Authorization', async () => {
    const progress: number[] = [];
    await putFile('https://bucket/x', new Blob(['abcd']), {
      headers: { 'Content-Type': 'image/png', Authorization: 'Bearer nope' },
      onProgress: (p) => progress.push(p.percent),
    });
    const xhr = FakeXhr.instances[0];
    expect(xhr.method).toBe('PUT');
    expect(xhr.headers).toEqual({ 'Content-Type': 'image/png' });
    expect(progress).toEqual([50, 100]);
  });

  it('status ngoài 2xx → ApiError UPLOAD; lỗi mạng → NETWORK', async () => {
    FakeXhr.nextStatus = 403;
    await expect(putFile('https://bucket/x', new Blob(['a']))).rejects.toMatchObject({
      code: 'UPLOAD',
      status: 403,
    });
    FakeXhr.fail = true;
    await expect(putFile('https://bucket/x', new Blob(['a']))).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('signal đã abort → AbortError, không gửi', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      putFile('https://bucket/x', new Blob(['a']), { signal: controller.signal }),
    ).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
