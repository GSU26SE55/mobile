# BÁO CÁO CODE REVIEW — feat/GH-33-upload-comment-maintenance-images — 2026-06-18

### TÓM TẮT
GH-33 (mobile) thêm 4 gap ảnh: hiển thị ảnh comment customer (A), staff comment upload+display (B),
maintenance ảnh trước/sau (C), staff xem ảnh khách (D). 2 component RN tái dùng + 4 file wire.
tsc + eslint PASS. Không Critical. Vài lưu ý (pre-existing pattern + cần kiểm thử UI trên thiết bị).

Effort: **Standard**. Diff: 4 file tracked (+112/-33) + 2 file mới (`AttachmentThumbnails`, `AttachmentPicker`).

---

### PHÂN TÍCH

#### ✅ Pass — Architecture
- Upload qua hook `useUploadFile` (mutation), không gọi axios trực tiếp trong component ✅
- Không tạo axios instance mới; hiển thị qua `useAuthImageHeaders` + `<Image headers>` (pattern sẵn có) ✅
- Component tái dùng đặt ở `src/features/file-storage/components/` (nhất quán nơi đặt hook file-storage) ✅
- `AttachmentPicker` mirror đúng `getAssetUploadFile`/permission flow của `CreateTicketStepper` ✅
- Không sửa service — `addComment`/`addMaintenanceLog` post nguyên payload; chỉ thêm field type ✅

#### ✅ Pass — Code Quality
- Component PascalCase (`AttachmentThumbnails`, `AttachmentPicker`) ✅
- Không `console.log` (đã grep) ✅
- Không hardcode URL/token (qua `BASE_URL`/`ENDPOINTS`/hook) ✅
- Loading state (spinner khi upload) + error (Alert đếm số ảnh fail) ✅
- Accumulate cục bộ (`current`) khi upload tuần tự → không stale ✅
- Max 5/nhóm + Alert khi vượt; nút X chỉ bỏ khỏi list ✅

#### ✅ Pass — Wiring 4 gap
- **A** `app/(customer)/tickets/[id].tsx` ChatBubble render `comment.attachmentFileIds` ✅
- **B** staff composer: `AttachmentPicker` (purpose TicketAttachment) + gửi `attachments` + reset sau gửi + send disabled khi `uploadingComment`; staff ChatBubble hiển thị ảnh ✅
- **C** `MaintenanceLogForm`: 2 picker trước/sau (purpose MaintenancePhoto), 2 cờ uploading riêng (tránh đua), gửi `beforePhotos`/`afterPhotos`, reset + disable submit khi uploading; log card hiển thị before/after ✅
- **D** staff detail hiển thị `ticket.attachmentFileIds` (card sau Mô tả) ✅
- `MaintenanceLogPayload` thêm `beforePhotos`/`afterPhotos` (typed `CommentAttachmentPayload[]`) — tsc khớp ✅

#### ✅ Pass — Quality gates
- `npx tsc --noEmit` → 0 lỗi ✅ (PostToolUse hook cũng chạy tsc mỗi edit)
- `npx eslint` (6 file) → 0 issue ✅
- Expo app — không có `npm run build`; verify bằng tsc/eslint.

#### 🟡 Warning 1 — `useAuthImageHeaders` load token bất đồng bộ
- `AttachmentThumbnails`/preview của `AttachmentPicker` dùng headers từ `useAuthImageHeaders`; render đầu
  `headers === undefined` → `<Image>` request không kèm Bearer → có thể 401/nháy ảnh tới khi token load xong rồi re-render.
- **Pre-existing pattern** (customer ticket attachment + `AvatarPicker` dùng y hệt) — không phải lỗi mới. Chấp nhận.

#### 🟡 Warning 2 — `useAuthImageHeaders` gọi trong mỗi `ChatBubble`/thumbnail
- `AttachmentThumbnails` tự gọi hook → trong list comment, mỗi bubble đọc token (secureStore) một lần.
  Nhẹ, chấp nhận cho scope capstone. Có thể tối ưu sau bằng cách hoist headers lên parent + truyền prop.

---

### RỦI RO & LƯU Ý
- **Cần kiểm thử UI trên thiết bị/simulator:** composer staff được restructure (cột `composer` + hàng `composerRow`);
  picker camera/thư viện cần quyền runtime — tsc không bắt được lỗi layout/permission. `/kltn-test 33` nên chạy app thật.
- **File orphan:** chọn ảnh rồi hủy/bỏ → file đã upload nằm trên storage (chấp nhận — cleanup job, đúng plan).
- **Branch sạch từ `dev`** (không stack) — PR GH-33 chỉ chứa thay đổi GH-33.
- Customer comment upload (đã có sẵn) không bị đụng — chỉ thêm DISPLAY ở ChatBubble (Gap A), không regression.

---

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao** (logic/type), **Trung bình** về UI (chưa chạy app — cần verify ở bước test).

Không Critical. 2 Warning đều là pattern pre-existing / tối ưu nhẹ. Sẵn sàng `/kltn-test 33` (nên chạy app thật để verify picker + hiển thị ảnh).
