## BÁO CÁO CODE REVIEW — feat/GH-24-staff-battery-view — 2026-06-14
### Scope: FE (Mobile)
### Effort: Deep (nhiều file, refactor shared base + 2 screen mới + entry point)

### TÓM TẮT
Refactor `src/features/batteries/` thành shared base chuẩn (mirror FE: tách `battery-asset` / `sensor-reading` / `alert` thành service–types–hook) + màn Staff Battery View & Alert Detail read-only + entry point trong staff ticket detail. Code đúng kiến trúc, `tsc --noEmit` PASS, 0 lint error. Không phát hiện Critical.

### PHÂN TÍCH

✅ **Architecture**
- Không gọi API trong component — mọi screen consume qua hook TanStack Query; `axiosInstance` chỉ xuất hiện trong 3 file `services/` (battery, sensor-reading, alert). Verified bằng grep.
- File đặt đúng chỗ: domain battery/sensor/alert trong `features/batteries/`; `alert.enum.ts` ở `shared/enums/` (dùng cross-feature) — đúng quy tắc.
- Không cross-feature import: alert detail screen import `ANOMALY_LABEL` từ `AssetAlertList` (cùng feature batteries); enum/type đều nội bộ batteries hoặc shared. Không có `features/<A>` → `features/<B>`.
- Dùng `shared/lib/axios.ts`, không tạo instance mới.
- Zustand không bị lạm dụng cho server state (chỉ session ở chỗ khác).

✅ **Error Handling / Query**
- `queryKey` dùng `QUERY_KEY` factory (`batteryAssets.*`, `sensorReadings.*`, `alerts.*`) — không inline array.
- Realtime + latest dùng `staleTime:0 + refetchInterval:30_000` đúng pattern Web.
- Read-only feature, không có mutation/form → không cần `handleErrorApi({setError})`; screen xử lý `isLoading`/`isError` bằng empty state. Hợp lệ.

✅ **Auth & Security**
- `app/(staff)/_layout.tsx` guard `!user || user.role !== 'STAFF' → Redirect /(auth)/login`. 2 route mới (`batteries/[id]`, `alerts/[id]`) đã đăng ký `Stack.Screen` và **kế thừa** auth+role guard của layout. Không cần wrap riêng (pattern Expo Router layout-level).
- Không hardcode URL/token — endpoint qua `ENDPOINTS`, base URL qua `.env` (EXPO_PUBLIC_API_URL).
- Không render sensitive data thừa.

✅ **Code Quality**
- Component PascalCase (`BatteryInfoCard`, `BatteryRealtimeCard`, `SensorChart`, `AssetAlertList`).
- Không còn `console.log/warn/error` (grep sạch).
- Phân biệt `0` vs `null` đúng: realtime card dùng `v == null` cho V/A/temp/SOC (0 là giá trị hợp lệ), không dùng truthy.
- Rename `ENDPOINTS.BATTERIES`→`BATTERY_ASSETS` và `QUERY_KEY.batteries`→`batteryAssets` — grep xác nhận **không còn dangling ref** nào; `useMyBatteryAssets` đã migrate; tsc PASS.
- Typed routes regenerate đúng (`.expo/types/router.d.ts`, gitignored) nên `router.push('/(staff)/batteries/[id]')` hợp lệ.

🟡 **Warning (không chặn)**
- `src/features/batteries/hooks/useSensorReadingLatest.ts` & `useSensorReadingHistory.ts` — tạo cho shared base nhưng **chưa được màn Staff tiêu thụ** (screen dùng `realtime` đã bao gồm reading mới nhất). Đây là chủ đích theo quyết định scope #2 (build full shared base để Customer Battery issue song song reuse) — không phải dead code lỗi. Gợi ý: Customer screen sẽ dùng; nếu Customer issue không dùng thì cân nhắc bỏ ở sprint sau.
- `app/(staff)/tickets/[id].tsx:213` — `ticket.batteryAssetId as string` cast sau guard `ticket.batteryAssetId &&`. Cast cần thiết do TS không narrow `string|null` trong closure params; chấp nhận được, có guard bảo vệ.

### RỦI RO & LƯU Ý
- **Branch lẫn thay đổi ngoài GH-24:** branch kéo theo ~29 file uncommitted của GH-22 + 2FA (theo lựa chọn của user lúc tạo branch). Diff `dev...HEAD` vì vậy bị nhiễu (vd `app/(staff)/tickets/[id].tsx` hiện +74/-51 do gồm cả GH-22). **Khi `/kltn-ship` PHẢI stage ĐÚNG file thuộc GH-24** (đã liệt kê trong review), không `git add -A`.
- Customer battery screen (`app/(customer)/batteries/[id].tsx`) **không** được refactor (ngoài scope) — vẫn chạy vì `BatteryAssetDto` mở rộng additive; tsc PASS xác nhận không vỡ.
- Chart vẽ bằng `react-native-svg` sẵn có — không thêm package (đúng rule).
- Lint còn 6 warning `no-redeclare` — baseline có sẵn của convention enum `as const` toàn codebase (ticket.enum.ts 12, account.enum.ts 1), không phải regression.

### File thuộc GH-24 (whitelist cho /kltn-ship)
```
src/lib/endpoints.ts (M)               src/lib/queryKeys.ts (M)
src/shared/enums/alert.enum.ts (A)
src/features/batteries/enums/battery.enum.ts (M)
src/features/batteries/types/{battery,sensor-reading,alert}.types.ts (M/A/A)
src/features/batteries/services/{battery,sensor-reading,alert}.service.ts (M/A/A)
src/features/batteries/hooks/{useMyBatteryAssets(M),useBatteryAsset,useBatteryAssetRealtime,
  useSensorReadingLatest,useSensorReadingHistory,useSensorReadingAggregate,useAssetAlerts,useAlert} (A)
src/features/batteries/components/{BatteryInfoCard,BatteryRealtimeCard,SensorChart,AssetAlertList}.tsx (A)
app/(staff)/batteries/[id].tsx (A)     app/(staff)/alerts/[id].tsx (A)
app/(staff)/_layout.tsx (M)            app/(staff)/tickets/[id].tsx (M — chỉ phần card "Xem thông tin pin")
```

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**

> Không có Critical. 2 Warning đều không chặn (chủ đích/đã có guard). Lưu ý quan trọng nhất là ship-time: stage đúng file GH-24, tránh lẫn GH-22/2FA.
