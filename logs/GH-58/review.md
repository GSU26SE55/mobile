# BÁO CÁO CODE REVIEW — feat/GH-58-battery-realtime-telemetry — 2026-06-28

## TÓM TẮT
GH-58 thêm realtime nhiều pin (SSE event `summary`) cho Customer dashboard. Code đúng pattern mobile (hook riêng, không gọi API trong component, không quản SSE bằng TanStack Query), bám đúng contract BE đã verify. Không có lỗi Critical. PASS.

> **Phạm vi review:** chỉ diff GH-58 (vs `feat/GH-57-battery-site-monitoring`) — KHÔNG review code GH-57 (stack base, review riêng ở #57).
> File GH-58: `useBatteryFleetStream.ts` (new), `buildFleetScope.ts` (new), `live-reading.types.ts` (+`BatterySummaryDto`), `dashboard.tsx` (wire live).

## PHÂN TÍCH

### ✅ Pass
- **RBAC scope đúng contract (verified BE):** `buildFleetScope` Customer → `customer:{accountId}` (BE check `customerId == actorUserId`, `BatteryAsset.CustomerId == JWT AccountId`); Staff → `assets:{ids}`. Cap 50 **chỉ** cho `assets:`, không áp `customer:`. Khớp `BatteryRealtimeAuthorizationHelper`.
- **SSE đúng §3/§5/§8:** auth qua `?access_token=` + `encodeURIComponent`; parse event `summary` → `items[]`; lọc `primary` (bỏ redundant/external-temp §5.4); route bằng `batteryAssetId`, **bỏ qua `scopeType`** (đúng khuyến nghị review trước).
- **Xử lý lỗi không nuốt im lặng (§8):** `error` event đọc `xhrStatus`; 401/403 → `console.warn` + `setStreamError` + `es.close()` (chặn reconnect mù). Network/đóng sau mở → giữ Map cũ, lib tự reconnect.
- **Lifecycle sạch:** cleanup `removeAllEventListeners()` + `close()`; `cancelled` guard chống setState sau unmount; deps `[scope]` ổn định (scope từ `useMemo([user])`, user là ref Zustand ổn định) → không re-subscribe thừa.
- **Map update immutable** (`new Map(prev)`) → trigger re-render đúng. Field non-null (`socPercent/voltage/temperature`) luôn có mặt cho primary → `.toFixed()` an toàn.
- **Rules-of-hooks:** mọi hook (kể cả `useBatteryFleetStream`) gọi trước early-return `if (isLoading)`. OK.
- **Mobile rules:** token qua `getAccessToken` (expo-secure-store); reuse `BASE_URL` lib/axios; không thêm package (react-native-sse do GH-57 cài); không gọi API trong component. ✅
- **tsc PASS toàn repo; eslint 3 file GH-58 = 0 warning.**

### 🟡 Warning
- `useBatteryFleetStream.ts` — **không evict reading cũ:** pin ngừng gửi thì giá trị live cuối ở lại Map vô hạn (card vẫn chấm xanh + số cũ). Chấp nhận cho MVP (hiển thị last-known); nếu muốn chính xác "stale" → thêm timestamp check sau. Không block.
- `useBatteryFleetStream.ts` — `isConnected`/`streamError` được set (gây re-render) nhưng `dashboard.tsx` chưa dùng. Đúng thiết kế (API reusable cho UI sau hiển thị trạng thái), không phải bug.
- `dashboard.tsx:85` — **pre-existing** `react-hooks/exhaustive-deps` ở `EnergyFlowDiagram` (thiếu dep `progress`). Có sẵn trên HEAD base, KHÔNG thuộc GH-58 (Surgical Changes) → không sửa.

## RỦI RO & LƯU Ý
- **Stack trên GH-57 (chưa merge `dev`):** ship phải đợi GH-57 vào `dev` rồi rebase, nếu không PR sẽ kéo theo commit GH-57.
- **Chưa test runtime SSE thật** (cần backend + iot-simulator): xác thực `summary` chảy + chấm live cập nhật ~4s + 401/403 path → để `/kltn-test`.
- Staff `assets:` chưa có UI host (đã hoãn có chủ đích) — hook sẵn sàng, không nợ kỹ thuật ẩn.
- `react-native-sse` error event có `xhrStatus` (cast `SseErrorEvent`) — cần verify thực tế lib phát đúng status ở `/kltn-test`.

## KẾT LUẬN
**PASS** — Độ tự tin: **Cao** (cho phần static/structural). Runtime SSE cần verify ở `/kltn-test`.
