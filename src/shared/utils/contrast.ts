/**
 * Tính tương phản màu theo WCAG 2.x (https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio).
 * Dùng trong test theme để chắc chữ trên nút primary / link đủ đọc (AA: ≥ 4.5 chữ thường, ≥ 3 chữ to).
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** `#rgb` / `#rrggbb` → { r, g, b } (0–255). Sai định dạng → ném lỗi để test fail sớm. */
export function hexToRgb(hex: string): Rgb {
  const raw = hex.trim().replace(/^#/, '');
  const full = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw;
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`Invalid hex color: ${hex}`);
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

const channel = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** Độ chói tương đối 0 (đen) – 1 (trắng) */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Tỉ lệ tương phản 1 – 21 giữa hai màu (không phụ thuộc thứ tự) */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la >= lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/** Đạt WCAG AA cho chữ thường (≥ 4.5) */
export const meetsAA = (fg: string, bg: string): boolean => contrastRatio(fg, bg) >= 4.5;
