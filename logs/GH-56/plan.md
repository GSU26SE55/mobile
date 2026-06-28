# Plan — GH-56: [Mobile] Staff Technical Tools — battery types + IoT calibration

## Metadata
- **Status:** REVIEWING | **Role:** Mobile (FE) | **Ngày:** 2026-06-28
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
> Nguồn contract: `mobile/docs/api-battery.md` §Nhóm 3 (Battery Types) + §11B/§by-code (Calibration). Endpoint `by-code` đã sync sang mobile docs ✅.

| Method | Path | Auth | Mục đích / Response |
|--------|------|------|---------------------|
| GET | `/api/battery-types?pageNumber&pageSize&keyword&includeDeleted` | Admin/Manager/Staff | `CommonResponse<PaginationResponse<BatteryTypeDto>>` |
| GET | `/api/battery-types/{id}` | Admin/Manager/Staff | `CommonResponse<BatteryTypeDto>` |
| GET | `/api/iot-devices/by-code/{deviceCode}` | Admin/Manager/Staff | `CommonResponse<IotDeviceDto>` (lấy `id` GUID). `404` nếu không khớp |
| GET | `/api/iot-devices/{deviceId}/calibrations?channel&includeExpired` | Admin/Manager/Staff | `CommonResponse<IotDeviceCalibrationDto[]>` (flat, no pagination, sort `calibratedAt DESC`) |
| POST | `/api/iot-devices/{deviceId}/calibrations` | Admin/Staff | `CommonResponse<IotDeviceCalibrationDto>` (`201`) |
| DELETE | `/api/iot-devices/{deviceId}/calibrations/{calibrationId}` | Admin/Staff | **HTTP 200** (không phải 204) + `CommonResponse<object>` → service check `isSuccess`, KHÔNG check status 204 |

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
| `app/(staff)/tools/calibration/index.tsx` | create | Nhập deviceCode → list calibration + filter (channel chip + includeExpired switch) + xoá |
| `app/(staff)/tools/calibration/create.tsx` | create | Form tạo calibration — **prefill `scale=1`, `offset=0`** (L1) |
| `app/(staff)/_layout.tsx` | modify | Đăng ký Stack.Screen cho các route `tools/*` |
| `app/(staff)/(tabs)/profile.tsx` | modify | Thêm row "Công cụ kỹ thuật" → `router.push('/(staff)/tools')` |

## Enums
| Enum | File nguồn | Giá trị |
|------|-----------|---------|
| `BatteryChemistryEnum` | `features/battery-types/enums/battery-type.enum.ts` | LiFePO4=1, Nmc=2, Nca=3, Lco=4, Other=99 |
| `IotDeviceStatusEnum` | `features/iot-devices/enums/iot-device.enum.ts` | Pending=1, Active=2, Offline=3, Disabled=4, Decommissioned=5 (doc dòng 182–188) |
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

// L2: thêm siteId (doc dòng 2161: string, Không nullable) cho đúng contract — chi phí 0, phòng khi cần điều hướng theo site
interface IotDeviceDto { id: string; deviceCode: string; displayName: string; status: IotDeviceStatusEnum; siteId: string; siteName: string | null; }

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
// L3: BE tự Trim().ToUpperInvariant() match trên unique index → client cũng .trim().toUpperCase()
//     trước khi gửi/transform để hiển thị nhất quán (tránh nhầm lẫn UI), không phải bug.
deviceCode: z.string().trim().toUpperCase().min(3).max(64).regex(/^[A-Z0-9-]+$/)

// createCalibrationSchema
channel:      z.string().trim().toLowerCase().min(1).max(32)  // BE: lowercase
unit:         z.string().trim().min(1).max(16)
scale:        z.number().refine(v => v !== 0, 'scale != 0')   // doc: "khác 0"
offset:       z.number()
calibratedAt: z.string().min(1)                       // ISO UTC — N2: KHÔNG chặn tương lai (doc chỉ != default, có chủ ý)
expiresAt:    z.string().optional()                    // nếu có: > calibratedAt (enforce ở superRefine bên dưới)
batteryAssetId: z.string().uuid().optional().nullable()
notes:        z.string().max(500).optional()

