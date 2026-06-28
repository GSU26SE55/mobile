# Plan — GH-56: [Mobile] Staff Technical Tools — battery types + IoT calibration

## Metadata
- **Status:** PLANNING | **Role:** Mobile (FE) | **Ngày:** 2026-06-28
- **Issue:** #56 — https://github.com/GSU26SE55/mobile/issues/56
- **Sprint:** Sprint 1 (due 2026-05-30)
- **Dev:** Trần Minh Trí

## Mục tiêu
Cung cấp bộ công cụ kỹ thuật **chỉ dành cho Staff** trong app mobile:
1. Tra cứu loại pin (Battery Types) — read-only.
2. Quản lý calibration cảm biến IoT tại hiện trường — list / tạo / xoá.

Customer **không** thấy các màn này (gate bằng route group `(staff)` đã có sẵn).

## Scope
**Trong scope:**
- Màn hub "Công cụ kỹ thuật" (entry từ tab Cá nhân/Profile của Staff).
- Battery Types: danh sách (search + phân trang) + chi tiết — **read-only**.
- Calibration: nhập/tra `deviceCode` → resolve `deviceId` → list calibration của device + tạo mới + xoá.
- Data layer: enums, types, services, hooks, endpoints, queryKeys.

**Ngoài scope:**
- Tạo/sửa/xoá Battery Type (là `/api/admin/battery-types` — Admin-only, không thuộc mobile Staff).
- Calibration cấp Manager (`GET /api/iot-devices/calibrations-expiring` — Admin/Manager).
- Quét QR `deviceCode` bằng camera (chỉ làm nhập tay ở bản này; QR có thể là issue sau).
- Admin IoT device management (§11C).

## Endpoints
> Nguồn contract: `backend/docs/api-battery.md` §Nhóm 3 (Battery Types) + §11B/§by-code (Calibration). ⚠️ Endpoint `by-code` **chưa sync** sang `mobile/docs/api-battery.md`.

| Method | Path | Auth | Mục đích / Response |
|--------|------|------|---------------------|
| GET | `/api/battery-types?pageNumber&pageSize&keyword&includeDeleted` | Admin/Manager/Staff | `CommonResponse<PaginationResponse<BatteryTypeDto>>` |
| GET | `/api/battery-types/{id}` | Admin/Manager/Staff | `CommonResponse<BatteryTypeDto>` |
| GET | `/api/iot-devices/by-code/{deviceCode}` | Admin/Manager/Staff | `CommonResponse<IotDeviceDto>` (lấy `id` GUID). `404` nếu không khớp |
| GET | `/api/iot-devices/{deviceId}/calibrations?channel&includeExpired` | Admin/Manager/Staff | `CommonResponse<IotDeviceCalibrationDto[]>` (flat, no pagination, sort `calibratedAt DESC`) |
| POST | `/api/iot-devices/{deviceId}/calibrations` | Admin/Staff | `CommonResponse<IotDeviceCalibrationDto>` (`201`) |
| DELETE | `/api/iot-devices/{deviceId}/calibrations/{calibrationId}` | Admin/Staff | `CommonResponse<object>` |

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `src/lib/endpoints.ts` | modify | Thêm `BATTERY_TYPES`, `IOT_DEVICES` groups |
| `src/lib/queryKeys.ts` | modify | Thêm `batteryTypes`, `iotDevices` (KEY + QUERY_KEY) |
| `src/features/battery-types/enums/battery-type.enum.ts` | create | `BatteryChemistryEnum` |
| `src/features/battery-types/types/battery-type.types.ts` | create | `BatteryTypeDto`, `BatteryTypeListParams` |
| `src/features/battery-types/services/battery-type.service.ts` | create | `getList`, `getById` |
| `src/features/battery-types/hooks/useBatteryTypes.ts` | create | useQuery list |
| `src/features/battery-types/hooks/useBatteryTypeDetail.ts` | create | useQuery detail |
| `src/features/battery-types/components/BatteryTypeCard.tsx` | create | Row item cho list |
| `src/features/iot-devices/enums/iot-device.enum.ts` | create | `IotDeviceStatusEnum`, `CalibrationChannel` (UI const) |
| `src/features/iot-devices/types/iot-device.types.ts` | create | `IotDeviceDto`, `IotDeviceCalibrationDto`, `CreateCalibrationPayload`, `CalibrationListParams` |
| `src/features/iot-devices/schemas/calibration.schema.ts` | create | Zod: `deviceCodeSchema`, `createCalibrationSchema` |
| `src/features/iot-devices/services/iot-device.service.ts` | create | `getByCode`, `getCalibrations`, `createCalibration`, `deleteCalibration` |
| `src/features/iot-devices/hooks/useDeviceByCode.ts` | create | useQuery (enabled khi đã submit code) |
| `src/features/iot-devices/hooks/useCalibrations.ts` | create | useQuery (enabled khi có deviceId) |
| `src/features/iot-devices/hooks/useCreateCalibration.ts` | create | useMutation + invalidate |
| `src/features/iot-devices/hooks/useDeleteCalibration.ts` | create | useMutation + invalidate |
| `src/features/iot-devices/components/CalibrationCard.tsx` | create | Row item + nút xoá |
| `app/(staff)/tools/index.tsx` | create | Hub: 2 entry (Battery Types, Calibration) |
| `app/(staff)/tools/battery-types/index.tsx` | create | List + search |
| `app/(staff)/tools/battery-types/[id].tsx` | create | Detail |
| `app/(staff)/tools/calibration/index.tsx` | create | Nhập deviceCode → list calibration + xoá |
| `app/(staff)/tools/calibration/create.tsx` | create | Form tạo calibration |
| `app/(staff)/_layout.tsx` | modify | Đăng ký Stack.Screen cho các route `tools/*` |
| `app/(staff)/(tabs)/profile.tsx` | modify | Thêm row "Công cụ kỹ thuật" → `router.push('/(staff)/tools')` |

