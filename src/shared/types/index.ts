/** Kiểu giá trị của một object hằng: `const X = { A: 'a' } as const; type X = ValueOf<typeof X>` → `'a'` */
export type ValueOf<T> = T[keyof T];
