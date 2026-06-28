# Blocker — GH-56: Staff lấy `deviceId` cho calibration API

- **Issue:** [#56](https://github.com/GSU26SE55/mobile/issues/56) — [Mobile] Staff Technical Tools
- **Ngày:** 2026-06-28
- **Role:** Mobile (FE) · **Phối hợp:** BE
- **Trạng thái:** ✅ RESOLVED (2026-06-28) — BE đã thêm endpoint cầu nối

---

## ✅ Đã giải quyết

BE commit `37765eb` *"add deviceid to endpoint group for fixing calibration feature"* thêm endpoint:

### `GET /api/iot-devices/by-code/{deviceCode}`
- **Auth:** `Admin/Manager/Staff` → Staff gọi được.
- **Input:** `deviceCode` (mã in trên thân máy, vd `ESP32-SIM-001`); chuẩn hoá `Trim().ToUpperInvariant()`, match trên unique index → case-insensitive, bỏ qua khoảng trắng thừa.
- **Output:** `CommonResponse<IotDeviceDto>` → gồm `id` (GUID) cần cho calibration.
- `404` — không khớp `deviceCode` / đã decommission / soft-delete.
- *Nguồn:* `backend/docs/api-battery.md` dòng 2051–2064.

**Flow Staff hoàn chỉnh:**
```
1. Staff đọc/quét deviceCode trên thiết bị (vd ESP32-SIM-001)
2. GET /api/iot-devices/by-code/{deviceCode}  → id (GUID)
3. GET/POST/DELETE /api/iot-devices/{id}/calibrations  ← dùng GUID đó
```

→ Không còn block. GH-56 làm được full scope: Battery Types (read-only) + Calibration (list/create/delete).
Nguồn `deviceId` = Staff **nhập/quét `deviceCode`** → resolve qua `by-code`.

> ⚠️ **Cần sync doc:** endpoint này hiện chỉ có trong `backend/docs/api-battery.md`, **chưa sync sang `mobile/docs/api-battery.md`**.

---

## (Lịch sử) Vấn đề ban đầu

Cả 3 API calibration keyed theo `{deviceId}` (GUID), nhưng Staff không có nguồn `deviceId`:

| App CẦN | Staff CÓ |
|---------|----------|
| `deviceId` = GUID (id nội bộ DB) | Trên thân thiết bị chỉ in `deviceCode` = `ESP32-SIM-001` |

Bằng chứng (trước khi BE fix):
1. Không endpoint Staff list/lookup device — `/api/admin/iot-devices` là `Admin`-only.
2. `GET /api/battery-assets/{id}/realtime` không trả device id (chỉ assetId/serial/sensor) — `mobile/docs/api-battery.md` 464–479.
3. `sourceDeviceId` (chỗ duy nhất Staff thấy) là mã chữ-số `"DEVICE-001"`/`"GATEWAY-AG01"`, không phải GUID — dòng 734, 900, 1404; mô tả 750, 926.
4. Doc 2073: `deviceId` sai → trả mảng rỗng (không 404) → lỗi im lặng.
5. iot-simulator: `deviceCode` = nhãn in trên máy; `deviceId` = GUID provision, không in trên thiết bị.

→ Đề xuất BE thêm `deviceCode → deviceId` lookup cho Staff. **BE đã làm (xem mục trên).**

---

## Tác động scope GH-56
- Full scope 5 endpoint **khả thi** sau khi BE fix.
- Battery Types: read-only cho Staff (create/update/delete là `/api/admin/...` Admin-only).
- Calibration: list (`Admin/Manager/Staff`), create + delete (`Admin/Staff`).
