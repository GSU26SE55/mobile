# BÁO CÁO CODE REVIEW — feat/GH-78-blog-readonly — 2026-07-19 (lần 4)

## TÓM TẮT

Critical lần 3 (Blog không có entry point) đã xử lý xong, có kiểm chứng bằng typed routes. Nhưng lần này phát hiện **4 file docs không liên quan Blog đang nằm trên branch** — nếu `/kltn-ship` chạy thì chúng sẽ vào thẳng PR Blog, và một trong số đó nhiều khả năng bị ghi đè sai nội dung.

## PHÂN TÍCH

### 🔴 Critical

**1. Branch chứa 278 dòng thay đổi ngoài scope — sẽ lọt vào PR Blog**

`git diff --stat` trên branch:
```
docs/api-auth.md                     |  58 +++++++++++++
docs/api-battery.md                  | 158 ++++++++++++++++++++++++++++++--
docs/api-ticket.md                   |  58 ++++++++++++-
docs/battery-realtime-description.md |   4 +-
```
Grep `blog` trong toàn bộ diff của `docs/` → **0 kết quả**. Không dòng nào liên quan tới ticket này.

Vi phạm rule **Surgical Changes** — "chỉ sửa files trong plan.md". Bảng Files của plan không có file docs nào.

Nguy hiểm hơn: `/kltn-ship` commit toàn bộ working tree, nên PR Blog sẽ kèm 278 dòng docs mà reviewer không có cách nào đánh giá trong ngữ cảnh ticket này.

**Cách fix:** đưa 4 file docs sang branch riêng (đã có sẵn `docs/sync-be-contract`, commit `dbc095d` chứa đúng 3 trong 4 file này) trước khi ship.

**2. `docs/battery-realtime-description.md` bị ghi đè bằng nội dung của repo Web**

```diff
-**Code Mobile hiện tại (`useBatterySensorStream.ts` chỉ nghe `reading`/`ping`;
- `useBatteryFleetStream.ts` chỉ nghe `summary`/`ping`) chưa đăng ký `stats`.**
+**Code FE hiện tại (`shared/lib/sse.ts`) mới chỉ đăng ký 3 event `reading`/`summary`/`ping`.**
```
Đây là **repo Mobile**, nhưng nội dung mới mô tả `shared/lib/sse.ts` — file của repo `frontend`, không tồn tại ở đây. Bản cũ mô tả đúng 2 hook thật của Mobile (`useBatterySensorStream.ts`, `useBatteryFleetStream.ts`).

Có vẻ là kết quả của việc copy docs từ repo Web sang, làm mất thông tin đặc thù Mobile.

**Cách fix:** revert riêng file này (`git checkout -- docs/battery-realtime-description.md`), hoặc sửa lại phần chữ cho đúng Mobile trước khi đưa sang branch docs.

### 🟡 Warning

**3. `formatDate` lặp 3 chỗ** — `BlogCard.tsx:14`, `(customer)/blog/[id].tsx:20`, `(staff)/blog/[id].tsx:20`. Nên gom về `src/features/blog/utils/`.

**4. Screen customer/staff trùng 262 dòng** — `index.tsx` khác 2 dòng, `[id].tsx` khác **1 dòng**. Đúng convention `kb/` nên không chặn ship, nhưng mọi fix phải làm 2 lần.

**5. `onShouldStartLoadWithRequest` chưa kiểm chứng trên máy thật** — `BlogContent.tsx:71`. Nếu chặn nhầm lần load đầu thì màn detail trắng trơn. Chỉ `/kltn-test` bắt được.

**6. Contract chưa đối chiếu response thật** — `origin/dev` vẫn 0 file Blog, `feat/GH-671-blog` vẫn chưa có PR. `RequirePublished` bên BE còn chưa commit.

**7. (Ngoài scope) `(staff)/kb/index` không có entry point** — có sẵn từ trước, nên tách issue riêng.

### ✅ Pass

**Critical lần 3 đã fix — có kiểm chứng:**
- Customer: hàng "Tin tức" trong `ListFooterComponent` của dashboard, ngay dưới `PopularKbSection` → `/(customer)/blog`
- Staff: 1 dòng thêm vào `ROWS` của `tools/index.tsx` → `/(staff)/blog` (không đụng JSX, hub tự render từ mảng)
- Verify trong `.expo/types/router.d.ts`: cả 4 route `(customer|staff)/blog` và `.../blog/[id]` đều có trong typed routes

**2 file có sẵn bị sửa — kiểm tra ảnh hưởng ngoài phạm vi:**
- `dashboard.tsx`: chỉ thêm `Pressable` vào import, bọc footer trong fragment, thêm 5 style mới. Không đổi logic list/query/state nào. Màu dùng đúng palette của file (`Colors.accent` cho title, `Colors.gray` cho phụ, `Colors.primary` cho icon)
- `tools/index.tsx`: chỉ nới union `href` + thêm 1 phần tử mảng. Không đụng render

**Các mục đã pass từ các vòng trước, vẫn giữ:**
- `react-native-webview@13.15.0` — 0 file dùng `defaultProps` → an toàn React 19
- Chống thực thi 2 lớp: `javaScriptEnabled={false}` + CSP `default-src 'none'`; link chỉ mở `http(s)` qua trình duyệt hệ thống
- 404 tách khỏi lỗi mạng, có nút "Thử lại"; đã bỏ `androidLayerType`
- Không còn dead code (`useBlogList`, `QUERY_KEY.blog.list` đã xoá)
- API qua `services/` → hook TanStack Query; `axiosInstance` chung; `QUERY_KEY` factory
- Enum `as const` không mirror wire value số; types đúng convention `kb.types.ts`
- Không cross-feature import, không `console.log`
- `npx tsc --noEmit` → PASS

## RỦI RO & LƯU Ý

- Critical #1 và #2 **không phải lỗi code Blog** — code Blog tự nó ổn. Đây là vấn đề vệ sinh branch, nhưng vẫn chặn ship vì `/kltn-ship` commit cả working tree.
- Vẫn **chưa ai mở app lên xem**. Warning #5 chỉ lộ khi chạy thật.
- eslint gate vốn FAIL sẵn trên `dev` (67 warning) — so baseline trước khi quy trách nhiệm.

## KẾT LUẬN

**FAIL** — Độ tự tin: **Cao** (cho riêng kết luận FAIL)

Code Blog đã đủ điều kiện, nhưng branch chưa sạch. Ship như hiện tại sẽ tạo PR trộn 2 chủ đề không liên quan, kèm 1 file docs bị ghi đè sai cho repo Mobile.

**Bước tiếp theo:** dọn 4 file docs khỏi branch (revert `battery-realtime-description.md`, chuyển 3 file còn lại sang `docs/sync-be-contract`) → `Status` về `IN_PROGRESS` → chạy lại `/kltn-reviewcode`.
