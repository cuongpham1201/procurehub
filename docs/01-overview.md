# 01 — Tổng quan project

## Mô tả

ProcureHub là cổng đấu thầu / mua sắm nội bộ MVP cho **Bia Hạ Long**.

Mục tiêu:
- Quản lý gói thầu mua sắm
- Đăng ký và xét duyệt nhà cung cấp (NCC)
- NCC nộp báo giá online
- Phòng kế hoạch vật tư xét duyệt NCC & báo giá
- So sánh báo giá, chọn nhà cung cấp trúng thầu
- Quản trị người dùng nội bộ
- Nền tảng mở rộng thành hệ thống procurement nội bộ thật

---

## Trạng thái hiện tại

- Next.js App Router chạy production trên Ubuntu homelab
- PostgreSQL thật — toàn bộ business data
- API routes đọc/ghi database
- Domain public qua Cloudflare Tunnel
- PM2 quản lý process
- Dữ liệu đã migrate xong từ localStorage sang PostgreSQL

Production URL: **https://dauthau.zlab.io.vn**

---

## Tech stack

### Frontend
- Next.js App Router
- React
- TypeScript
- TailwindCSS

### Backend
- Next.js API Routes
- Node.js runtime
- Repository pattern

### Database
- PostgreSQL 16
- Docker container trên Ubuntu homelab

### Infrastructure
- Ubuntu 24.04 LTS homelab
- PM2 process manager
- Cloudflare Tunnel
- GitHub (source control)

---

## Branding / UI style

Theme: **Bia Hạ Long**
- Màu chủ: navy blue + gold/yellow
- Layout: white/gray, clean
- Phong cách: corporate procurement portal, internal enterprise

---

## Phase hiện tại

Phase: **Stabilization & UX refinement**

Đang tập trung:
- Ổn định business flow
- UX refinement
- Validation nhất quán
- Hoàn thiện supplier workflow
- Production hardening

Chưa làm:
- Microsoft login
- RBAC thật
- File upload thật
- Email notification
- CI/CD tự động
