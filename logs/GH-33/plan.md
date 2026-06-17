# Plan — GH-33: [Mobile] Upload & hiển thị ảnh cho comment và maintenance log

## Metadata
- **Status:** REVIEWING | **Role:** Mobile | **Ngày:** 2026-06-18
- **Issue:** #33 — https://github.com/GSU26SE55/mobile/issues/33
- **Sprint:** Sprint 3 (deadline 2026-06-27)

## Mục tiêu
Bổ sung write-path + read-path ảnh còn thiếu trên mobile (song song GH-85 web): hiển thị ảnh comment
(customer), cho staff đính kèm ảnh khi comment + ghi maintenance log (ảnh trước/sau), và hiển thị ảnh ở
màn staff detail. Tái dùng `useUploadFile`/`useAuthImageHeaders`/`validateFile` + expo-image-picker đã có.

## Scope
**Trong scope (4 gap):**
- **A** — Customer `ChatBubble` hiển thị `comment.attachmentFileIds`.
- **B** — Staff comment: thêm image picker (purpose `TicketAttachment`) vào composer + staff `ChatBubble` hiển thị ảnh.
- **C** — Staff maintenance: 2 picker ảnh trước/sau (purpose `MaintenancePhoto`) trong `MaintenanceLogForm`;
  thêm `beforePhotos`/`afterPhotos` vào `MaintenanceLogPayload`; hiển thị ảnh trong danh sách log.
- **D** — Staff detail hiển thị `ticket.attachmentFileIds` (ảnh khách gửi).
- 2 component tái dùng RN: `AttachmentThumbnails` (hiển thị) + `AttachmentPicker` (chọn+upload).
- Chỉ ảnh (`MediaTypeOptions.Images`), tối đa **5 ảnh/nhóm**.

**Ngoài scope:**
- Avatar, ticket-create attachment, customer comment upload (đã xong).
- Nhóm "tài liệu" maintenance (chỉ before/after); pdf/doc cho comment (chỉ ảnh).
- KbImage/Firmware (mobile chưa có feature).
- Xóa file orphan khi hủy (chấp nhận — cleanup job).
- Preview phóng to khi tap thumbnail (optional, không bắt buộc).

## Endpoints
Không thêm endpoint. Tái dùng `useUploadFile`→`FILES.UPLOAD` (multipart) và hiển thị qua
`<Image source={{ uri: BASE_URL + ENDPOINTS.FILES.DOWNLOAD(fileId), headers }} />` (`useAuthImageHeaders`).

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/file-storage/components/AttachmentThumbnails.tsx` | create | Hiển thị `fileIds[]` → hàng `<Image headers>` (dùng `useAuthImageHeaders`) |
| `src/features/file-storage/components/AttachmentPicker.tsx` | create | expo-image-picker + `useUploadFile(purpose)` + `validateFile`; controlled `value`/`onChange`/`onUploadingChange`, max 5 |
| `src/features/staff/types/staff.types.ts` | modify | Thêm `beforePhotos?`/`afterPhotos?: CommentAttachmentPayload[]` vào `MaintenanceLogPayload` |
| `src/features/staff/components/MaintenanceLogForm.tsx` | modify | 2 `AttachmentPicker` (trước/sau) + gửi kèm trong `onSubmit`; disable submit khi uploading |
| `app/(customer)/tickets/[id].tsx` | modify | `ChatBubble` render `comment.attachmentFileIds` (Gap A) |
| `app/(staff)/tickets/[id].tsx` | modify | Composer thêm picker + gửi `attachments` (B); staff `ChatBubble` hiển thị ảnh (B); log list hiển thị before/after (C); hiển thị `ticket.attachmentFileIds` (D) |

> **Không đổi:** `staffTicket.service` (post nguyên payload — chỉ cần type có field), `useUploadFile`,
> `useUploadCommentAttachment`, `useAuthImageHeaders`, `fileValidation`, enum/service file-storage.

## Types
```ts
// staff.types.ts — bổ sung MaintenanceLogPayload (tái dùng CommentAttachmentPayload đã import)
beforePhotos?: CommentAttachmentPayload[];
afterPhotos?:  CommentAttachmentPayload[];

