import { beforeEach, describe, expect, it, vi } from "vitest";

const alert = vi.fn();
// `react-native` không nạp được ngoài Metro; chỉ Alert được dùng ở module này.
vi.mock("react-native", () => ({ Alert: { alert: (...a: unknown[]) => alert(...a) } }));

const { EntityError, HttpError, handleErrorApi, toUserMessage } = await import(
  "@/src/lib/errors"
);

describe("toUserMessage", () => {
  // Backend trả mã lỗi nghiệp vụ ngay trong `message`; hiện thẳng lên Alert thì người dùng
  // đọc được "CHAT_DUPLICATE_MESSAGE_LIMIT".
  it.each(["CHAT_DUPLICATE_MESSAGE_LIMIT", "CHAT_SPAM_CHECK_IN_PROGRESS"])(
    "đổi mã %s thành câu đọc được",
    (code) => {
      const message = toUserMessage(code);
      expect(message).not.toBe(code);
      expect(message).toMatch(/[a-z]/);
    },
  );

  it("thông điệp thường được giữ nguyên", () => {
    expect(toUserMessage("Ticket không tồn tại.")).toBe("Ticket không tồn tại.");
  });
});

describe("handleErrorApi", () => {
  beforeEach(() => alert.mockClear());

  // Backend gửi tên trường PascalCase ("FullName"), form dùng camelCase. Không đổi thì
  // lỗi gắn vào một trường không tồn tại và biến mất khỏi màn hình.
  it("chuyển tên trường PascalCase sang camelCase", () => {
    const setFieldError = vi.fn();
    handleErrorApi({
      error: new EntityError([
        { field: "FullName", detail: "Bắt buộc." },
        { field: "PhoneNumber", detail: "Sai định dạng." },
      ]),
      setFieldError,
    });

    expect(setFieldError).toHaveBeenNthCalledWith(1, "fullName", "Bắt buộc.");
    expect(setFieldError).toHaveBeenNthCalledWith(2, "phoneNumber", "Sai định dạng.");
    expect(alert).not.toHaveBeenCalled();
  });

  it("lỗi validation ở màn không có form thì im lặng", () => {
    expect(() =>
      handleErrorApi({ error: new EntityError([{ field: "Email", detail: "x" }]) }),
    ).not.toThrow();
    expect(alert).not.toHaveBeenCalled();
  });

  it("lỗi HTTP hiện Alert", () => {
    handleErrorApi({ error: new HttpError(403, "Không có quyền.") });
    expect(alert).toHaveBeenCalledWith("Error", "Không có quyền.");
  });

  it("lỗi HTTP mang mã nghiệp vụ được dịch trước khi hiện", () => {
    handleErrorApi({ error: new HttpError(429, "CHAT_DUPLICATE_MESSAGE_LIMIT") });
    const [, shown] = alert.mock.calls[0];
    expect(shown).not.toBe("CHAT_DUPLICATE_MESSAGE_LIMIT");
  });

  it("Error thường vẫn hiện Alert", () => {
    handleErrorApi({ error: new Error("Mất kết nối.") });
    expect(alert).toHaveBeenCalledWith("Error", "Mất kết nối.");
  });

  // Người dùng tự huỷ thao tác (đóng máy ảnh, thoát khỏi bộ chọn ảnh) không phải sự cố —
  // bật hộp thoại lỗi lên ở đó là làm phiền vì chính họ vừa bấm huỷ.
  it("thao tác bị người dùng huỷ không hiện Alert", () => {
    handleErrorApi({ error: new Error("CANCELLED") });
    expect(alert).not.toHaveBeenCalled();
  });

  it.each([null, undefined, "chuỗi trần", 42])(
    "thứ không phải Error (%s) không làm sập app",
    (error) => {
      expect(() => handleErrorApi({ error })).not.toThrow();
      expect(alert).not.toHaveBeenCalled();
    },
  );
});

describe("phân cấp lớp lỗi", () => {
  it("EntityError vẫn là HttpError", () => {
    expect(new EntityError([])).toBeInstanceOf(HttpError);
  });

  it("EntityError mặc định mã 422", () => {
    expect(new EntityError([]).statusCode).toBe(422);
  });
});
