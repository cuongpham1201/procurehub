# AI_CONTEXT.md — ProcureHub

> Đọc file này trước khi bất kỳ thao tác code nào.
> Xem chi tiết trong các file docs bên dưới.

---

## Một dòng mô tả

ProcureHub là cổng đấu thầu / mua sắm nội bộ MVP cho **Bia Hạ Long**, chạy production trên Ubuntu homelab với PostgreSQL và Next.js App Router.

Production URL: **https://dauthau.zlab.io.vn**

---

## Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | Next.js App Router, React, TypeScript, TailwindCSS |
| Backend | Next.js API Routes, Node.js |
| Database | PostgreSQL 16 (Docker, Ubuntu homelab) |
| Runtime | PM2, Ubuntu 24.04 LTS |
| Tunnel | Cloudflare Tunnel → dauthau.zlab.io.vn |

---

## Kiến trúc 1 dòng

```
Browser → Next.js UI → API Routes → Repository (lib/repositories/) → PostgreSQL
```

---

## Quy tắc bắt buộc

1. Không query PostgreSQL từ client component
2. Không expose `DATABASE_URL` ra client
3. Không dùng localStorage cho business data
4. Không redesign kiến trúc
5. Không overengineer
6. Sau khi sửa: `npm run build`

---

## Docs đầy đủ

| File | Nội dung |
|------|----------|
| [01-overview.md](01-overview.md) | Tổng quan, tech stack, mục tiêu |
| [02-architecture.md](02-architecture.md) | Layers, API convention, localStorage rules |
| [03-database.md](03-database.md) | PostgreSQL config, bảng, migration |
| [04-routes.md](04-routes.md) | Tất cả routes |
| [05-business-flows.md](05-business-flows.md) | Tender/supplier/bid flows |
| [06-deployment.md](06-deployment.md) | Deploy Ubuntu, PM2, Cloudflare, debug |
| [07-development.md](07-development.md) | Coding rules, local dev |
| [08-roadmap.md](08-roadmap.md) | Đã làm, backlog, ưu tiên |
| [HANDOVER.md](HANDOVER.md) | DO / DO NOT cho AI agents |
