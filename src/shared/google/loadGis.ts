/**
 * Nạp script Google Identity Services đúng một lần, chỉ khi cần nút Google (trang đăng nhập / hồ sơ) — không tải sẵn.
 */
const GIS_SRC = 'https://accounts.google.com/gsi/client';

let loading: Promise<void> | null = null;

export function loadGis(): Promise<void> {
  if (typeof google !== 'undefined' && google.accounts?.id) return Promise.resolve();
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loading = null;
        script.remove();
        reject(new Error('Google Identity Services failed to load'));
      };
      document.head.append(script);
    });
  }
  return loading;
}

/** Callback của nút đang hiện (mỗi lúc chỉ một nút Google trên trang: đăng nhập hoặc hồ sơ) */
let onCredential: ((idToken: string) => void) | null = null;
let initialized = false;

/**
 * `google.accounts.id.initialize` chỉ gọi một lần (gọi lại GIS cảnh báo "called multiple times"); các nút sau chỉ
 * đổi callback nhận ID token. Gọi sau khi `loadGis()` resolve.
 */
export function initGis(clientId: string, callback: (idToken: string) => void): void {
  onCredential = callback;
  if (initialized) return;
  initialized = true;
  google.accounts.id.initialize({
    client_id: clientId,
    callback: ({ credential }) => onCredential?.(credential),
    ux_mode: 'popup',
    itp_support: true,
  });
}
