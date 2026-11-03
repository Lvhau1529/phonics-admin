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
