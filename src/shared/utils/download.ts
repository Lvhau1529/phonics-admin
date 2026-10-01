/** Tên file từ header Content-Disposition (ưu tiên `filename*=UTF-8''...`, rồi `filename="..."`) */
export function filenameFromDisposition(header: string | null): string | undefined {
  if (!header) return undefined;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      // rơi xuống filename ASCII
    }
  }
  const ascii = /filename="?([^";]+)"?/i.exec(header);
  return ascii ? ascii[1].trim() : undefined;
}

/** Kích hoạt tải xuống trên trình duyệt từ Blob */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Giải phóng sau khi trình duyệt đã bắt đầu tải
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
