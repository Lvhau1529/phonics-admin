import { theme } from 'antd';
import type { CSSProperties } from 'react';

/** Màu viền / nền theo kết quả phần: đúng xanh, sai đỏ, chưa chấm / không rõ → mặc định */
export function usePartStyle() {
  const { token } = theme.useToken();
  return (ok: boolean | undefined, selected = false): CSSProperties => {
    if (ok === true) return { borderColor: token.colorSuccess, background: token.colorSuccessBg };
    if (ok === false) return { borderColor: token.colorError, background: token.colorErrorBg };
    if (selected) return { borderColor: token.colorPrimary, background: token.colorPrimaryBg };
    return {};
  };
}
