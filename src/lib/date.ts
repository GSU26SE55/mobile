/**
 * Định dạng ngày giờ dùng chung cho toàn bộ mobile app — chuẩn `dd/MM/yyyy HH:mm`.
 *
 * Viết tay bằng `padStart` thay vì dùng `date-fns`/`dayjs`: mobile không cài thư viện
 * date nào và không thêm package mới nếu stack hiện tại đã đủ. `toLocaleString('vi-VN')`
 * không dùng được vì Hermes trả về thứ tự và độ chi tiết khác nhau giữa iOS/Android
 * (ví dụ "13:31:16 13/7/2026"), nên timestamp hiển thị không nhất quán giữa các màn hình.
 *
 * Các hàm này chỉ dành cho *thời điểm* (timestamp). Khoảng thời gian (đếm ngược SLA,
 * độ dài voice message, thời lượng xử lý) có định dạng riêng tại nơi sử dụng.
 */

type DateInput = string | number | Date | null | undefined;

/** Giá trị hiển thị khi input rỗng hoặc không parse được. */
export const EMPTY_DATE = '—';

const pad = (n: number) => String(n).padStart(2, '0');

function toDate(input: DateInput): Date | null {
  if (input === null || input === undefined || input === '') return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "13/07/2026 09:05" */
export function formatDateTime(input: DateInput): string {
  const d = toDate(input);
  if (!d) return EMPTY_DATE;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "13/07/2026" */
export function formatDate(input: DateInput): string {
  const d = toDate(input);
  if (!d) return EMPTY_DATE;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "13/07" — dùng cho chip, list dày và trục biểu đồ, nơi năm sẽ làm tràn chữ. */
export function formatDateShort(input: DateInput): string {
  const d = toDate(input);
  if (!d) return EMPTY_DATE;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** "07/26" — trục biểu đồ theo tháng. */
export function formatMonthShort(input: DateInput): string {
  const d = toDate(input);
  if (!d) return EMPTY_DATE;
  return `${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
}

/** "09:05" */
export function formatTime(input: DateInput): string {
  const d = toDate(input);
  if (!d) return EMPTY_DATE;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * "09:05:31" — chỉ dùng cho bảng log cảm biến, nơi nhiều bản ghi rơi vào cùng một phút
 * và bỏ giây sẽ làm các dòng khác nhau trông giống hệt nhau.
 */
export function formatTimeSeconds(input: DateInput): string {
  const d = toDate(input);
  if (!d) return EMPTY_DATE;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
