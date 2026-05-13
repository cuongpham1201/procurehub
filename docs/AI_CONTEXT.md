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
- Quản trị nội bộ

Project đang ở phase:
- Frontend-first
- UI + flow + localStorage mock
- Chưa có backend thật
- Sau này migrate PostgreSQL trên Ubuntu server homelab

Không làm overengineering giai đoạn đầu.

---

# 2. Tech stack

- Next.js App Router
- TypeScript
- TailwindCSS
- localStorage mock data
- Kiến trúc:
  UI → service/storage layer → future API/backend

Database tương lai:
- PostgreSQL
- Có thể chạy Docker trên Ubuntu homelab

Không dùng:
- Redux
- JWT thật
- Middleware auth phức tạp
- Backend thật
- API thật

---

# 3. Coding rules bắt buộc

## Quy tắc phản hồi

- Luôn trả lời bằng tiếng Việt
- Luôn giải thích ngắn trước khi sửa code
- Luôn mô tả command sẽ làm gì trước khi chạy
- Không chỉ hiện raw command
- Không dùng tiếng Anh trừ technical keywords cần thiết
- UI text và comment code phải dùng tiếng Việt tự nhiên

## Coding style

- Không overengineering
- Không refactor ngoài scope
- Ưu tiên practical solution
- Component đơn giản
- Không abstraction quá sớm
- Không chia file quá nhỏ
- Không thêm library nếu chưa cần
- Ưu tiên dễ maintain

---

# 4. Branding UI

Theme:
- Bia Hạ Long
- Navy blue
- Gold/yellow
- White/gray clean layout

Phong cách:
- Corporate
- Procurement portal
- Practical
- Gọn
- Internal enterprise vibe

Logo:
- Đặt trong:
  public/images/logo/

Ví dụ:
- public/images/logo/logo-biahalong.png

---

# 5. Kiến trúc hệ thống hiện tại

## Public site

Routes:

- /
- /tenders
- /tenders/[id]
- /login
- /supplier/register-account

## Supplier Portal

Routes:

- /supplier/dashboard
- /supplier/profile
- /supplier/tenders
- /supplier/bids

## Admin Portal

Routes:

- /admin
- /admin/tenders
- /admin/tenders/create
- /admin/tenders/[id]
- /admin/suppliers
- /admin/suppliers/[id]
- /admin/bids
- /admin/comparison
- /admin/users

---

# 6. Authentication hiện tại

## Login chung

Trang:
- /login

Có 2 loại account:
- Nhà cung cấp
- Nội bộ

## Supplier auth

localStorage:

- procurehub_supplier_accounts
- procurehub_current_supplier

## Internal auth

localStorage:

- procurehub_admin_users
- procurehub_current_internal_user

Fallback admin mock:

email:
admin@biahalong.vn

password:
admin123

role:
Admin

---

# 7. Flow Supplier

## Bước 1 — Đăng ký account

Route:
- /supplier/register-account

Chỉ cần:
- Tên công ty
- Email
- Password
- Người liên hệ
- SĐT

Sau khi tạo:
- lưu localStorage
- login được

## Bước 2 — Hoàn thiện hồ sơ năng lực

Route:
- /supplier/profile

Thông tin:
- MST
- Địa chỉ
- Website
- Giới thiệu doanh nghiệp
- Nhóm hàng
- Hồ sơ đính kèm

Status:
- Chờ xét duyệt
- Đã duyệt
- Từ chối

## Bước 3 — Supplier dashboard

Route:
- /supplier/dashboard

Hiển thị:
- Trạng thái hồ sơ
- Gói thầu đang mở
- Báo giá đã nộp
- Thông báo
- Shortcut actions

## Bước 4 — Nộp báo giá

Supplier:
- xem gói thầu
- nộp báo giá
- upload file
- theo dõi trạng thái

---

# 8. Flow Tender

## Trạng thái gói thầu

Flow:

Nháp
→ Đang mở
→ Đã đóng
→ Đang đánh giá
→ Đã có kết quả

Ngoài luồng:
- Đã hủy

## Ý nghĩa

### Nháp
Chưa public.

### Đang mở
NCC có thể nộp báo giá.

### Đã đóng
Ngừng nhận báo giá.

### Đang đánh giá
Phòng vật tư đang đánh giá.

### Đã có kết quả
Đã chọn NCC.

### Đã hủy
Ngừng quy trình.

---

# 9. Admin Portal hiện tại

## Dashboard

/admin

Có:
- KPI cards
- hoạt động gần đây
- việc cần xử lý
- shortcut actions

## Quản lý gói thầu

/admin/tenders

Có:
- danh sách
- search
- filter
- create tender
- update status
- xem chi tiết

## Create Tender

/admin/tenders/create

Có:
- form tạo gói
- nhiều dòng vật tư
- điều kiện thương mại
- trạng thái draft/open

## Supplier Management

/admin/suppliers

Có:
- danh sách NCC
- duyệt NCC
- xem hồ sơ

## Admin auth guard

/admin/*
được bảo vệ bằng:
- procurehub_current_internal_user

Không cho:
- guest
- supplier account

---

# 10. localStorage conventions

## Supplier

procurehub_supplier_accounts

procurehub_current_supplier

procurehub_supplier_profiles

## Internal

procurehub_admin_users

procurehub_current_internal_user

## Tenders

procurehub_admin_tenders

## Bids

procurehub_supplier_bids

---

# 11. Dữ liệu hiện tại

Có:
- mock tenders
- admin-created tenders

Rule:
- phải merge
- không được mất mock data khi tạo tender mới

---

# 12. Những gì CHƯA làm

## Backend thật
Chưa có.

## PostgreSQL
Chưa connect.

## File upload thật
Chưa có.

## Email thật
Chưa có.

## Role management thật
Chưa có.

## Approval workflow thật
Chưa có.

## Compare quotation thật
Chưa hoàn thiện.

## Notification realtime
Chưa có.

---

# 13. Hướng phát triển tiếp theo

## Ưu tiên tiếp theo

1. Admin bids management
2. So sánh báo giá
3. Chọn NCC trúng thầu
4. Supplier quotation flow hoàn chỉnh
5. Internal users management
6. Role assignment
7. PostgreSQL backend
8. API layer
9. File upload thật
10. Email notification

---

# 14. Dev principles

Mục tiêu:
- Build nhanh
- Demo usable
- Flow đúng nghiệp vụ
- Dễ maintain
- Dễ migrate backend

Không optimize sớm.

Luôn ưu tiên:
- working flow
- clean UI
- dễ hiểu
- ít abstraction
