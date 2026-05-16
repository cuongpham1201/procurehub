# 02 — Kiến trúc hệ thống

## Stack layers

```
Browser
  ↓
Next.js UI  (app/  — React components, pages)
  ↓
Next.js API Routes  (app/api/  — server-side handlers)
  ↓
Repository layer  (lib/repositories/  — DB queries)
  ↓
PostgreSQL  (Docker container trên Ubuntu homelab)
```

## Production routing

```
https://dauthau.zlab.io.vn
  ↓
Cloudflare Tunnel
  ↓
Ubuntu homelab  (192.168.2.11)
  ↓
Next.js app  (localhost:3001)
  ↓
PostgreSQL  (localhost:5432)
```

---

## Các layer chính

### DB client
- `lib/db.ts` — pool connection tới PostgreSQL

### Repository layer
- `lib/repositories/` — mọi SQL query đặt ở đây

### API routes
```
app/api/auth/login        POST — đăng nhập (cả internal và supplier)
app/api/auth/logout       POST — đăng xuất, xóa cookie
app/api/auth/me           GET  — lấy thông tin session hiện tại
app/api/suppliers/        GET/POST/PUT
app/api/tenders/          GET/POST/PUT
app/api/bids/             GET/POST
app/api/bids/[id]         GET/PUT/DELETE
app/api/internal-users/   GET/POST
app/api/procurement-groups/
app/api/material-items/
app/api/award-items/      GET/PUT/DELETE  (so sánh báo giá theo từng hạng mục)
app/api/award-items/finalize  POST       (trao thầu, cập nhật trạng thái tất cả bids)
app/api/activity-logs/    GET
app/api/notifications/    GET/POST/PUT
```

### UI layer
```
app/             — pages (Next.js App Router)
components/      — shared React components
hooks/           — useCurrentUser (JWT session từ /api/auth/me)
services/        — service wrappers gọi API routes (apiClient.ts)
```

---

## API response convention

Thành công:
```ts
{ data: ..., error: null }
```

Lỗi:
```ts
{ data: null, error: "message" }
```

---

## Auth & Session

- **JWT cookie** `ph_auth` (httpOnly, sameSite=lax) — source of truth cho mọi session
- `proxy.ts` (middleware) — guard toàn bộ `/admin/*` và `/supplier/dashboard/*` tại edge
- `lib/auth/session.ts` — signSession / verifySession (jose)
- `lib/auth/server.ts` — `getServerSession()` để dùng trong API routes
- `hooks/useCurrentUser` — fetch `/api/auth/me` từ client, trả `{ user, loading }`
- **localStorage KHÔNG được dùng** cho bất kỳ business data hay session nào

---

## Quy tắc data access

- Client components **KHÔNG** được query PostgreSQL trực tiếp
- `DATABASE_URL` **KHÔNG** được expose ra client
- Mọi DB access phải đi qua: `services/` (apiClient) → API route → repository → PostgreSQL
- Session detection trong React component: dùng `useCurrentUser()` hook, **không** dùng localStorage

---

## Activity log attribution

Mọi API route có ghi data cần dùng `withActorFallback(getActorFromRequest(request), actorFromSession(session))`:
1. `getActorFromRequest` đọc `x-actor-*` headers (hiện luôn rỗng — kept for forward compat)
2. `actorFromSession` (helper trong `lib/activity-log.ts`) map JWT session → ActivityActor
3. Entity-level fallback (supplierId, supplierName…) làm last resort

---

## localStorage — trạng thái hiện tại

**KHÔNG dùng localStorage** cho bất kỳ thứ gì. Tất cả session đã migrate sang JWT cookie.

Các file sau có chứa dead-code localStorage chưa xóa (an toàn để xóa sau):
- `services/authStorage.ts` — `getInternalSession`, `setInternalSession`, `clearAllSessions`
- `services/supplierAccountStorage.ts` — `getCurrentSession`, `setCurrentSession`, `clearSession`

---

## Service layer

`services/apiClient.ts` — 4 hàm cơ bản: `apiGet`, `apiPost`, `apiPut`, `apiDelete`
- Tất cả gọi `fetch()` với `credentials: 'same-origin'` (mặc định)
- Cookie `ph_auth` được gửi tự động — không cần header thêm
- Không còn đọc localStorage

Các service wrapper:
| File | Backend |
|------|---------|
| `tenderStorage.ts` | `/api/tenders` |
| `supplierBidStorage.ts` | `/api/bids` |
| `supplierAccountStorage.ts` | `/api/suppliers` |
| `categoryStorage.ts` | `/api/procurement-groups`, `/api/material-items` |
| `authStorage.ts` | `/api/internal-users` |
