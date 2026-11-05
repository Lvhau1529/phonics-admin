import { useState } from 'react';

const PREFIX = 'phonics-admin:tuition-notices-sent:';

function read(scope: string): string[] {
  try {
    const raw = localStorage.getItem(PREFIX + scope);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

function write(scope: string, keys: readonly string[]): void {
  try {
    if (keys.length) localStorage.setItem(PREFIX + scope, JSON.stringify(keys));
    else localStorage.removeItem(PREFIX + scope);
  } catch {
    // Trình duyệt chặn lưu trữ: vẫn đánh dấu trong phiên hiện tại
  }
}

/**
 * Đánh dấu "đã gửi" từng tin nhắn theo phạm vi (tháng + lớp) — chỉ lưu trên trình duyệt này để admin theo dõi tiến độ
 * gửi tay, không phải dữ liệu nghiệp vụ.
 */
export function useSentMarks(scope: string) {
  const [marks, setMarks] = useState<Record<string, string[]>>({});
  const keys = marks[scope] ?? read(scope);
  const save = (next: string[]) => {
    write(scope, next);
    setMarks((m) => ({ ...m, [scope]: next }));
  };
  return {
    has: (key: string) => keys.includes(key),
    count: keys.length,
    set: (key: string, sent: boolean) =>
      save(sent ? [...new Set([...keys, key])] : keys.filter((k) => k !== key)),
    clear: () => save([]),
  };
}
