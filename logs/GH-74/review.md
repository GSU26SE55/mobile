# BÁO CÁO CODE REVIEW — feat/GH-74-sync-wire-value-enums — 2026-07-17

## TÓM TẮT

19 file / +520 −11. Diff bám sát plan; 4 wire value vào đúng enum không đè giá trị nào, khối min/max aggregate mirror đủ 13 field theo doc, SSE `stats` wire vào cả 2 hook theo đúng pattern sẵn có của từng hook. Tìm thấy **1 race condition thật đã fix trong lúc review**. Không còn Critical. **Rủi ro lớn nhất không nằm ở code mà ở chỗ chưa ai chạy nó trên device.**

## PHÂN TÍCH

### 🔴 Critical
Không có.

### 🟠 Đã phát hiện & FIX trong review

**`useBatteryStats.ts:51` — race: seed đè ngược data SSE mới hơn.**
`queryFn` chạy async. Nếu event `stats` về **trong lúc** fetch seed đang bay, `setQueryData` ghi data mới, rồi fetch resolve → **đè bằng seed cũ hơn**. Cũng tái hiện mỗi lần remount màn (`staleTime: Infinity` chỉ chặn refetch, không chặn fetch lần đầu sau remount).
→ **Fix:** `queryFn` đọc cache trước, `if (existing && !existing.isSeed) return existing`. Cờ `isSeed` từ chỗ trang trí trở thành load-bearing.
→ Ảnh hưởng nếu bỏ qua: thấp (event `stats` kế tiếp tự sửa sau vài giây) — nhưng là lỗi đúng nghĩa và fix rẻ.

### 🟡 Warning

**1. `ChargeDischargeChart.tsx` — hành vi chart khi TOÀN BỘ series là null chưa verify.**
Pin idle cả range → mọi `chargeMin/chargeMax` = null. Chưa rõ `CartesianChart` tính domain thế nào khi 1 yKey null 100% (có thể ra NaN → blank/crash). Guard hiện có là `chartData.length < 2` — **không bắt được** case này (có bucket, nhưng giá trị toàn null).
→ Phải test trên device với pin idle. Nếu vỡ: lọc series toàn-null trước khi truyền vào `yKeys`.

**2. `ChargeDischargeChart.tsx:66` — nhãn trục X chỉ căn gần đúng.**
Nhãn render bằng RN `<Text>` + `justifyContent: 'space-between'`, **không** neo theo toạ độ x thật của Skia canvas → lệch nhẹ khi bucket phân bố không đều (có gap). Cosmetic, chấp nhận được ở scope này. (`SensorChart` không dính vì gifted-charts nhúng label vào data point.)

**3. `dashboard.tsx:139` — caption có thể dài trên máy màn nhỏ.**
Thêm 2 cụm `↑x.xA · ↓y.yA` vào caption vốn đã có `SOC · V · °C`. `ProgressListItem` không set `numberOfLines` → có thể wrap 2 dòng, xô layout list.
→ Kiểm lúc test trên device. Không sửa `ProgressListItem` (shared với staff dashboard, ngoài scope).

### ✅ Pass

- **Enum không đè:** `SensorMismatch` vẫn 15, `BatteryAlertEscalationPending` vẫn 16, `Undertemp`=16, `CascadeRiskHigh`=15 — đúng 2 enum khác nhau. `ticket.enum.ts` có 2 `System: 'System'` nhưng thuộc `TicketOriginEnum` + `ActorRoleEnum` → **không phải collision**.
- **`TicketOriginEnum.System` là chuỗi**, không mirror int 4 — khớp `JsonStringEnumConverter` (`api-ticket.md:2189`).
- **null ≠ 0 xuyên suốt:** `formatAmp` dùng `v == null`, dashboard dùng `!= null` (không dùng truthy check → 0A hiển thị đúng thay vì bị nuốt).
- **Field SSE nullable đọc bằng `?? null`** (`statsDtoToView`) — đúng quy ước "field null bị lược khỏi JSON" (§5.3).
- **Guard `stats`:** lọc sai pin + window lạ + `try/catch` JSON — khớp pattern event `reading` sẵn có.
- **Rules-of-hooks:** fleet stream dùng Map thay query cache → dashboard đọc trong `renderItem` (callback) không gọi hook. Tránh đúng lỗi đã dính ở GH-47.
- **Surgical:** `SensorChart` giữ nguyên 100% hành vi nhờ điều kiện `interval === '1h'`; `ProgressListItem` không bị sửa; không refactor ngoài scope.
- **Không gọi API trong component** — qua `services/` → hook (`mobile.md`).
- **`tsc --noEmit` exit 0**; 2 file mới lint **0 warning**.
- **`lib/queryKeys.ts` giữ `window: string`** thay vì import `StatsWindow` — **cố ý**: `lib/` import từ `features/` sẽ tạo dependency ngược (đúng loại circular mà `fe.md` cảnh báo ở `session.types.ts`). Cả 2 call-site đã có `StatsWindow` lo type.

## RỦI RO & LƯU Ý

1. **🔥 CHƯA CHẠY TRÊN DEVICE — rủi ro số 1.** Bước 1 chỉ chứng minh tới tầng `pod install` (Skia `2.2.12` vào `Podfile.lock`, 123 pods sạch) + Metro bundle. **Compile native + render thật thì chưa ai làm.** `/kltn-test 74` BẮT BUỘC chạy `npx expo run:ios` trước khi ship.
2. **SSE `stats` chưa deploy ở BE.** Toàn bộ nhóm 3 không test được end-to-end; hiện UI luôn hiển thị seed REST. Nếu tới ship mà BE chưa lên → cắt nhóm 3 ra issue riêng (nhóm 1+2 độc lập).
3. **`/aggregate/hourly` chưa gọi thật lần nào.** Chỉ chart mới ở range 30d mới chạm tới. Verify bằng network log lúc test.
4. **`eslint --max-warnings=0` FAIL — nhưng fail sẵn trên `dev`** (67 warning, đếm trên `dev` cũng đúng 67; diff này thêm 0). Phần lớn là `no-redeclare` do **chính pattern `as const` mà rule dự án bắt buộc**. Không sửa trong ticket feature (Surgical Changes) → **cần Leader quyết**: chấp nhận, hay tách issue chore chỉnh `eslint.config.js`.
5. **2 lib chart song song** (`gifted-charts` + `victory-native`) — Leader đã duyệt, nhưng bundle iOS giờ 9.22 MB. Theo dõi.

## KẾT LUẬN

**PASS** — Độ tự tin: **Trung bình**

Không còn Critical; race đã fix; các rule mobile/FE đều đạt. Tự tin **Trung bình chứ không Cao** vì lý do thẳng thắn: phần code chiếm nhiều rủi ro nhất (chart Skia + SSE `stats`) **chưa từng chạy một lần nào** — Skia mới link chưa compile, `stats` thì BE chưa deploy. Review tĩnh không thay thế được điều đó.

→ Chạy `/kltn-test 74`, **bắt buộc gồm `npx expo run:ios` trên device/simulator**.
