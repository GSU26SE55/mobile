import { describe, expect, it } from "vitest";
import {
  EMPTY_DATE,
  formatDate,
  formatDateShort,
  formatDateTime,
  formatMonthShort,
  formatTime,
  formatTimeSeconds,
} from "@/src/lib/date";

// Tháng trong JS đếm từ 0 — tháng 7 là chỉ số 6.
const sample = new Date(2026, 6, 13, 9, 5, 31);

const formatters = [
  ["formatDateTime", formatDateTime],
  ["formatDate", formatDate],
  ["formatDateShort", formatDateShort],
  ["formatMonthShort", formatMonthShort],
  ["formatTime", formatTime],
  ["formatTimeSeconds", formatTimeSeconds],
] as const;

describe("định dạng thời điểm", () => {
  it.each([
    ["formatDateTime", formatDateTime, "13/07/2026 09:05"],
    ["formatDate", formatDate, "13/07/2026"],
    ["formatDateShort", formatDateShort, "13/07"],
    ["formatMonthShort", formatMonthShort, "07/26"],
    ["formatTime", formatTime, "09:05"],
    ["formatTimeSeconds", formatTimeSeconds, "09:05:31"],
  ])("%s cho ra %s", (_name, fn, expected) => {
    expect(fn(sample)).toBe(expected);
  });

  // Ngày và tháng một chữ số phải có số 0 đứng trước, nếu không các dòng trong danh sách
  // sẽ so le nhau khi đọc lướt.
  it("đệm 0 cho ngày, tháng, giờ, phút một chữ số", () => {
    expect(formatDateTime(new Date(2026, 0, 3, 7, 5))).toBe("03/01/2026 07:05");
  });

  it("nhận chuỗi ISO", () => {
    expect(formatDate(new Date(2026, 6, 13).toISOString())).toBe("13/07/2026");
  });

  it("nhận số mili giây", () => {
    expect(formatDate(sample.getTime())).toBe("13/07/2026");
  });
});

describe("đầu vào rỗng hoặc hỏng", () => {
  // Backend trả null cho những mốc chưa xảy ra (chưa giải quyết, chưa đóng). Ô đó phải
  // hiện dấu gạch, không phải "NaN/NaN/NaN" hay "Invalid Date".
  it.each([null, undefined, "", "không-phải-ngày", NaN])(
    "mọi hàm trả về dấu gạch với đầu vào %s",
    (input) => {
      for (const [, fn] of formatters) {
        expect(fn(input as never)).toBe(EMPTY_DATE);
      }
    },
  );

  it("Date không hợp lệ cũng trả về dấu gạch", () => {
    expect(formatDateTime(new Date("xyz"))).toBe(EMPTY_DATE);
  });

  // Số 0 là mốc epoch hợp lệ, không phải giá trị rỗng — không được rơi vào nhánh dấu gạch.
  it("mốc 0 vẫn là thời điểm hợp lệ", () => {
    expect(formatDate(0)).not.toBe(EMPTY_DATE);
  });
});
