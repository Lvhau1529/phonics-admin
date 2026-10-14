import type { Cell } from '@phonics/contracts';
import { seededRandom } from '@/features/questions/utils/shuffle';

export type SearchDirection = 'H' | 'V' | 'D';

export interface WordPlacement {
  word: string;
  start: Cell;
  end: Cell;
}

export interface WordSearchResult {
  grid: string[];
  placements: WordPlacement[];
  /** Từ không đặt được (lưới quá nhỏ) */
  failed: string[];
}

const VECTORS: Record<SearchDirection, [number, number][]> = {
  H: [[0, 1]],
  V: [[1, 0]],
  D: [[1, 1]],
};

/**
 * Sinh lưới tìm từ: đặt từng từ (dài trước) theo hướng cho phép, cho phép giao nhau khi chữ trùng,
 * ô trống điền chữ ngẫu nhiên. Có seed → lặp lại được (nút "Tạo lại" đổi seed).
 */
export function generateWordSearch(options: {
  words: readonly string[];
  rows: number;
  cols: number;
  directions?: readonly SearchDirection[];
  allowBackwards?: boolean;
  seed?: number;
}): WordSearchResult {
  const { rows, cols, directions = ['H', 'V'], allowBackwards = false } = options;
  const rand = seededRandom(options.seed ?? Math.floor(Math.random() * 1e9));
  const grid: (string | null)[][] = Array.from({ length: rows }, () => Array<string | null>(cols).fill(null));
  const placements: WordPlacement[] = [];
  const failed: string[] = [];
  const vectors = directions.flatMap((d) => VECTORS[d]);
  const words = [...options.words].map((w) => w.toLowerCase().replace(/[^a-z]/g, '')).filter(Boolean);
  words.sort((a, b) => b.length - a.length);

  for (const word of words) {
    const letters = allowBackwards && rand() < 0.3 ? [...word].reverse() : [...word];
    let placed = false;
    const candidates: { r: number; c: number; dr: number; dc: number }[] = [];
    for (const [dr, dc] of vectors) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const endR = r + dr * (letters.length - 1);
          const endC = c + dc * (letters.length - 1);
          if (endR >= rows || endC >= cols) continue;
          let ok = true;
          for (let i = 0; i < letters.length && ok; i++) {
            const cell = grid[r + dr * i][c + dc * i];
            if (cell !== null && cell !== letters[i]) ok = false;
          }
          if (ok) candidates.push({ r, c, dr, dc });
        }
      }
    }
    if (candidates.length) {
      const pick = candidates[Math.floor(rand() * candidates.length)];
      for (let i = 0; i < letters.length; i++) grid[pick.r + pick.dr * i][pick.c + pick.dc * i] = letters[i];
      const start = { r: pick.r, c: pick.c };
      const end = { r: pick.r + pick.dr * (letters.length - 1), c: pick.c + pick.dc * (letters.length - 1) };
      // Từ viết ngược: start/end theo chiều đọc đúng từ (đảo lại) để khớp answerKey
      placements.push(letters.join('') === word ? { word, start, end } : { word, start: end, end: start });
      placed = true;
    }
    if (!placed) failed.push(word);
  }

  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const rowsOut = grid.map((row) =>
    row.map((cell) => cell ?? alphabet[Math.floor(rand() * alphabet.length)]).join(''),
  );
  return { grid: rowsOut, placements, failed };
}

/** Các ô nằm trên đoạn thẳng start → end (ngang / dọc / chéo); null nếu không thẳng */
export function cellsBetween(start: Cell, end: Cell): Cell[] | null {
  const dr = Math.sign(end.r - start.r);
  const dc = Math.sign(end.c - start.c);
  const len = Math.max(Math.abs(end.r - start.r), Math.abs(end.c - start.c)) + 1;
  if (dr !== 0 && dc !== 0 && Math.abs(end.r - start.r) !== Math.abs(end.c - start.c)) return null;
  return Array.from({ length: len }, (_, i) => ({ r: start.r + dr * i, c: start.c + dc * i }));
}
