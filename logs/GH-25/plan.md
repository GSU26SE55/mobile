# Plan — GH-25: [Mobile] FileStorage Infra

## Metadata
- **Status:** IN_PROGRESS | **Role:** Mobile (FE) | **Ngày:** 2026-06-15
- **Issue:** #25 — https://github.com/GSU26SE55/mobile/issues/25
- **Sprint:** Sprint 3 (deadline 2026-06-27)
- **Dev:** Shu1237 (Tran Minh Tri)

## Mục tiêu
Gom toàn bộ logic FileStorage đang rải rác (`src/lib/fileStorage.ts` chỉ có upload, `useAuthImageHeaders` nằm trong `features/tickets/hooks/`) thành **một module chuẩn `src/features/file-storage/`** đầy đủ: types / enums / service / hooks (upload, metadata, presigned, delete, polling, auth-image headers). Cấu trúc bám sát module tham chiếu đã có ở Web (`frontend/src/features/file-storage/`), điều chỉnh cho React Native. Sau khi tạo module, migrate các caller hiện tại sang dùng module mới và xóa code cũ.

## Scope
**Trong scope:**
- Tạo module `src/features/file-storage/` (enums / types / services / hooks)
- Enums theo pattern `as const` (KHÔNG dùng TS `enum`, theo mobile.md): `FilePurposeEnum` (Other=0…Firmware=5), `FileStatusEnum` (Uploaded=0…Deleted=4)
- Types: `FileUploadResponse`, `FileMetadataResponse`, `UploadFilePayload`, `PresignedUrlOptions`
- Service `file-storage.service.ts` (ưu tiên endpoint theo `fileId`):
  - `uploadFile` — `POST /api/files/upload` (multipart: `file` + `purpose?` + `folderName?`)
  - `getFileMetadata` — `GET /api/files/{id}/metadata`
  - `downloadFile` — `GET /api/files/{id}/download` (binary, không bọc `CommonResponse`)
  - `getPresignedUrl` — `GET /api/files/{id}/presigned-url?expiresInMinutes=`
  - `deleteFile` — `DELETE /api/files/{id}`
- Hooks: `useUploadFile`, `useFileMetadata`, `usePresignedUrl`, `useDeleteFile`, `useFileStatusPolling` (poll metadata 2–5s đến `Ready`), `useAuthImageHeaders` (chuyển từ tickets sang đây)
- Helper render ảnh authenticated: `publicUrl ?? BASE_URL + /api/files/{fileId}/download` + auth header (RN `<Image source={{ uri, headers }}>`)
- Validation client trước upload: size ≤ 20 MB, extension whitelist theo `purpose`
- Bổ sung `endpoints.ts`: `FILES.METADATA`, `FILES.PRESIGNED_URL`, `FILES.DELETE`
- Bổ sung `queryKeys.ts`: `KEY.files` + `QUERY_KEY.files.{metadata, presignedUrl}`
- Migrate caller hiện tại sang module mới + xóa `src/lib/fileStorage.ts` và `features/tickets/hooks/useAuthImageHeaders.ts`

**Ngoài scope:**
- Upload `Firmware` (5) / `KbImage` (4) — chỉ Admin/Manager trên web
- Domain reference cleanup khi xóa file (service nghiệp vụ sở hữu resource xử lý)
- Endpoint legacy theo `objectKey` (deprecated cho FE mới)
- Web's `useFileBlobUrl` — RN không có `URL.createObjectURL`; thay bằng auth-header `<Image>` (xem Approach)

