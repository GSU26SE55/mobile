# BÁO CÁO CODE REVIEW — feat/GH-83-notification-preferences-matrix — 2026-08-01

**Effort:** Deep (28 file, 2 repo, cross-feature) · **Role:** Mobile (FE skill)
**Phạm vi diff:** `git diff dev` (chưa commit nên `dev...HEAD` rỗng — dùng working tree)

## TÓM TẮT

Code đạt chuẩn kiến trúc mobile: không gọi API trong component, query key dùng factory, enum theo
pattern `as const`, không hardcode URL. Review phát hiện **1 lỗi Critical đã sửa ngay trong lúc
review** — hook cũ làm màn cài đặt bắn 2 request, phá đúng AC của ticket. Sau khi sửa: `tsc` PASS,
lint không phát sinh warning nào ngoài loại không tránh được.

---

## PHÂN TÍCH

### 🔴 Critical — đã phát hiện và SỬA trong review

**1. `useNotificationPreferences()` làm màn cài đặt bắn 2 request thay vì 1**
`src/features/notifications/hooks/useNotificationPreferences.ts`

Hook cũ bọc `useQuery(GET /api/notification-preferences)` + mutation trong cùng một hàm. Sau khi B7
chuyển màn hình sang đọc `GET /matrix`, form vẫn gọi hook này **để lấy mutation** — mà chỉ cần gọi
là `useQuery` chạy, nên request cũ vẫn bắn mỗi lần mount.

Hậu quả: phá AC *"Màn cài đặt load 1 request `/matrix`"*, và tạo lại đúng cái "hai nguồn cho một dữ
liệu" mà plan đặt ra để tránh.

**Cách sửa đã áp dụng:**
- Tách thành `useUpdateNotificationPreference()` — **chỉ mutation**, không query
- Bỏ `notificationPreferenceService.get()` (không ai gọi nữa)
- Bỏ `QUERY_KEY.notificationPreferences.detail()` (không ai đọc nữa)
- Sửa `NotificationPreferencesForm` dùng hook mới

> Đây là loại lỗi đọc diff không thấy — phải truy "ai còn gọi hook này và gọi để làm gì".

### 🟡 Warning

**1. Hai mô hình lưu khác nhau trên cùng một màn** — `NotificationPreferencesForm.tsx`
`CategoryMatrixTable` lưu **ngay khi chạm ô** (`PUT /matrix`), trong khi phần công tắc toàn cục +
giờ im lặng lưu **khi bấm nút Lưu**. Bảng ma trận lại nằm *giữa* hai khối dùng nút Lưu.
→ Người dùng có thể chạm ô rồi vẫn bấm Lưu vì tưởng chưa lưu, hoặc ngược lại rời màn mà tưởng mất.
**Gợi ý:** thêm dòng chú thích "Thay đổi theo nhóm được lưu ngay" trên bảng, hoặc đẩy bảng xuống
dưới nút Lưu. Cần xác nhận khi test tay trên thiết bị.

**2. `useRetryVoiceChat` khởi tạo cho MỌI bubble** — `ChatBubble.tsx:377`
Hook chạy cho cả tin nhắn text (không phải voice). React Query mutation rẻ nên không phải vấn đề
hiệu năng thật, nhưng là allocation thừa trong list dài.
**Gợi ý:** chấp nhận được (rules-of-hooks không cho gọi có điều kiện); nếu muốn sạch thì tách phần
voice ra component con.

**3. PR chứa thay đổi NGOÀI scope ticket** — theo quyết định của user (2026-08-01)
Gỡ feature KB phía customer: 7 file, ~810 dòng xoá (`app/(customer)/kb/*`, `knowledge.tsx`,
`KbRelatedSection`, `PopularKbSection`, `(tabs)/_layout.tsx`, `dashboard.tsx`) + untracked
`docs/mobile-restructure-plan.md`.
**Reviewer cần được báo trước**, nếu không sẽ mất thời gian truy vì sao PR notification lại xoá KB.
Đã kiểm tra: **không còn link gãy** (`/(customer)/kb` không còn ai push tới) và KB phía **staff vẫn
hoạt động** (`app/(staff)/kb/index.tsx`, `KbReferencePicker`).

