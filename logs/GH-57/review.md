## BÁO CÁO CODE REVIEW — feat/GH-57-battery-site-monitoring — 2026-06-28

### TÓM TẮT
Implement 4 sub-feature (Sites, Ambient, Cascade risk, SSE realtime) đúng plan. `tsc --noEmit` PASS (0 lỗi), `expo lint` 0 error. Code nhất quán convention dự án (feature folder, service→hook→component, queryKeys, endpoints single-source, enum `as const`). Không có lỗi chặn ship.

### PHÂN TÍCH

✅ **Kiến trúc:** Không gọi API trong component — đều qua `services/` → TanStack Query hook. Không tạo axios instance mới (dùng `axiosInstance`). SSE hook dùng `BASE_URL` từ `lib/axios`, không hardcode.
✅ **Query keys:** mọi key lấy từ `QUERY_KEY` factory (sites/ambient/cascadeRisk thêm mới đúng pattern). Không có key string inline.
✅ **Endpoints:** path tập trung trong `endpoints.ts` (SITES/AMBIENT/REPORTS/CASCADE_RISK/STREAM). Service import từ ENDPOINTS.
✅ **Enum pattern:** site/ambient/cascade theo `as const` + type alias. Cascade `level`/`topology` string-valued đúng contract BE; site/ambient int đúng.
✅ **Loading/error/empty:** Site detail có loading + notfound; AmbientTile empty state khi 404; CascadeRiskBadge render null khi null/404; chart empty khi <2 điểm. `useAmbientLatest`/`useCascadeRisk` đặt `retry:false` cho 404.
✅ **SSE merge an toàn:** `useBatterySensorStream` merge **field whitelist** vào cache `realtime(id)`, skip khi `old` chưa seed, lọc `batteryAssetId` + `sensorSourceCode==='primary'`, parse trong try/catch (swallow), bỏ qua `ping`, cleanup `removeAllEventListeners()` + `close()`. Không đè mất `serialNumber/status/activeAlerts`.
✅ **Token:** SSE token lấy qua `getAccessToken()` (secure-store), truyền `?access_token=` + header. Không dùng AsyncStorage.
✅ **Expo Router:** route mới `sites/[id]` đã regenerate `.expo/types` → tsc nhận diện route. Site detail wrap `PermissionGuard P.BATTERY_VIEW`.
✅ **Không console.log / không hardcode URL** trong file mới.

🟡 **Warning — SSE token staleness** (`useBatterySensorStream.ts`): token chụp 1 lần lúc mount; session >1h → access token đổi, SSE reconnect (auto của react-native-sse) dùng token cũ có thể 403. **Giảm thiểu:** polling `/realtime` (30s, có refresh qua axios) vẫn seed + fallback nên UI không vỡ — đúng thiết kế "realtime augments". Chấp nhận trong scope; có thể nâng cấp re-open stream sau refresh ở ticket sau.
🟡 **Warning — auto-reconnect khi 403 bền vững:** react-native-sse mặc định reconnect (~5s). Nếu mở stream cho pin không có quyền (không xảy ra với pin của chính user) sẽ loop. Đúng P3 nit đã ghi trong plan — không bắt buộc xử lý.
🟡 **Minor — `ENDPOINTS.AMBIENT.HISTORY` chưa dùng:** plan chỉ wire `latest` + `trend` (history bỏ khỏi scope hook). Endpoint để lại như tài liệu API (convention endpoints = single source). Có thể xóa nếu muốn tối giản — ưu tiên thấp.

### RỦI RO & LƯU Ý
- Chưa test runtime với BE thật (SSE event, cascade-risk, ambient) — để `/kltn-test` + verify thủ công.
- Working tree còn thay đổi **không thuộc GH-57** (docs/, logs/GH-55, GH-56, GH-58, feature incidents) — `/kltn-ship` phải scope commit chỉ file GH-57.
- Deviation đã ghi nhận: `AmbientTrendChart` dùng `react-native-svg` (sẵn có) thay Victory Native → không thêm package. Package mới duy nhất: `react-native-sse` (Leader đã duyệt).

### KẾT LUẬN
**PASS** — Độ tự tin: **Cao**
3 warning đều là trade-off đã biết/đã ghi trong plan, không chặn ship. Tiếp theo: `/kltn-test GH-57`.
