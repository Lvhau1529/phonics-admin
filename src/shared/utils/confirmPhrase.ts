/** Chuẩn hoá chuỗi gõ xác nhận: bỏ dấu tiếng Việt, không phân biệt hoa thường, gộp khoảng trắng */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/** Người dùng đã gõ đúng cụm xác nhận chưa ("xoa", "Xóa", "XOÁ" đều khớp "XÓA") */
export function matchesConfirmPhrase(typed: string, phrase: string): boolean {
  return normalize(typed) === normalize(phrase);
}