**4. `usePopularKb.ts` thành dead code** — hệ quả của việc xoá `PopularKbSection`; không còn file nào
import. Thuộc phần KB ngoài scope, không sửa trong ticket này.

**5. Lint +2 warning** so baseline `dev` (69 → 71), cả 2 là `no-redeclare` của
`NotificationCategoryEnum` và `VoiceTranscriptionStatusEnum` — **không tránh được**: pattern
`as const` object + type alias là **bắt buộc** theo `rules/tech/mobile.md`. Cứ thêm enum là thêm warning.
Đã đo bằng `git stash` + so output, không ước lượng.

**6. Cross-feature import** `features/staff/components/KbReferencePicker.tsx` → `features/kb/*` —
**có sẵn từ trước**, không do ticket này. Mobile chưa bật ESLint feature-isolation như web.

### ✅ Pass

- **Architecture:** không gọi API trong component; đều qua `services/` → hook TanStack Query
- File mới đặt đúng `features/notifications/`, `features/tickets/`; không có gì nhét vào `shared/` sai chỗ
- Không tạo axios instance mới — dùng `lib/axios.ts`
- Không hardcode URL — mọi path qua `ENDPOINTS`
- **Query key:** dùng `QUERY_KEY` factory, không có inline array nào
- `invalidateQueries` dùng `KEY` root (broad) — đúng convention
- **Error handling:** mutation non-form có `onError → handleErrorApi`; form submit dùng
  `try-catch` + `handleErrorApi({ error, setFieldError })`
  - Ngoại lệ có chủ đích: `useMarkNotificationOpened` **nuốt lỗi** — telemetry hỏng không được chặn
    điều hướng của user. Đã ghi rõ lý do trong code.
- **Enum:** `as const` object + type alias, không dùng native `enum`.
  `VoiceTranscriptionStatusEnum` dùng **string** vì TicketService bật `JsonStringEnumConverter`,
  khác NotificationService (int) — khác biệt này được ghi chú tại chỗ
- Không còn `console.log`
- Không thêm route mới → **không cần** regenerate `.expo/types` (tránh được bẫy đã ghi trong memory)
- `app/_layout.tsx` chỉ thêm đúng 1 dòng — giữ nguyên tắc chạm tối thiểu ở file gốc
- `tsc --noEmit` **PASS**

---

## RỦI RO & LƯU Ý

1. **3 AC chưa verify được ở tầng UI** — render bảng ma trận, badge voice `Failed`, bấm push. Cần
   simulator/thiết bị thật. Phải làm ở `/kltn-test`.
2. **AC push phụ thuộc BE deploy** — mobile đã thủ nhánh push cũ thiếu `notificationId` (chỉ điều
   hướng, không gọi `/opened`, không crash), nhưng không thể verify đủ tới khi BE lên.
3. **Đổi giá trị enum `TicketMerged` 27 → 34** — DB local sạch (0 record `type=27`), **chưa xác nhận
   staging**. Phải kiểm tra trước khi merge PR backend, không phải trước khi code.
4. **BE có 1 test flaky sẵn** — `TicketMergedConsumerTests.Consume_DuplicateDelivery_*` fail 3/5 lần
   trên baseline (race trong chính test: publish 2 message rồi `Verify` không chờ consume).
   Không do ticket này. Nên mở issue `type: test` riêng.
5. **2 PR, 2 repo** — backend `fix/notification-push-payload-and-enum` không có `Closes #83` nên
   không tự lên Sprint Board; reviewer BE cần được báo riêng.
6. **Lint gate `--max-warnings=0` vẫn FAIL** — nhưng FAIL sẵn từ `dev` (1 error `datetimepicker`
   + 68 warning), không phải do ticket này.

---

## KẾT LUẬN

**PASS** — Độ tự tin: **Cao** cho tầng contract/logic (đã verify bằng API thật trên stack local +
unit test BE), **Trung bình** cho tầng UI (chưa chạy trên thiết bị).

> 1 lỗi Critical đã được phát hiện và sửa xong ngay trong review; `tsc` PASS và lint không tăng
> ngoài 2 warning không tránh được. Không còn Critical tồn đọng.

**Tiếp theo:** `/kltn-test GH-83` — ưu tiên 3 AC tầng UI chưa verify.
