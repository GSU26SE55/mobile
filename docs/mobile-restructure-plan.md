# Mobile — Plan tổ chức lại cấu trúc `src/`

> **Ngày:** 2026-07-19 · **Trạng thái:** PLAN — chờ review, CHƯA code.
> **Phương pháp khảo sát:** 1 agent Explore + verify grep. Mọi số liệu dưới là bằng chứng thực.
> Tham chiếu: frontend đã refactor xong (gom domain theo layer + ESLint feature-isolation) — mobile làm **tương tự nhưng có khác biệt quan trọng** (xem §0).

---

## 0. Khác biệt cốt lõi mobile vs frontend (quyết định cách làm)

| | Frontend (đã xong) | Mobile (hiện tại) |
|---|---|---|
| Import style | `@/*` sạch (đổi path dễ) | **255 file dùng relative `../../../`**, alias `@/` = **0 file dùng** |
| tsconfig alias | `@/* → ./src/*` | `@/* → ./*` (trỏ **root**, không phải src) → hiện `@/src/lib/theme` mới đúng |
| Feature-based | file phẳng trong layer → cần gom domain | **đã feature-based tốt** (17 feature-domain, layer gọn) |
| `src/shared` | đầy đủ | **gần trống** (chỉ components 5 + enums 6) |
| Thứ dùng chung | ở `src/shared/*` | nằm rải ở **root** (`src/lib`, `src/hooks`, `src/types`, `src/stores`) |
| ESLint isolation | đã có + enforce | **CHƯA có** |

**Hệ quả:** Mobile KHÔNG có vấn đề "file phẳng cần gom domain trong layer" như frontend (features đã là domain). Vấn đề mobile là:
1. **Import relative sâu, lộn xộn, không nhất quán** (vd cùng file theme có 5 kiểu path: `../../../lib/theme`, `../../../src/lib/theme`...). → Di chuyển file lúc này **rất dễ vỡ**.
2. **Code dùng chung nằm ở root** thay vì `src/shared/`.
3. **Cross-feature import tràn lan** (feature reach vào feature khác).
4. **Enum đặt sai chỗ** (vài enum shared chỉ 1 feature dùng; `FilePurposeEnum` 4 feature dùng nhưng nằm trong feature).

---

## 1. ⚠️ Việc NỀN TẢNG bắt buộc làm TRƯỚC: bật alias `@/` + chuẩn hóa import

**Lý do:** 255 file relative sâu. Nếu di chuyển file (theme, lib...) mà chưa có alias, mọi `../../../` phải tính lại thủ công → cực dễ sai. Frontend không gặp vì đã dùng `@/`.

**Bước 1a — Sửa tsconfig alias** để `@/` trỏ `src/`:
```jsonc
// tsconfig.json — đổi
"paths": { "@/*": ["./src/*"] }   // hiện là ["./*"]
```
> Cần kiểm `app/` (Expo Router, nằm ngoài src) import vào src thế nào — nếu app dùng `../src/...` thì thêm alias riêng hoặc giữ. Sẽ xác minh khi làm.

**Bước 1b — Chuẩn hóa toàn bộ import relative → alias `@/`** (script Node, như đã làm ở frontend):
- `../../../lib/theme` / `../../../src/lib/theme` → `@/lib/theme` (tạm, trước khi move sang shared)
- Áp cho cả `src/` và `app/`.
- Verify: `tsc --noEmit`/`expo` typecheck sau bước này (chưa move file, chỉ đổi path → phải sạch).

> **Đây là bước rủi ro-thấp nhưng nhiều file nhất.** Làm xong + verify mới sang các bước sau. Không có bước này, các bước dưới không an toàn.

---

## 2. Di chuyển thứ dùng chung ở root → `src/shared/`

Đưa về đúng chỗ như frontend. Số nơi import (đã grep) trong ngoặc:

| Hiện tại (root) | Đích | Ghi chú |
|---|---|---|
| `src/lib/` (axios 34, endpoints 33, errors 25, secureStore 16, authz 1, push 1, queryKeys 84, deviceId 0, theme 81) | `src/shared/lib/` | infra — KHÔNG nhóm domain (giống frontend) |
| `src/lib/theme.ts` (81) | `src/shared/theme/` | **tách riêng theme** (user yêu cầu từ đầu). Xem §5 |
| `src/hooks/` (useCountdown 2, useAuthGuard 0) | `src/shared/hooks/` | generic |
| `src/types/api.types` (27), `session.types` (6) | `src/shared/types/` | generic → root shared/types |
| `src/stores/sessionStore` (12) | `src/shared/stores/` | |
| `src/context/authContext` (1) | `src/shared/context/` | |
| `src/config/googleAuth` (0) | `src/shared/config/` hoặc xóa nếu dead | 0 import → kiểm dead |

> `queryKeys` (84) + `theme` (81) là 2 module import nhiều nhất — di chuyển phải cẩn thận, verify ngay sau.

**Lưu ý `deviceId`, `useAuthGuard`, `googleAuth` = 0 import** → có thể dead. Kiểm trước khi move (xóa nếu dead, đừng move rác).

---

## 3. Sửa enum đặt sai chỗ (shared/enums ↔ features/*/enums)

**Enum trong `shared/enums` nhưng chỉ 1 feature dùng** → cân nhắc chuyển về feature sở hữu:
| Enum | Chỉ feature | Đề xuất |
|---|---|---|
| `chat.enum` | tickets | → `features/tickets/enums/` (hoặc giữ nếu sắp có chat cross-feature) |
| `incident.enum` | incidents | → `features/incidents/enums/` |
| `session.enum` (UserRole) | batteries + `src/types/session.types` | **GIỮ shared** (UserRole là core auth, nhiều nơi cần) |

