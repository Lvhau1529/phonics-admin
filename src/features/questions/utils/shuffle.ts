/** Sinh số giả ngẫu nhiên có seed (mulberry32) để xáo trộn lặp lại được trong test */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates; không có seed thì dùng Math.random */
export function shuffle<T>(items: readonly T[], seed?: number): T[] {
  const rand = seed === undefined ? Math.random : seededRandom(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Xáo chữ cái của một từ, bảo đảm khác từ gốc (nếu có thể) */
export function scrambleWord(word: string, seed?: number): string {
  const letters = word
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .split('');
  if (letters.length < 2) return letters.join('');
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = shuffle(letters, seed === undefined ? undefined : seed + attempt).join('');
    if (candidate !== letters.join('')) return candidate;
  }
  return [...letters].reverse().join('');
}

/** Xáo thứ tự thẻ từ, bảo đảm khác thứ tự gốc (nếu ≥ 2 thẻ) */
export function shuffleChips(words: readonly string[], seed?: number): string[] {
  if (words.length < 2) return [...words];
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = shuffle(words, seed === undefined ? undefined : seed + attempt);
    if (candidate.some((w, i) => w !== words[i])) return candidate;
  }
  return [...words].reverse();
}
