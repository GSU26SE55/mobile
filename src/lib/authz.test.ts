import { describe, expect, it } from "vitest";
import { P, checkPermission, checkRole } from "@/src/lib/authz";
import { UserRole } from "@/src/shared/enums/session.enum";
import type { SessionUser } from "@/src/types/session.types";

const user = (over: Partial<SessionUser> = {}): SessionUser => ({
  accountId: "acc-1",
  email: "khach@test.local",
  fullName: "Khách hàng",
  role: UserRole.CUSTOMER,
  permissions: [P.TICKET_VIEW, P.TICKET_CREATE],
  ...over,
});

describe("checkPermission", () => {
  it("cho phép khi quyền có trong token", () => {
    expect(checkPermission(user(), P.TICKET_CREATE)).toBe(true);
  });

  it("từ chối khi quyền không có", () => {
    expect(checkPermission(user(), P.TICKET_RESOLVE)).toBe(false);
  });

  // Trước khi đọc xong token từ SecureStore, phiên còn null. Trả true ở đó sẽ để lộ
  // nút thao tác trong khoảnh khắc chưa biết người dùng là ai.
  it("từ chối khi chưa có phiên", () => {
    expect(checkPermission(null, P.TICKET_VIEW)).toBe(false);
  });

  // Staff và Customer không bao giờ có hai quyền này trong JWT.
  it.each([P.CHAT_EDIT_ANY, P.CHAT_DELETE_ANY])(
    "quyền dành cho Manager/Admin (%s) không tự có",
    (code) => {
      expect(checkPermission(user(), code)).toBe(false);
    },
  );
});

describe("checkRole", () => {
  it("khớp khi vai trò nằm trong danh sách", () => {
    expect(checkRole(user(), UserRole.CUSTOMER, UserRole.STAFF)).toBe(true);
  });

  it("không khớp khi vai trò ngoài danh sách", () => {
    expect(checkRole(user(), UserRole.STAFF)).toBe(false);
  });

  it("từ chối khi chưa có phiên", () => {
    expect(checkRole(null, UserRole.CUSTOMER)).toBe(false);
  });

  it("gọi không truyền vai trò nào thì không ai qua", () => {
    expect(checkRole(user())).toBe(false);
  });
});

describe("bảng mã quyền P", () => {
  // Mã phải khớp từng ký tự với PermissionCodes.cs bên backend; sai một chữ là quyền
  // không bao giờ khớp và màn hình lặng lẽ thiếu chức năng.
  it("mọi mã theo dạng module.action viết thường", () => {
    const offenders = Object.values(P).filter(
      (code) => !/^[a-z_]+(\.[a-z_]+)+$/.test(code),
    );
    expect(offenders).toEqual([]);
  });

  it("không có mã trùng", () => {
    const codes = Object.values(P);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