## Enums
| Enum | File nguồn | Giá trị |
|------|-----------|---------|
| `BatteryChemistryEnum` | `features/battery-types/enums/battery-type.enum.ts` | LiFePO4=1, Nmc=2, Nca=3, Lco=4, Other=99 |
| `IotDeviceStatusEnum` | `features/iot-devices/enums/iot-device.enum.ts` | Lấy int từ `docs/api-battery.md §IotDeviceStatusEnum` khi implement |
| `CalibrationChannel` (UI const) | `features/iot-devices/enums/iot-device.enum.ts` | `voltage`/`current`/`temperature`/`soc` — dropdown form (BE nhận string tự do) |

> Pattern `as const` object + type alias — KHÔNG dùng TypeScript `enum`.

## Types
```ts
interface BatteryTypeDto {
  id: string; name: string; manufacturer: string | null;
  nominalCapacityAh: number; nominalVoltage: number;
  chemistry: BatteryChemistryEnum; maxCycleCount: number;
  description: string | null; createdAt: string;
}
interface BatteryTypeListParams { pageNumber?: number; pageSize?: number; keyword?: string; includeDeleted?: boolean; }

interface IotDeviceDto { id: string; deviceCode: string; displayName: string; status: IotDeviceStatusEnum; siteName: string | null; }

interface IotDeviceCalibrationDto {
  id: string; iotDeviceId: string; channel: string; batteryAssetId: string | null;
  scale: number; offset: number; unit: string;
  calibratedAt: string; expiresAt: string | null; notes: string | null; createdAt: string;
}
interface CreateCalibrationPayload {
  channel: string; batteryAssetId?: string | null; scale: number; offset: number;
  unit: string; calibratedAt: string; expiresAt?: string | null; notes?: string | null;
}
interface CalibrationListParams { channel?: string; includeExpired?: boolean; }
```

## Schema (Zod)
> Không dùng React Hook Form — parse thủ công bằng `schema.safeParse()` (nhất quán mobile rules).
```ts
// deviceCodeSchema — input tra device
deviceCode: z.string().trim().min(3).max(64).regex(/^[A-Z0-9-]+$/i)

// createCalibrationSchema
channel:      z.string().trim().min(1).max(32)        // lowercase trước khi gửi
unit:         z.string().trim().min(1).max(16)
scale:        z.number().refine(v => v !== 0, 'scale != 0')
offset:       z.number()
calibratedAt: z.string().min(1)                       // ISO UTC
expiresAt:    z.string().optional()                    // nếu có: > calibratedAt
batteryAssetId: z.string().uuid().optional().nullable()
notes:        z.string().max(500).optional()
```

## Approach
- **deviceId source:** Staff nhập `deviceCode` (mã in trên thiết bị) → `useDeviceByCode` gọi `by-code` → lấy `id` (GUID) → các hook calibration dùng `id` đó. Giải quyết việc Staff không có GUID (xem `logs/GH-56/blocker-deviceId.md`).
- **Gating:** đặt toàn bộ màn trong `app/(staff)/tools/*`; `(staff)/_layout.tsx` đã `Redirect` nếu `role !== 'STAFF'` → tự bảo vệ, không cần guard riêng.
- **Battery Types:** chỉ GET → `useQuery` thuần, có search (keyword) + phân trang (`PaginationResponse`).
- **Calibration list:** không phân trang, sort sẵn DESC từ BE → render thẳng.
- **Mutation:** create/delete calibration → `invalidateQueries(QUERY_KEY.iotDevices.calibrations(deviceId))`.

