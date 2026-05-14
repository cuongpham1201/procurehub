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
app/api/suppliers/
app/api/tenders/
app/api/bids/
app/api/internal-users/
app/api/procurement-groups/
app/api/material-items/
app/api/activity-logs/
```

### UI layer
```
app/             — pages (Next.js App Router)
components/      — shared React components
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

## Quy tắc data access

- Client components **KHÔNG** được query PostgreSQL trực tiếp
- `DATABASE_URL` **KHÔNG** được expose ra client
- `NEXT_PUBLIC_DATABASE_URL` **KHÔNG** được dùng
- Mọi DB access phải đi qua: API route → repository → PostgreSQL

---

## localStorage rules

Chỉ được dùng cho:
- `procurehub_current_supplier` — session tạm
- `procurehub_current_internal_user` — session tạm

Tuyệt đối KHÔNG dùng localStorage cho:
- suppliers
- tenders
- bids
- bid comparison
- procurement groups
- internal users
- material items
