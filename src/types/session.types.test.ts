import { describe, expect, it } from "vitest";
import { decodeToken, redirectByRole } from "@/src/types/session.types";
import { UserRole } from "@/src/shared/enums/session.enum";

/** Ghép JWT không ký — jwtDecode chỉ đọc payload, không kiểm chữ ký. */
const makeToken = (payload: Record<string, unknown>) => {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.chu-ky-gia`;
};

const basePayload = {
  AccountId: "11111111-1111-1111-1111-111111111111",
  email: "khach@test.local",
  FullName: "Khách hàng",
  role: "Customer",
  perm: ["ticket.view", "ticket.create"],
  exp: 0,
};

describe("decodeToken", () => {
  it("lấy đúng các trường phiên", () => {
    const user = decodeToken(makeToken(basePayload));
    expect(user.accountId).toBe("11111111-1111-1111-1111-111111111111");
    expect(user.email).toBe("khach@test.local");
    expect(user.fullName).toBe("Khách hàng");
    expect(user.permissions).toEqual(["ticket.view", "ticket.create"]);
  });

  // Backend phát vai trò PascalCase; toàn app so sánh bằng chữ hoa. Chuẩn hoá sai ở đây
  // thì sau khi đăng nhập thành công app vẫn không biết đưa người dùng đi đâu.
  it.each([
    ["Customer", UserRole.CUSTOMER],
    ["staff", UserRole.STAFF],
    ["ADMIN", UserRole.ADMIN],
    ["mAnAgEr", UserRole.MANAGER],
  ])("chuẩn hoá vai trò %s về %s", (raw, expected) => {
    expect(decodeToken(makeToken({ ...basePayload, role: raw })).role).toBe(expected);
  });

  it("thiếu perm trả về mảng rỗng", () => {
    const withoutPerm: Record<string, unknown> = { ...basePayload };
    delete withoutPerm.perm;
    expect(decodeToken(makeToken(withoutPerm)).permissions).toEqual([]);
  });

  it("token hỏng thì ném lỗi để tầng gọi đăng xuất", () => {
    expect(() => decodeToken("khong-phai-jwt")).toThrow();
  });
});

describe("redirectByRole", () => {
  it("Customer và Staff có màn hình riêng trên app", () => {
    expect(redirectByRole(UserRole.CUSTOMER)).toBe("/(customer)/(tabs)/dashboard");
    expect(redirectByRole(UserRole.STAFF)).toBe("/(staff)/(tabs)/dashboard");
  });

  // Admin và Manager làm việc trên web; app không dựng màn cho họ. Trả null để tầng gọi
  // hiện thông báo, chứ không đẩy vào một route không tồn tại.
  it.each([UserRole.ADMIN, UserRole.MANAGER])("%s không có đích trong app", (role) => {
    expect(redirectByRole(role)).toBeNull();
  });

  it("vai trò lạ cũng trả null", () => {
    expect(redirectByRole("GUEST" as UserRole)).toBeNull();
  });
});
