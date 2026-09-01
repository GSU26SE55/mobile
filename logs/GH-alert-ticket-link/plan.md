# Plan — Alert detail: hiển thị trạng thái link ticket (khớp FE)

## Metadata
- **Status:** PLANNING | **Role:** Mobile | **Ngày:** 2026-09-01
- **Issue:** (yêu cầu trực tiếp từ Leader) — parity FE ↔ Mobile phần alert-ticket

## Mục tiêu
FE (`AlertsView`) luôn hiển thị dòng "Ticket" trong chi tiết alert: có `ticketId` → link, không có → "—".
Mobile hiện:
- Customer `alerts/[id]`: card "Linked ticket" chỉ hiện khi có ticketId, không có thì ẩn hẳn → user không biết alert chưa gắn ticket.
- Staff `alerts/[id]`: KHÔNG có dòng/card ticket nào.
Cần: cả 2 màn luôn cho biết alert đã gắn ticket hay chưa.

## Scope
**Trong scope:**
- `app/(customer)/alerts/[id].tsx`: khi `!alert.ticketId` → hiện card trạng thái "Chưa có ticket" (disabled) thay vì ẩn.
- `app/(staff)/alerts/[id].tsx`: thêm card ticket — có ticketId → link `/(staff)/tickets/[id]`; không có → card "Chưa có ticket".
**Ngoài scope:**
- Không thêm chức năng "tạo ticket từ alert" (FE cũng không có ở màn này).
- Không đụng list alert, không đụng logic resolve/acknowledge.
- Không đụng type/enum (AlertDto.ticketId đã có sẵn ở cả 2 repo).

## Files
| File | Action | Ghi chú |
|------|--------|---------|
| `app/(customer)/alerts/[id].tsx` | modify | Thay `{alert.ticketId ? <card> : null}` → luôn render, nhánh else là card "no ticket" |
| `app/(staff)/alerts/[id].tsx` | modify | Thêm card ticket sau card thông tin; link khi có, placeholder khi không |

## Approach
- Dùng lại style `linkCard` / `miniIconWrap` đã có ở customer file. Staff file chưa có style này → thêm style tương tự (card trắng, icon tròn, chevron) hoặc render bằng `Row` sẵn có + link.
- Staff: đơn giản nhất là thêm 1 `Pressable` card cùng pattern customer, đặt sau card "Row list" trong ScrollView.
- Card "no ticket": không `onPress`, icon xám, text "Chưa có ticket được tạo từ cảnh báo này".

## Steps
- [ ] Bước 1: `app/(customer)/alerts/[id].tsx` — thêm nhánh else cho ticket card
- [ ] Bước 2: `app/(staff)/alerts/[id].tsx` — thêm ticket card (link / placeholder) + styles
- [ ] Bước 3: `npx tsc --noEmit` → PASS
