# Mobile App — GSU26SE55

> Repo này là Mobile App (React Native/Expo) của hệ thống Solar Battery Maintenance.
> Context dự án đầy đủ: `.claude/CLAUDE.md` | Rules đầy đủ: `.claude/rules/tech/mobile.md`

---

## ⚠️ Critical — hay sai nhất

- **KHÔNG** eject khỏi Expo managed workflow
- Token: `expo-secure-store` — **KHÔNG** dùng `AsyncStorage` cho token
- **KHÔNG** gọi API trong component — luôn qua `services/` → TanStack Query hook
- Axios config nhất quán với Web (`src/lib/axios.ts`)
- Zustand store structure nhất quán với Web (`sessionStore.ts`)
- **KHÔNG** thêm package mới nếu stack hiện tại đủ — hỏi Leader trước

---

## Cấu trúc

```
app/                           ← File-based routing (Expo Router)
├── _layout.tsx                ← Providers: QueryClient, AuthProvider, ThemeProvider
├── index.tsx                  ← Redirect theo role
├── (auth)/login.tsx
└── (customer)/
    ├── dashboard.tsx, batteries/[id].tsx
    ├── tickets/index.tsx, [id].tsx, create.tsx
    └── notifications.tsx

src/
├── features/auth, batteries, tickets
│   └── {feature}/hooks, services, types, components
├── lib/axios.ts, lib/secureStore.ts
└── stores/sessionStore.ts
```

---

## Workflow

```
/kltn-implement [issue-number] → plan.md → approve → code → /kltn-reviewcode → /kltn-test → /kltn-ship [issue-number]
```