## Endpoints
| Method | Path | Mục đích / Request / Response |
|--------|------|-------------------------------|
| POST | `/api/files/upload` | multipart `file`+`purpose?`+`folderName?` → `CommonResponse<FileUploadResponse>` (201) |
| GET | `/api/files/{id}/metadata` | → `CommonResponse<FileMetadataResponse>` (200) |
| GET | `/api/files/{id}/download` | binary stream (cần auth header), KHÔNG bọc `CommonResponse`; `Processing`/`Quarantined`→409, `Deleted`→404 |
| GET | `/api/files/{id}/presigned-url?expiresInMinutes={1-1440}` | → `CommonResponse<string>` (200) |
| DELETE | `/api/files/{id}` | → 204 No Content |

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/features/file-storage/enums/file-storage.enum.ts` | create | `FilePurposeEnum`, `FileStatusEnum` (`as const`) |
| `src/features/file-storage/types/file-storage.types.ts` | create | re-export enums + 4 interfaces |
| `src/features/file-storage/services/file-storage.service.ts` | create | 5 method qua `axiosInstance` + `ENDPOINTS.FILES` |
| `src/features/file-storage/hooks/useUploadFile.ts` | create | `useMutation` — validate size/extension trước khi gọi service |
| `src/features/file-storage/hooks/useFileMetadata.ts` | create | `useQuery` — `QUERY_KEY.files.metadata` |
| `src/features/file-storage/hooks/usePresignedUrl.ts` | create | `useQuery` — `QUERY_KEY.files.presignedUrl` |
| `src/features/file-storage/hooks/useDeleteFile.ts` | create | `useMutation` — invalidate `KEY.files` |
| `src/features/file-storage/hooks/useFileStatusPolling.ts` | create | poll metadata `refetchInterval` 3s, dừng khi `Ready`/`Quarantined`/`Deleted` |
| `src/features/file-storage/hooks/useAuthImageHeaders.ts` | create | chuyển từ `features/tickets/hooks/` |
| `src/features/file-storage/utils/fileValidation.ts` | create | `MAX_FILE_SIZE`, `EXTENSION_WHITELIST` theo purpose, `validateFile()` |
| `src/lib/endpoints.ts` | modify | thêm `FILES.METADATA`, `FILES.PRESIGNED_URL`, `FILES.DELETE` |
| `src/lib/queryKeys.ts` | modify | thêm `KEY.files` + `QUERY_KEY.files.*` |
| `src/features/profile/hooks/useUploadAvatar.ts` | modify | dùng `fileStorageService.uploadFile({ purpose: Avatar })` |
| `src/features/tickets/hooks/useUploadCommentAttachment.ts` | modify | dùng module mới (`purpose: TicketAttachment`) |
| `src/features/tickets/hooks/useUploadTicketAttachment.ts` | modify | dùng module mới (`purpose: TicketAttachment`) |
| `app/(customer)/tickets/[id].tsx` | modify | import `useAuthImageHeaders` từ `features/file-storage` |
| `src/lib/fileStorage.ts` | delete | thay bằng module mới |
| `src/features/tickets/hooks/useAuthImageHeaders.ts` | delete | chuyển sang `features/file-storage/hooks/` |

## Enums
| Enum | File nguồn |
|------|-----------|
| FilePurposeEnum | `src/features/file-storage/enums/file-storage.enum.ts` (mới) |
| FileStatusEnum | `src/features/file-storage/enums/file-storage.enum.ts` (mới) |

> ⚠️ Doc `api-filestorage.md` ghi mẫu bằng TS `enum`, nhưng rule `mobile.md`/`fe.md` bắt buộc `as const` object + type alias. Theo đúng module tham chiếu Web → dùng `as const`. Giá trị int giữ nguyên đồng bộ BE (`Other=0`, `Uploaded=0` là ngoại lệ có chủ ý — KHÔNG đổi).

## Types
```ts
interface FileUploadResponse { fileId; objectKey; fileName; contentType; size; publicUrl: string | null; }
interface FileMetadataResponse { fileId; objectKey; fileName; contentType; size; folderName; purpose: FilePurposeEnum; status: FileStatusEnum; publicUrl: string | null; createdAt; updatedAt: string | null; }
interface UploadFilePayload { uri: string; name: string; type: string; folderName?: string; purpose?: FilePurposeEnum; } // RN: uri/name/type thay cho File của web
interface PresignedUrlOptions { expiresInMinutes?: number; }
```

## Approach
- **Mirror Web reference** (`frontend/src/features/file-storage/`) về cấu trúc thư mục & naming; chỉ đổi 3 điểm RN-specific:
  1. Upload payload dùng `{ uri, name, type }` (RN `FormData` append `{ uri, name, type } as Blob`) thay vì `File` của browser.
  2. Không có `useFileBlobUrl` (RN không có `URL.createObjectURL`). Render ảnh authenticated qua `<Image source={{ uri: publicUrl ?? BASE_URL+DOWNLOAD(fileId), headers: useAuthImageHeaders() }} />`.
  3. Token lấy từ `expo-secure-store` (`getAccessToken`), không phải cookie.
- **Polling**: `useFileStatusPolling(fileId)` = `useFileMetadata` với `refetchInterval` 3s; tự dừng khi `status === Ready` (return false trong refetchInterval) hoặc `Quarantined`/`Deleted` (báo lỗi). Khớp doc: download `Processing`/`Quarantined` → 409.
- **Validation client**: `validateFile(name, size, purpose)` check size ≤ 20 MB (else lỗi tương ứng 413) + extension theo whitelist purpose; gọi trong `useUploadFile` trước khi hit API để fail nhanh, không tốn round-trip.
- **Migration**: 3 upload hook cũ + `[id].tsx` chuyển sang module mới; xóa `src/lib/fileStorage.ts` và `useAuthImageHeaders` cũ. Giữ nguyên signature trả về của các hook caller để không phải sửa component dùng chúng.

## Edge Cases
- File > 20 MB: chặn ở client (`validateFile`) trước upload; nếu lọt → BE trả `413`, map qua `HttpError`.
- Extension ngoài whitelist theo `purpose`: chặn client; BE fallback `400 isSuccess=false`.
- `publicUrl === null`: fallback `GET /{fileId}/download` + auth header — phải handle cả 2 case, không assume null.
- Download khi `Processing`/`Quarantined`: BE trả `409` → polling tiếp; `Deleted`/không tồn tại → `404` dừng + báo lỗi.
- `403`: file không thuộc quyền user hiện tại (không phải owner) → hiện lỗi, không retry.
- Upload bị user hủy (ImagePicker `canceled`): throw `'CANCELLED'`, `handleErrorApi` bỏ qua (đã có sẵn).

## Acceptance Criteria
- [ ] Module `src/features/file-storage/` đủ enums/types/service/hooks theo cấu trúc Web reference
- [ ] `endpoints.ts` có đủ `FILES.{UPLOAD, METADATA, DOWNLOAD, PRESIGNED_URL, DELETE}`
- [ ] `queryKeys.ts` có `KEY.files` + `QUERY_KEY.files.{metadata, presignedUrl}`
- [ ] 3 upload hook cũ + `[id].tsx` đã migrate sang module mới; `src/lib/fileStorage.ts` và `useAuthImageHeaders` cũ đã xóa, không còn import mồ côi
- [ ] `useUploadFile` validate size (≤20MB) + extension whitelist theo purpose trước khi gọi API
- [ ] `useFileStatusPolling` poll metadata mỗi ~3s, dừng đúng ở `Ready`/`Quarantined`/`Deleted`
- [ ] Avatar & ticket attachment vẫn upload + hiển thị bình thường (regression)
- [ ] `npx tsc --noEmit` PASS, không lỗi type, không broken import

## Steps
- [x] Bước 1: Tạo `enums/file-storage.enum.ts` + `types/file-storage.types.ts` + `utils/fileValidation.ts` — 2026-06-15
- [x] Bước 2: Cập nhật `endpoints.ts` (METADATA/PRESIGNED_URL/DELETE) + `queryKeys.ts` (files) — 2026-06-15
- [x] Bước 3: Tạo `services/file-storage.service.ts` (5 method) — 2026-06-15
- [x] Bước 4: Tạo hooks: `useUploadFile`, `useFileMetadata`, `usePresignedUrl`, `useDeleteFile`, `useFileStatusPolling`, `useAuthImageHeaders` — 2026-06-15
- [x] Bước 5: Migrate caller (`useUploadAvatar`, `useUploadCommentAttachment`, `useUploadTicketAttachment`, `app/(customer)/tickets/[id].tsx`) + xóa `src/lib/fileStorage.ts` & `features/tickets/hooks/useAuthImageHeaders.ts` — 2026-06-15
- [x] Bước 6: `npx tsc --noEmit` → PASS (No errors found) — 2026-06-15

## Câu hỏi đã giải đáp
- **Có TS enum hay `as const`?** → `as const` (theo `mobile.md`/`fe.md` + Web reference), mặc dù doc ghi mẫu `enum`. Giá trị int giữ nguyên đồng bộ BE.
- **Có migrate caller cũ + xóa code rải rác không?** → Có. Issue yêu cầu "gom lại thành một module"; giữ signature trả về của hook để không phải sửa component dùng chúng.
- **Web `useFileBlobUrl` có port sang mobile?** → Không. RN không có `URL.createObjectURL`; dùng auth-header `<Image>` (đã có pattern `useAuthImageHeaders` trong codebase).
