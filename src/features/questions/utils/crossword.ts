import type { Cell, Direction } from '@phonics/contracts';

export interface CrosswordEntry {
  number: number;
  direction: Direction;
  start: Cell;
  answer: string;
}

export const cellKey = (c: Cell): string => `${c.r},${c.c}`;

/** Các ô của một từ theo hướng */
export function entryCells(entry: Pick<CrosswordEntry, 'direction' | 'start' | 'answer'>): Cell[] {
  return [...entry.answer].map((_, i) => ({
    r: entry.direction === 'down' ? entry.start.r + i : entry.start.r,
    c: entry.direction === 'across' ? entry.start.c + i : entry.start.c,
  }));
}

/** Lưới chữ từ các từ đã đặt: ô → chữ; `conflicts` = ô mà hai từ giao nhau nhưng chữ khác */
export function buildGrid(
  entries: readonly CrosswordEntry[],
  rows: number,
  cols: number,
): { letters: Map<string, string>; conflicts: Set<string>; outOfBounds: number[] } {
  const letters = new Map<string, string>();
  const conflicts = new Set<string>();
  const outOfBounds: number[] = [];
  entries.forEach((entry, idx) => {
    const cells = entryCells(entry);
    const word = entry.answer.toLowerCase();
    if (cells.some((c) => c.r < 0 || c.c < 0 || c.r >= rows || c.c >= cols)) outOfBounds.push(idx);
    cells.forEach((cell, i) => {
      const key = cellKey(cell);
      const existing = letters.get(key);
      if (existing !== undefined && existing !== word[i]) conflicts.add(key);
      else letters.set(key, word[i]);
    });
  });
  return { letters, conflicts, outOfBounds };
}

/**
 * Xếp tự động kiểu tham lam: từ dài nhất nằm ngang giữa lưới, các từ sau tìm chữ chung với từ đã đặt để giao vuông góc;
 * không giao được thì đặt vào hàng / cột trống. Trả về bản sao entries đã có start / direction.
 */
export function autoArrange(
  words: readonly { number: number; answer: string }[],
  rows: number,
  cols: number,
): CrosswordEntry[] {
  const sorted = [...words].filter((w) => w.answer.trim()).sort((a, b) => b.answer.length - a.answer.length);
  const placed: CrosswordEntry[] = [];
  const fits = (entry: CrosswordEntry): boolean => {
    const cells = entryCells(entry);
    if (cells.some((c) => c.r < 0 || c.c < 0 || c.r >= rows || c.c >= cols)) return false;
    const { conflicts } = buildGrid([...placed, entry], rows, cols);
    if (conflicts.size) return false;
    // Không cho hai từ cùng hướng dính liền / chồng nhau
    return !placed.some(
      (p) =>
        p.direction === entry.direction &&
        entryCells(p).some((pc) => cells.some((c) => cellKey(c) === cellKey(pc))),
    );
  };

  for (const w of sorted) {
    const answer = w.answer.toLowerCase().replace(/[^a-z]/g, '');
    if (!placed.length) {
      const entry: CrosswordEntry = {
        number: w.number,
        direction: 'across',
        start: { r: Math.floor(rows / 2), c: Math.max(0, Math.floor((cols - answer.length) / 2)) },
        answer,
      };
      placed.push(fits(entry) ? entry : { ...entry, start: { r: 0, c: 0 } });
      continue;
    }
    let done = false;
    for (const p of placed) {
      if (done) break;
      const pCells = entryCells(p);
      for (let i = 0; i < answer.length && !done; i++) {
        for (let j = 0; j < p.answer.length && !done; j++) {
          if (answer[i] !== p.answer[j]) continue;
          const direction: Direction = p.direction === 'across' ? 'down' : 'across';
          const cross = pCells[j];
          const start: Cell =
            direction === 'down' ? { r: cross.r - i, c: cross.c } : { r: cross.r, c: cross.c - i };
          const entry: CrosswordEntry = { number: w.number, direction, start, answer };
          if (fits(entry)) {
            placed.push(entry);
            done = true;
          }
        }
      }
    }
    if (!done) {
      // Hàng trống đầu tiên (ngang) rồi cột trống (dọc)
      outer: for (const direction of ['across', 'down'] as Direction[]) {
        const limitR = direction === 'across' ? rows : rows - answer.length + 1;
        const limitC = direction === 'across' ? cols - answer.length + 1 : cols;
        for (let r = 0; r < limitR; r++) {
          for (let c = 0; c < limitC; c++) {
            const entry: CrosswordEntry = { number: w.number, direction, start: { r, c }, answer };
            if (fits(entry)) {
              placed.push(entry);
              done = true;
              break outer;
            }
          }
        }
      }
    }
    if (!done) placed.push({ number: w.number, direction: 'across', start: { r: 0, c: 0 }, answer });
  }
  return placed;
}