## Workflow
**Tra Battery Type:**
```
Mở tab Cá nhân → "Công cụ kỹ thuật" → "Loại pin"
  → useBatteryTypes(params) → list (search keyword, load page)
  → bấm 1 item → [id] → useBatteryTypeDetail(id) → chi tiết
```
**Quản lý Calibration:**
```
"Công cụ kỹ thuật" → "Calibration"
  → nhập deviceCode → submit
  → useDeviceByCode(code):
       OK   → có deviceId → useCalibrations(deviceId) → list
       404  → toast "Không tìm thấy thiết bị"
  → "Thêm calibration" → create.tsx → safeParse → useCreateCalibration → 201 → back + invalidate
  → mỗi row có nút Xoá → useDeleteCalibration → invalidate
  → lỗi: handleErrorApi({ error }) → toast (non-form); form thì map listErrors xuống field
```

## Edge Cases
- `deviceCode` không khớp → `404` → toast rõ ràng, không crash; giữ form để nhập lại.
- `deviceId` đúng nhưng chưa có calibration → BE trả `[]` → hiện EmptyState (không phải lỗi).
- POST validation `400` → map `listErrors` xuống đúng field trên form create.
- `scale = 0` → chặn client (Zod) trước khi gọi API.
- `expiresAt <= calibratedAt` → chặn client + BE cũng chặn.
- Battery Types list rỗng / keyword không ra kết quả → EmptyState.
- Offline / network error → toast, cho retry.

## Acceptance Criteria
- [ ] Customer **không** truy cập được màn `tools/*` (redirect login) — chỉ Staff vào được.
- [ ] Battery Types: list hiển thị name/manufacturer/capacity/voltage/chemistry; search theo keyword; mở được chi tiết.
- [ ] Calibration: nhập `deviceCode` hợp lệ → ra danh sách calibration của đúng device.
- [ ] `deviceCode` sai → báo "không tìm thấy", không crash.
- [ ] Tạo calibration mới → list tự refresh, item mới xuất hiện.
- [ ] Xoá calibration → biến mất khỏi list.
- [ ] Validation client chặn `scale=0`, `expiresAt<=calibratedAt`, field vượt max length.
- [ ] `npx tsc --noEmit` PASS (đã regenerate `.expo/types` cho route mới).

## Steps
- [ ] Bước 1: Thêm `endpoints.ts` + `queryKeys.ts` (BATTERY_TYPES, IOT_DEVICES)
- [ ] Bước 2: Enums + Types (battery-types + iot-devices) + Zod schemas
- [ ] Bước 3: Services (battery-type.service, iot-device.service)
- [ ] Bước 4: Hooks (useBatteryTypes, useBatteryTypeDetail, useDeviceByCode, useCalibrations, useCreate/useDeleteCalibration)
- [ ] Bước 5: Components (BatteryTypeCard, CalibrationCard)
- [ ] Bước 6: Screens `app/(staff)/tools/*` + đăng ký `(staff)/_layout.tsx` + thêm row vào `profile.tsx`
- [ ] Bước 7: Regenerate `.expo/types` (chạy `expo start` cho free port rồi dừng) → `npx tsc --noEmit` PASS

## Câu hỏi đã giải đáp
1. **Staff lấy `deviceId` ở đâu?** → BE thêm `GET /api/iot-devices/by-code/{deviceCode}` (commit `37765eb`, auth Admin/Manager/Staff) làm cầu nối `deviceCode → deviceId`. Staff nhập `deviceCode` (mã in trên thiết bị). Chi tiết + lịch sử blocker: `logs/GH-56/blocker-deviceId.md`.
2. **Battery Types có cho Staff sửa không?** → Không. Create/update/delete là `/api/admin/battery-types` (Admin-only). Staff chỉ read.
3. **Phạm vi deliverable?** → Full UI + data layer (blocker đã gỡ).
4. **Vị trí navigation?** → Sub-screen từ tab Cá nhân (Profile) → `/(staff)/tools`. Không đụng `CustomTabBar` (đang hardcode 3 tab).

## Lưu ý kỹ thuật
- ⚠️ Route mới trong Expo Router làm `tsc`/check-build FAIL tới khi regenerate `.expo/types` (xem memory `expo-router-typed-routes-pitfall`).
- ⚠️ `by-code` chưa có trong `mobile/docs/api-battery.md` — nên đề nghị sync doc, hoặc bám `backend/docs/api-battery.md` dòng 2051.
