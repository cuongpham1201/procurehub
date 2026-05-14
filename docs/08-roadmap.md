# 08 — Roadmap

## Đã hoàn thành

### Infrastructure
- Deploy Ubuntu production runtime
- PostgreSQL database riêng
- Migrate localStorage → PostgreSQL
- PM2 process manager
- Cloudflare Tunnel
- Domain public: dauthau.zlab.io.vn

### Backend
- API routes (suppliers, tenders, bids, users, groups, materials, logs)
- Repository pattern
- DB client (lib/db.ts)

### Admin Portal
- Dashboard với KPI cards
- Quản lý gói thầu (CRUD, search, filter)
- Quản lý nhà cung cấp (duyệt, xem hồ sơ)
- Quản lý báo giá
- So sánh báo giá + chọn trúng thầu
- Quản lý người dùng nội bộ

### Supplier Portal
- Onboarding và đăng ký account
- Hồ sơ năng lực
- Dashboard
- Xem gói thầu công khai
- Nộp báo giá
- Theo dõi trạng thái báo giá

---

## Ưu tiên hiện tại

Thứ tự ưu tiên:

1. Bug fixing
2. CRUD stabilization
3. Validation nhất quán
4. UX refinement
5. Hoàn thiện supplier workflow
6. Bid comparison refinement
7. Dashboard improvements
8. Auth + RBAC
9. File uploads
10. Notifications

---

## Luồng demo ưu tiên

```
Admin tạo gói thầu
→ NCC đăng ký và được duyệt
→ NCC xem gói
→ NCC nộp báo giá
→ Admin xem báo giá
→ Admin so sánh
→ Admin chọn NCC trúng thầu
```

---

## Backlog (chưa làm)

| Feature | Ghi chú |
|---------|---------|
| Microsoft login | SSO nội bộ Bia Hạ Long |
| Supplier email verification | Xác minh email khi đăng ký |
| RBAC thật | Phân quyền theo role |
| File upload thật | Upload tài liệu hồ sơ, báo giá |
| Email notification | Thông báo khi duyệt, khi có kết quả |
| Audit log đầy đủ | Lịch sử thao tác chi tiết |
| Backup PostgreSQL | Tự động backup |
| CI/CD tự động | GitHub Actions → Ubuntu |
| Security hardening | Rate limit, input validation, HTTPS only |
| Validation chuẩn | Zod hoặc tương đương |
| Testing | Unit + integration tests |
| ERP integration | Kết nối hệ thống nội bộ Bia Hạ Long |
| Approval workflow | Multi-step approval |

---

## Không nằm trong scope hiện tại

- Architecture rewrite
- Microservices
- Enterprise platform redesign
- Prisma (trừ khi có yêu cầu rõ ràng)
- Redux/Zustand (trừ khi thật sự cần)
