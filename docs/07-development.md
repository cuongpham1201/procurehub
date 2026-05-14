# 07 — Development

## Local setup

```bash
npm run dev
```

App chạy tại: `http://localhost:3000`

---

## Coding rules

### Nguyên tắc chung

- Trả lời bằng tiếng Việt
- Giải thích ngắn trước khi sửa code
- Không overengineering
- Không refactor ngoài scope
- Ưu tiên practical solution
- Không abstraction quá sớm
- Ưu tiên dễ maintain
- Ưu tiên build/demo được

### KHÔNG làm

- Không redesign kiến trúc
- Không thay repository pattern
- Không thay API routes
- Không đưa microservices vào
- Không thêm Prisma trừ khi được yêu cầu rõ ràng
- Không thêm Redux/Zustand trừ khi thật sự cần
- Không redesign toàn bộ UI
- Không phá PostgreSQL persistence
- Không đưa business data trở lại localStorage
- Không expose `DATABASE_URL` ra client
- Không dùng `NEXT_PUBLIC_DATABASE_URL`

### NÊN làm

- Giữ implementation đơn giản
- Tái sử dụng repository/helper/service hiện có
- Dùng TypeScript
- Ưu tiên functional components
- Dùng lightweight helpers
- Business logic để ở repository/service layer
- Giữ UI style hiện tại
- Dùng tiếng Việt cho text nghiệp vụ
- Bảo toàn routes hiện có
- Bảo toàn business flow

---

## Quy trình khi sửa code

### Trước khi code

1. Đọc `docs/AI_CONTEXT.md` và `docs/HANDOVER.md`
2. Inspect repositories, API routes, services liên quan
3. Giải thích hiểu biết ngắn gọn
4. Rồi mới implement

### Khi sửa

- Ưu tiên incremental edits
- Bảo toàn business logic
- Tránh rewrite không cần thiết

### Sau khi sửa

- Chạy build: `npm run build`
- Fix TypeScript errors
- Giữ production compatibility
- Hướng dẫn deploy nếu cần: `git push` + `pm2 restart`

---

## Quy tắc database

- Client components **KHÔNG** query PostgreSQL trực tiếp
- Mọi DB access phải qua: `API route → repository → PostgreSQL`
- `DATABASE_URL` chỉ dùng server-side

---

## UI style rules

Admin UI:
- Dark navy sidebar
- Procurement dashboard style
- Compact tables
- Status badges

Supplier UI:
- Portal look nhẹ hơn
- Softer cards
- Dashboard activity section
- Vietnamese business text

Không redesign global UI.