**Enum trong feature nhưng ≥2 feature dùng** → nâng lên shared:
| Enum | Vị trí hiện tại | # feature | Đích |
|---|---|---|---|
| `FilePurposeEnum` (`file-storage.enum`) | `features/file-storage/enums/` | **4** (file-storage, profile, staff, tickets) | → `src/shared/enums/file-storage.enum.ts` |

**Enum đúng chỗ (giữ nguyên):** `alert`, `kb`, `ticket` (shared, ≥2 feature ✓); các enum local chỉ 1 feature dùng (battery, cascade, profile, notification, staff, site, iot-device, ambient, account, battery-type) ✓.

---

## 4. Xử lý cross-feature import (feature → feature)

Đây là vi phạm nhiều nhất. Nguyên tắc: **code dùng ≥2 feature → đưa lên `src/shared/`**, feature không import feature khác.

| Vi phạm | Giải pháp |
|---|---|
| **staff → tickets** (nặng nhất: `SlaCountdown`, `TicketStatusBadge`, `ProcessingDurationTimer`, ticket types, service) | Đưa component/type ticket dùng chung lên `shared/components/ticket/` + `shared/types/ticket.types.ts` |
| **staff/kb/sites/tickets → BatteryAssetDto** (batteries) | `BatteryAssetDto` → `shared/types/battery.types.ts` (3 feature dùng) |
| tickets/staff/kb → `TicketDTO`/`TicketDetailDTO` | → `shared/types/ticket.types.ts` (3 feature) |
| profile/staff → `AccountDto` | → `shared/types/account.types.ts` (2 feature) |
| profile/tickets/staff → file-storage (service, `validateFile`, `FilePurposeEnum`) | file-storage service/util dùng chung → `shared/` |
| auth → notifications (`device-token.service`) | cân nhắc: device-token là hạ tầng push → `shared/services/` |
| incidents → batteries (`useMyBatteryAssets`), kb → tickets | đưa hook/type dùng chung lên shared |

> Đây là phần **impact cao nhất**, đụng nhiều file. Nên làm **sau** khi đã có alias (§1) + shared (§2).

---

## 5. Tách theme (yêu cầu gốc của user)

`src/lib/theme.ts` (81 import) export: `Colors` (bảng màu lớn + status ticket `st*` + badge), `BadgeColors`, `Spacing`, `Radius`, `Font`, `Shadow`.

**Đề xuất** (tham khảo frontend `shared/theme/`):
```
src/shared/theme/
├── index.ts          ← barrel re-export (giữ import gọn)
├── colors.ts         ← Colors (palette) + BadgeColors
├── tokens.ts         ← Spacing, Radius, Font, Shadow
└── (tùy chọn) statusColors.ts  ← map ticket/alert status → màu (gom st* rải rác)
```
- 81 import đổi `@/lib/theme` → `@/shared/theme` (sau khi §1 xong thì chỉ 1 path để đổi).
- RN không có CSS var/Tailwind như frontend → theme là object JS thuần (giữ nguyên cách dùng).

---

## 6. Thêm ESLint no-restricted-imports (feature isolation)

Như frontend — nhưng mobile có **17 feature** (nhiều hơn 4). Cần:
- Bật rule chặn cross-feature (mỗi feature không import 16 feature kia).
- **CHỈ bật sau khi §4 xử xong** (nếu bật trước, CI đỏ ngay vì đang vi phạm tràn lan).
- Message tiếng Việt, trỏ "đưa code chung ra src/shared/".

---

## 7. Thứ tự thực hiện đề xuất (rủi ro thấp→cao)

1. **§1 Alias + chuẩn hóa import** (nền tảng, bắt buộc trước) → verify.
2. **§2 Move root → shared/** (theme, lib, hooks, types, stores) → verify từng nhóm.
3. **§3 Sửa enum đặt sai chỗ** → verify.
4. **§5 Tách theme** thành colors/tokens → verify.
5. **§4 Xử cross-feature** (nặng nhất, đưa type/component chung lên shared) → verify.
6. **§6 ESLint isolation** (sau cùng, khi đã sạch cross-feature) → verify.
7. Cập nhật `rules/tech/mobile.md` phản ánh cấu trúc mới.

**Verify mỗi bước:** mobile không có `npm run build` như web → dùng `npx tsc --noEmit` + `npx eslint .`. (Có thể thêm `expo export`/prebuild check nếu cần, nhưng tsc là gate chính.)

---

## 8. Điểm cần USER quyết trước khi code

1. **Alias mapping**: đổi `@/* → ./src/*` (khuyến nghị, giống frontend) — nhưng `app/` (Expo Router) nằm ngoài src, cần kiểm cách app import. Đồng ý đổi mapping?
2. **Phạm vi đợt này**: làm hết §1–§7, hay chia nhỏ (vd chỉ §1+§2+§5 = alias + move shared + tách theme trước, để cross-feature §4 sau)?
3. **Enum `chat`/`incident`**: chuyển về feature (chỉ 1 feature dùng) hay giữ shared (phòng mở rộng)?
4. **`app/` (Expo Router)**: có chuẩn hóa import trong app/ luôn không, hay chỉ src/?
5. **Dead files** (`deviceId`, `useAuthGuard`, `googleAuth` = 0 import): xóa hay giữ?

---

*Chưa thực hiện gì. Chờ review + trả lời §8 rồi mới code từng bước, verify sau mỗi bước.*