// N1: cross-field rule PHẢI đặt ở cấp object (field-level Zod không so 2 field được)
// → đảm bảo cam kết "chặn client expiresAt <= calibratedAt", không phải chờ BE 400
.superRefine((v, ctx) => {
  if (v.expiresAt && new Date(v.expiresAt) <= new Date(v.calibratedAt)) {
    ctx.addIssue({ code: 'custom', path: ['expiresAt'], message: 'expiresAt phải sau calibratedAt' });
  }
})
```
> **L1 — Prefill default (quan trọng):** doc dòng 2106–2107 ghi `scale` mặc định `1`, `offset` mặc định `0` (BE-side default, vẫn là field "Có"). Form create **PHẢI prefill `scale=1`, `offset=0`** làm initial state — KHÔNG để trống bắt Staff tự nhập, tránh lệch ý đồ contract + UX kém. `.refine(scale !== 0)` giữ nguyên (đúng doc "khác 0").

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
       OK   → có deviceId → useCalibrations(deviceId, { channel?, includeExpired }) → list
       404  → toast "Không tìm thấy thiết bị"
  → G2: trên màn list có filter — chip chọn channel (voltage/current/temperature/soc, mặc định "tất cả")
        + switch "Hiện cả đã hết hạn" (includeExpired, mặc định false). Đổi filter → refetch.
  → "Thêm calibration" → create.tsx → safeParse → useCreateCalibration → 201 → back + invalidate
  → mỗi row có nút Xoá → useDeleteCalibration → invalidate
  → lỗi: handleErrorApi({ error }) → toast (non-form); form thì map listErrors xuống field
```

## Edge Cases
- `deviceCode` không khớp → `404` → toast rõ ràng, không crash; giữ form để nhập lại.
- `deviceId` đúng nhưng chưa có calibration → BE trả `[]` → hiện EmptyState (không phải lỗi).
- POST validation `400` → map `listErrors` xuống đúng field trên form create.
- `scale = 0` → chặn client (Zod) trước khi gọi API.
- `expiresAt <= calibratedAt` → chặn client bằng `.superRefine` (N1) + BE cũng chặn (doc 2110).
- `calibratedAt` tương lai → **KHÔNG chặn** (N2): doc chỉ yêu cầu `!= default`, không cấm tương lai — có chủ ý, khớp contract.
- Battery Types list rỗng / keyword không ra kết quả → EmptyState.
- Offline / network error → toast, cho retry.

## Acceptance Criteria
- [ ] Customer **không** truy cập được màn `tools/*` (redirect login) — chỉ Staff vào được.
- [ ] Battery Types: list hiển thị name/manufacturer/capacity/voltage/chemistry; search theo keyword; mở được chi tiết.
- [ ] Calibration: nhập `deviceCode` hợp lệ → ra danh sách calibration của đúng device.
- [ ] `deviceCode` sai → báo "không tìm thấy", không crash.
- [ ] Form tạo calibration **prefill sẵn `scale=1`, `offset=0`** (L1) — Staff không phải tự gõ.
- [ ] Màn calibration có filter `channel` + toggle `includeExpired`; đổi filter → list refetch (G2).
- [ ] Tạo calibration mới → list tự refresh, item mới xuất hiện.
- [ ] Xoá calibration (DELETE trả HTTP 200) → service check `isSuccess` → biến mất khỏi list (G1).
- [ ] Validation client chặn `scale=0`, `expiresAt<=calibratedAt`, field vượt max length.
- [ ] `npx tsc --noEmit` PASS (đã regenerate `.expo/types` cho route mới).

## Steps
- [x] Bước 1: Thêm `endpoints.ts` + `queryKeys.ts` (BATTERY_TYPES, IOT_DEVICES) — 2026-06-28
- [x] Bước 2: Enums + Types (battery-types + iot-devices) + Zod schemas — 2026-06-28
- [x] Bước 3: Services (battery-type.service, iot-device.service) — 2026-06-28
- [x] Bước 4: Hooks (useBatteryTypes, useBatteryTypeDetail, useDeviceByCode, useCalibrations, useCreate/useDeleteCalibration) — 2026-06-28
- [x] Bước 5: Components (BatteryTypeCard, CalibrationCard) — 2026-06-28
- [x] Bước 6: Screens `app/(staff)/tools/*` + đăng ký `(staff)/_layout.tsx` + thêm row vào `profile.tsx` — 2026-06-28
- [x] Bước 7: Regenerate `.expo/types` (expo start port 8099 rồi dừng) → `npx tsc --noEmit` PASS — 2026-06-28

## Câu hỏi đã giải đáp
1. **Staff lấy `deviceId` ở đâu?** → BE thêm `GET /api/iot-devices/by-code/{deviceCode}` (commit `37765eb`, auth Admin/Manager/Staff) làm cầu nối `deviceCode → deviceId`. Staff nhập `deviceCode` (mã in trên thiết bị). Chi tiết + lịch sử blocker: `logs/GH-56/blocker-deviceId.md`.
2. **Battery Types có cho Staff sửa không?** → Không. Create/update/delete là `/api/admin/battery-types` (Admin-only). Staff chỉ read.
3. **Phạm vi deliverable?** → Full UI + data layer (blocker đã gỡ).
4. **Vị trí navigation?** → Sub-screen từ tab Cá nhân (Profile) → `/(staff)/tools`. Không đụng `CustomTabBar` (đang hardcode 3 tab).

## Lưu ý kỹ thuật
- ⚠️ Route mới trong Expo Router làm `tsc`/check-build FAIL tới khi regenerate `.expo/types` (xem memory `expo-router-typed-routes-pitfall`).
- `by-code` đã có trong `mobile/docs/api-battery.md` ✅ — bám contract ở đây.
