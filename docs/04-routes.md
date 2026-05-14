# 04 — Routes

## Public site

| Route | Mô tả |
|-------|-------|
| `/` | Trang chủ |
| `/tenders` | Danh sách gói thầu công khai |
| `/tenders/[id]` | Chi tiết gói thầu |
| `/login` | Đăng nhập |
| `/supplier/register-account` | Đăng ký tài khoản NCC |

---

## Supplier Portal

| Route | Mô tả |
|-------|-------|
| `/supplier/dashboard` | Dashboard NCC |
| `/supplier/profile` | Hồ sơ năng lực NCC |
| `/supplier/tenders` | Gói thầu dành cho NCC |
| `/supplier/bids` | Báo giá đã nộp |

---

## Admin Portal

| Route | Mô tả |
|-------|-------|
| `/admin` | Dashboard admin |
| `/admin/tenders` | Danh sách gói thầu |
| `/admin/tenders/create` | Tạo gói thầu mới |
| `/admin/tenders/[id]` | Chi tiết gói thầu |
| `/admin/suppliers` | Danh sách NCC |
| `/admin/suppliers/[id]` | Chi tiết NCC |
| `/admin/bids` | Danh sách báo giá |
| `/admin/bid-comparison` | So sánh báo giá |
| `/admin/users` | Quản lý người dùng nội bộ |

---

## API routes

| Route | Mô tả |
|-------|-------|
| `/api/suppliers` | CRUD nhà cung cấp |
| `/api/tenders` | CRUD gói thầu |
| `/api/bids` | CRUD báo giá |
| `/api/internal-users` | CRUD người dùng nội bộ |
| `/api/procurement-groups` | CRUD nhóm mua sắm |
| `/api/material-items` | CRUD danh mục vật tư |
| `/api/activity-logs` | Nhật ký hoạt động |

---

## Guide routes

| Route | Mô tả |
|-------|-------|
| `/guide` | Hướng dẫn sử dụng |
