# AI_CONTEXT.md

# ProcureHub — Hệ thống đấu thầu & mua sắm Bia Hạ Long

## 1. Tổng quan project

Project hiện tại là web đấu thầu / mua sắm nội bộ cho Bia Hạ Long.

Mục tiêu:
- Quản lý gói thầu mua sắm
- Đăng ký nhà cung cấp
- Nhà cung cấp nộp báo giá online
- Phòng kế hoạch vật tư xét duyệt NCC & báo giá
- So sánh báo giá
- Quản trị người dùng nội bộ
- Làm nền tảng để mở rộng thành hệ thống procurement nội bộ thật

Project hiện đã vượt qua phase localStorage mock.

Trạng thái hiện tại:
- Next.js app đã deploy chạy thật trên Ubuntu homelab
- Có PostgreSQL thật
- Có API routes đọc/ghi database
- Có domain public qua Cloudflare Tunnel
- Có PM2 quản lý process
- Dữ liệu business chính đã chuyển từ localStorage sang PostgreSQL

Production domain hiện tại:
- https://dauthau.zlab.io.vn

---

# 2. Tech stack hiện tại

## Frontend

- Next.js App Router
- React
- TypeScript
- TailwindCSS

## Backend

- Next.js API Routes
- Node.js runtime
- Repository layer
- PostgreSQL access qua server-side code

## Database

- PostgreSQL 16
- Chạy trong Docker trên Ubuntu homelab

## Runtime / Hosting

- Ubuntu 24.04 LTS homelab
- PM2 process manager
- Cloudflare Tunnel
- Domain: dauthau.zlab.io.vn

## Source control

- GitHub

---

# 3. Kiến trúc hiện tại

Kiến trúc hiện tại:

```txt
Browser
  ↓
Next.js UI
  ↓
Next.js API Routes
  ↓
Repository layer
  ↓
PostgreSQL
```

Production routing:

```txt
https://dauthau.zlab.io.vn
  ↓
Cloudflare Tunnel
  ↓
Ubuntu homelab
  ↓
Next.js app on localhost:3001
  ↓
PostgreSQL on localhost:5432
```

Không còn dùng localStorage cho business data chính.

localStorage chỉ còn được phép dùng cho:
- session tạm thời
- current user mock nếu chưa build auth thật
- UI state tạm thời nếu cần

Không dùng localStorage để lưu:
- suppliers
- tenders
- bids
- bid comparison
- procurement groups
- internal users business data

---

# 4. Infrastructure hiện tại

## Ubuntu server

Ubuntu homelab:
- Ubuntu 24.04 LTS

IP:
- LAN: 192.168.2.11
- Tailscale: 100.91.188.83

Các service chính:
- Docker
- PostgreSQL
- PM2
- Cloudflare Tunnel
- Portainer
- Adminer
- n8n
- Open WebUI
- Nginx Proxy Manager

---

# 5. PostgreSQL

## Database

Tên database:
- procurehub

User:
- procurehub

Password:
- procurehub_demo_password

Connection string:

```env
DATABASE_URL=postgresql://procurehub:procurehub_demo_password@100.91.188.83:5432/procurehub
```

Khi chạy trên Ubuntu có thể dùng localhost:

```env
DATABASE_URL=postgresql://procurehub:procurehub_demo_password@localhost:5432/procurehub
```

## Lệnh kiểm tra

```bash
psql -h localhost -U procurehub -d procurehub
```

Một số bảng chính:
- suppliers
- tenders
- tender_items
- bids
- bid_items
- internal_users
- procurement_groups
- material_items
- activity_logs

---

# 6. Runtime app trên Ubuntu

App chạy production bằng PM2.

Tên process PM2:
- procurehub

Port:
- 3001

Lệnh thường dùng:

```bash
pm2 list
pm2 restart procurehub --update-env
pm2 logs procurehub
```

App production local URL:

```txt
http://localhost:3001
```

Public URL:

```txt
https://dauthau.zlab.io.vn
```

---

# 7. Cloudflare Tunnel

Tunnel chính đang dùng:
- homelab

Config file:

```txt
/etc/cloudflared/config.yml
```

Các hostname hiện tại:

```txt
n8n.zlab.io.vn      -> http://localhost:5678
ai.zlab.io.vn       -> http://localhost:3000
dauthau.zlab.io.vn  -> http://localhost:3001
```

Lệnh kiểm tra:

```bash
systemctl status cloudflared
```

Lệnh restart:

```bash
sudo systemctl restart cloudflared
```

---

# 8. Coding rules bắt buộc

## Quy tắc phản hồi / làm việc

- Luôn trả lời bằng tiếng Việt
- Luôn giải thích ngắn trước khi sửa code
- Không overengineering
- Không refactor ngoài scope
- Ưu tiên practical solution
- Không abstraction quá sớm
- Ưu tiên dễ maintain
- Ưu tiên build/demo được

## Database rule

- Không query PostgreSQL trực tiếp từ client component
- Không expose DATABASE_URL ra client
- Không dùng NEXT_PUBLIC_DATABASE_URL
- Mọi DB access phải đi qua:
  - API route
  - repository layer
  - server-side code

---

# 9. Branding UI

Theme:
- Bia Hạ Long
- Navy blue
- Gold / yellow
- White / gray clean layout

Phong cách:
- Corporate
- Procurement portal
- Internal enterprise vibe

---

# 10. Routes hiện tại

## Public site

