## BÁO CÁO CODE REVIEW — chat_full (Cross-device 2FA phần của #AUTH-51) — 2026-07-01
### Scope: Mobile — data layer only (types/service/hook), commit `40f6996`
### Effort: Standard (feature nhỏ nhưng có quyết định scope bị đảo ngược cần xác nhận)

### TÓM TẮT
Code data layer (types/service/hook) sạch, đúng pattern (mutation + `handleErrorApi`), `tsc --noEmit` PASS. Không có Critical về code quality. **Vấn đề chính không phải code mà là quy trình**: tính năng này đã được `logs/GH-37/plan.md` loại khỏi scope mobile một cách tường minh, và hiện được thêm lại không kèm giải thích/UI flow — xem mục RỦI RO.

### PHÂN TÍCH
✅ Không tìm thấy Critical/Warning về code style trong 4 file mới/sửa (`auth.types.ts`, `auth.service.ts`, `useCrossDevice2fa.ts`, `endpoints.ts`): dùng `axiosInstance` chung, không hardcode URL, mutation có `onError: (error) => handleErrorApi({ error })` đúng rule.

🟡 Warning: `src/features/auth/hooks/useCrossDevice2fa.ts`
— 2 hook (`useRequestCrossDevice2fa`, `useConfirmCrossDevice2fa`) hoàn toàn không có nơi nào import/sử dụng trong `app/` — dead code tại thời điểm này. Không chặn merge (nhiều feature làm data-layer trước UI), nhưng nếu PR này ship mà chưa có UI thì nên gắn rõ trạng thái "chưa dùng được" để reviewer không tưởng nhầm là feature hoàn chỉnh.

### RỦI RO & LƯU Ý (mục chính của review này)
- **🔴 Quyết định scope bị đảo ngược không có giấy tờ:** `logs/GH-37/plan.md:9` ghi rõ *"Mobile là tập con của GH-88: bỏ Cross-device 2FA (#AUTH-51) ... vì mobile không có camera-from-web flow"*. Lý do loại bỏ đó (không có cách truyền QR/token giữa 2 thiết bị mobile-to-mobile) **vẫn chưa được giải quyết** trong commit này — chỉ có 2 endpoint được wire, không có câu trả lời cho "requestId truyền giữa 2 phone bằng cách nào". Trước khi làm UI, cần Leader/BE xác nhận lại (xem `plan.md` mục "Câu hỏi chưa giải đáp"), nếu không sẽ lặp lại đúng vấn đề đã khiến GH-37 loại bỏ nó.
- **Bundle không liên quan trong cùng commit:** rename `ticket comments`→`ticket chats` (endpoints/queryKeys/SignalR hub ở `tickets`/`staff` feature) đi kèm cùng commit `feat: add login history and cross-device 2FA functionality` nhưng không liên quan tới cả login-history lẫn cross-device-2FA. Đã verify **không còn tham chiếu cũ sót lại** (`grep TICKETS.COMMENT|ticket-comments` → 0 kết quả) nên về mặt kỹ thuật an toàn, nhưng vi phạm nhẹ "Surgical Changes" — nên tách commit khi các PR sau đụng lại vùng này để dễ revert độc lập.
- Rename hub path `/hubs/ticket-comments` → `/hubs/ticket-chats` phụ thuộc BE đã deploy hub mới (giống rủi ro đã ghi ở `frontend/logs/GH-121/review.md`) — do cùng 1 BE migration (20260622), nên xác nhận 1 lần cho cả 2 client thay vì lặp lại.

### PASS
✅ Service/hook dùng `axiosInstance` + `ENDPOINTS`, không hardcode URL
✅ Mutation có `onError: (error) => handleErrorApi({ error })`
✅ `npx tsc --noEmit` — PASS
✅ Không phát sinh eslint warning mới trong file của commit này

### KẾT LUẬN
**FAIL (không phải vì bug, vì thiếu quyết định) tạm dừng trước UI** — Độ tự tin: Cao về chất lượng code, Thấp về việc feature này nên tồn tại ở dạng hiện tại cho tới khi câu hỏi #1–#3 trong `plan.md` được trả lời. Khuyến nghị: giữ nguyên data layer (không hại gì, đã pass gate), nhưng **không bắt đầu UI** cho tới khi có xác nhận từ Leader/BE về cơ chế truyền `requestId` giữa 2 thiết bị mobile.
