/** Hai danh sách id có cùng tập phần tử (không xét thứ tự) — dùng để biết lựa chọn đã đổi so với server chưa */
export const sameIds = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id) => b.includes(id));