- /
- /tenders
- /tenders/[id]
- /login
- /supplier/register-account

## Supplier Portal

- /supplier/dashboard
- /supplier/profile
- /supplier/tenders
- /supplier/bids

## Admin Portal

- /admin
- /admin/tenders
- /admin/tenders/create
- /admin/tenders/[id]
- /admin/suppliers
- /admin/suppliers/[id]
- /admin/bids
- /admin/bid-comparison
- /admin/users

---

# 11. Authentication hiện tại

Chưa có auth production hoàn chỉnh.

Hiện tại:
- Có mock/session tạm
- Có current user localStorage tạm thời

localStorage hiện chỉ còn:
- procurehub_current_supplier
- procurehub_current_internal_user

Không dùng localStorage cho business master data.

---

# 12. Data architecture hiện tại

Đã chuyển source data chính:

Từ:

```txt
localStorage
```

Sang:

```txt
PostgreSQL
```

## Các layer chính

DB client:
- lib/db.ts

Repository:
- lib/repositories/

API routes:
- app/api/suppliers
- app/api/tenders
- app/api/bids
- app/api/internal-users
- app/api/procurement-groups
- app/api/material-items
- app/api/activity-logs

---

# 13. API convention

Response format:

```ts
{
  data: ...,
  error: null
}
```

Khi lỗi:

```ts
{
  data: null,
  error: "message"
}
```

---

# 14. Supplier flow

## Bước 1 — Đăng ký account

Route:
- /supplier/register-account

## Bước 2 — Hoàn thiện hồ sơ năng lực

Route:
- /supplier/profile

Status:
- Chờ xét duyệt
- Đã duyệt
- Từ chối

## Bước 3 — Supplier dashboard

Route:
- /supplier/dashboard

## Bước 4 — Nộp báo giá

Supplier:
- xem gói thầu
- nộp báo giá
- theo dõi trạng thái

---

# 15. Tender flow

Flow:

```txt
Nháp
→ Đang mở
→ Đã đóng
→ Đang đánh giá
→ Đã có kết quả
```

Ngoài luồng:
- Đã hủy

---

# 16. Admin Portal hiện tại

## Dashboard
- KPI cards
- hoạt động gần đây
- shortcut actions

## Quản lý gói thầu
- danh sách
- search
- filter
- create tender

## Supplier Management
- danh sách NCC
- duyệt NCC
- xem hồ sơ

## Bids Management
- danh sách báo giá
- trạng thái báo giá

## Bid Comparison
- so sánh báo giá
- chọn NCC

## Internal Users
- role
- trạng thái
- tạo/sửa/khóa user

---

# 17. Deployment workflow

## Local development

```bash
npm run dev
```

## Commit code

```bash
git add .
git commit -m "message"
git push
```

## Update production Ubuntu

```bash
cd /data/homelab/apps/procurehub
git pull
npm install
npm run build
pm2 restart procurehub --update-env
```

---

# 18. Database migration

Nếu sửa schema:
- tạo migration trong database/migrations
- test API sau migrate

Lệnh migrate:

```bash
npm run db:migrate
```

Seed demo data:

```bash
npm run db:seed-demo
```

---

# 19. Debug nhanh

## App không lên

```bash
pm2 list
pm2 logs procurehub
curl http://localhost:3001
```

## Domain không lên

```bash
systemctl status cloudflared
sudo systemctl restart cloudflared
curl -I https://dauthau.zlab.io.vn
```

## API báo thiếu DATABASE_URL

```bash
pm2 restart procurehub --update-env
```

---

# 20. Những gì đã làm xong

Đã làm:
- Deploy Ubuntu production runtime
- Tạo PostgreSQL database riêng
- Migrate localStorage → PostgreSQL
- Tạo API routes
- Tạo repository layer
- Chạy app bằng PM2
- Public qua Cloudflare Tunnel
- Đổi domain sang dauthau.zlab.io.vn
- Verify API domain đọc được PostgreSQL
- Verify localhost/domain dùng chung DB

---

# 21. Những gì chưa làm

- Microsoft login
- Supplier email verification
- RBAC thật
- File upload thật
- Email notification
- Audit log đầy đủ
- Backup PostgreSQL
- CI/CD tự động
- Security hardening
- Validation chuẩn
- Testing

---

# 22. Phase tiếp theo nên làm

1. Seed demo data đẹp
2. Fix CRUD chuẩn
3. Dashboard lấy số liệu thật
4. So sánh báo giá dùng data thật
5. Validate form
6. Supplier Portal end-to-end
7. Auth + RBAC
8. File upload
9. Email notification

Luồng demo ưu tiên:

```txt
Admin tạo gói thầu
→ mời NCC
→ NCC đăng nhập
→ NCC xem gói
→ NCC nộp báo giá
→ Admin xem báo giá
→ Admin so sánh
→ Admin chọn NCC
```

---

# 23. Dev principles

Mục tiêu:
- Build nhanh
- Demo usable
- Flow đúng nghiệp vụ
- Dễ maintain

Ưu tiên:
- working flow
- clean UI
- data thật
- ít abstraction
- không phá production

---

# 24. Important reminder for AI agents

Trước khi sửa:
- đọc context này
- scan file liên quan
- không refactor toàn app
- không đổi route nếu không cần
- không quay lại localStorage cho business data

Sau khi sửa:
- chạy build
- hướng dẫn git push / git pull / pm2 restart nếu cần