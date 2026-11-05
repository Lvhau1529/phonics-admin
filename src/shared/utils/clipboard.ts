/**
 * Sao chép chữ vào clipboard. `navigator.clipboard` chỉ có trên HTTPS / localhost → mở admin qua IP LAN (http) thì
 * dùng cách cũ (textarea + `execCommand('copy')`). Trả false khi trình duyệt chặn cả hai.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // rơi xuống cách cũ
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    return ok;
  } catch {
    return false;
  }
}
