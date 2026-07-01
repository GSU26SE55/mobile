## BÁO CÁO CODE REVIEW — chat_full (Login History phần của GH-5) — 2026-07-01
### Scope: Mobile — data layer only (types/service/hook), commit `40f6996`
### Effort: Quick (5 file, 1 feature nhỏ)

### TÓM TẮT
Login History implement đúng layering chuẩn (hook → service → axios), không có business logic trong component (chưa có component nào dùng). 1 Warning về kiểu response trùng lặp thay vì tái dùng type chung. `npx tsc --noEmit` PASS, không phát sinh eslint warning mới.

### PHÂN TÍCH

🟡 Warning: `src/features/account/services/account.service.ts` (hàm `getLoginHistory`)
— Response type khai inline `{ items: LoginHistoryDto[]; totalItems: number; pageNumber: number; pageSize: number; hasNextPage: boolean }` thay vì dùng `PaginationResponse<LoginHistoryDto>` đã có sẵn ở `src/types/api.types.ts` (đủ field `totalItems/pageNumber/pageSize/totalPages/hasNextPage/hasPreviousPage`). Thiếu `totalPages`/`hasPreviousPage` so với type chung — nếu UI sau này cần 2 field đó sẽ phải sửa lại type thủ công.
— Fix gợi ý: đổi thành `axiosInstance.get<CommonResponse<PaginationResponse<LoginHistoryDto>>>(...)`, xoá object type inline.

### RỦI RO & LƯU Ý
- **Issue #5 yêu cầu filter `result` (LoginAttemptResult), `onlyFailed`, `fromUtc`, `toUtc`** nhưng `LoginHistoryParams` hiện chỉ có `pageNumber`/`pageSize`. Không phải lỗi (có thể cố ý làm tối giản trước, filter sau) nhưng nên ghi rõ là **AC chưa đủ** — xem `plan.md` mục "Scope (CHƯA làm)".
- Chưa có screen nào import `useLoginHistory` — không thể review UI/UX, loading/error state, hay auth wrap (route mới nếu có sẽ cần `ProtectedRoute`/role-check tương đương mobile).
- Phần Google OAuth (link/unlink) của issue #5 hoàn toàn chưa làm (chỉ có endpoint const, không service/hook) — cần tách kế hoạch riêng vì bản thân issue gốc ghi "cần thảo luận với BE để confirm endpoint" cho login (không phải link).

### PASS
✅ Service dùng `axiosInstance` + `ENDPOINTS` — không hardcode URL
✅ Hook dùng `QUERY_KEY` factory, `staleTime` hợp lý (60s cho danh sách audit-log không cần realtime)
✅ Không có business logic ngoài service/hook (chưa có component)
✅ `npx tsc --noEmit` — PASS
✅ Không phát sinh eslint warning mới (70 warning hiện có trong repo đều pre-existing, không thuộc file của commit này)

### KẾT LUẬN
**PASS (một phần)** — phần Login History đã code đạt chất lượng nhưng **chưa đủ để đóng issue #5**: thiếu filter params, thiếu UI, thiếu phần Google OAuth. Độ tự tin: Cao cho code đã có, cần theo dõi tiếp ở `plan.md` Bước 5–7.