// AttachmentPicker props
interface AttachmentPickerProps {
  purpose: FilePurposeEnum;                          // TicketAttachment | MaintenancePhoto
  value: CommentAttachmentPayload[];                 // controlled
  onChange: (next: CommentAttachmentPayload[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  max?: number;                                      // default 5
  label?: string;
}
// AttachmentThumbnails props
interface AttachmentThumbnailsProps { fileIds?: string[] | null; size?: number; }
```

## Approach
- `AttachmentPicker`: `ImagePicker.launchImageLibraryAsync({ mediaTypes: Images })` → mỗi asset dựng
  `{ uri, name, type }` (mirror `getAssetUploadFile` ở `CreateTicketStepper`) → `validateFile` →
  `useUploadFile.mutateAsync({ uri, name, type, purpose })` → push `{fileId,fileName,contentType,sizeBytes}`
  vào `value` (tích lũy cục bộ, tuần tự). Báo `onUploadingChange` để disable nút gửi/lưu. Nút X bỏ khỏi list.
- `AttachmentThumbnails`: `useAuthImageHeaders()` → render `fileIds.map(<Image headers>)` (cuộn ngang).
  Component tự gọi hook → dùng được trong `ChatBubble` (map) mà không prop-drill headers.
- Staff comment: thêm `attachments` state, gửi `addComment({ body, isInternal, attachments })`, reset sau gửi.
- `MaintenanceLogForm`: 2 state ảnh (before/after) + 2 `onUploadingChange` riêng (tránh đua), truyền vào `onSubmit`,
  reset sau lưu.
- Hiển thị: customer ChatBubble (A), staff ChatBubble (B), staff log card before/after (C), staff ticket
  attachment (D) đều dùng `AttachmentThumbnails`.

## Edge Cases
- Ảnh > 20MB / sai định dạng → `validateFile` chặn client (toast/alert), không upload; lọt qua → BE 413/400.
- Đạt max 5/nhóm → ẩn nút thêm.
- Đang upload → disable nút gửi/lưu (comment composer, maintenance form).
- `attachmentFileIds`/`comments` null → guard `?? []`, không render khi rỗng.
- File orphan khi hủy → chấp nhận (cleanup job).
- `<Image headers>` 401 nếu token hết hạn — interceptor refresh ở request thường; ảnh lỗi hiển thị placeholder.

## Acceptance Criteria
- [ ] Customer: comment có ảnh → ảnh hiển thị trong bong bóng chat (A).
- [ ] Staff: composer chọn được ảnh → upload, gửi kèm comment → ảnh hiển thị ở chat staff (B).
- [ ] Staff: `MaintenanceLogForm` chọn ảnh trước/sau → lưu log kèm `beforePhotos`/`afterPhotos` → hiển thị trong log (C).
- [ ] Staff detail: hiển thị ảnh khách đính kèm (`ticket.attachmentFileIds`) (D).
- [ ] Ảnh > 20MB / sai định dạng → báo lỗi, không upload; ảnh hợp lệ khác vẫn upload.
- [ ] Mỗi nhóm tối đa 5 ảnh; nút gửi/lưu disable khi đang upload.
- [ ] `tsc --noEmit` + `eslint` PASS; app chạy không crash màn ticket detail (customer + staff).

## Steps
- [x] Bước 1: Tạo `AttachmentThumbnails.tsx` (hiển thị) + `AttachmentPicker.tsx` (chọn+upload) — 2026-06-18
- [x] Bước 2: Bổ sung `beforePhotos`/`afterPhotos` vào `MaintenanceLogPayload` (staff.types.ts) — 2026-06-18
- [x] Bước 3: Wire `MaintenanceLogForm.tsx` — 2 picker trước/sau + gửi kèm onSubmit + disable khi uploading (C) — 2026-06-18
- [x] Bước 4: Wire `app/(staff)/tickets/[id].tsx` — composer picker + gửi attachments (B), ChatBubble + log + ticket attachment hiển thị (B/C/D) — 2026-06-18
- [x] Bước 5: Wire `app/(customer)/tickets/[id].tsx` — ChatBubble hiển thị `comment.attachmentFileIds` (A) — 2026-06-18
- [x] Bước 6: `tsc --noEmit` + `eslint` PASS (Expo — không có `npm run build`) — 2026-06-18

## Câu hỏi đã giải đáp
| Câu hỏi | Quyết định |
|---------|-----------|
| Phạm vi? | A+B+C+D (theo issue) — kế thừa tinh thần GH-85 web. |
| Định dạng comment/maintenance? | Chỉ ảnh (`MediaTypeOptions.Images`) — mirror GH-85. |
| Maintenance nhóm nào? | Chỉ before/after (bỏ nhóm tài liệu). |
| Giới hạn ảnh/nhóm? | Tối đa 5 (mirror GH-85; lưu ý: ticket-create hiện "unlimited" — có thể đổi nếu muốn nhất quán). |
| Orphan khi hủy? | Bỏ qua, cleanup job. |
| Service có sửa không? | Không — `addComment`/`addMaintenanceLog` post nguyên payload; chỉ thêm field vào type. |
| Đặt component ở đâu? | `src/features/file-storage/components/` (như web đặt `FileUploadField`). |
