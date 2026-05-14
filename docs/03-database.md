# 03 — Database

## PostgreSQL

| Thông tin | Giá trị |
|-----------|---------|
| Database | `procurehub` |
| User | `procurehub` |
| Password | `procurehub_demo_password` |
| Port | `5432` |

Connection string (Tailscale / remote):
```env
DATABASE_URL=postgresql://procurehub:procurehub_demo_password@100.91.188.83:5432/procurehub
```

Connection string (trên Ubuntu localhost):
```env
DATABASE_URL=postgresql://procurehub:procurehub_demo_password@localhost:5432/procurehub
```

---

## Các bảng chính

| Bảng | Mô tả |
|------|-------|
| `suppliers` | Nhà cung cấp |
| `tenders` | Gói thầu |
| `tender_items` | Hạng mục gói thầu |
| `bids` | Báo giá |
| `bid_items` | Hạng mục báo giá |
| `internal_users` | Người dùng nội bộ |
| `procurement_groups` | Nhóm mua sắm |
| `material_items` | Danh mục vật tư |
| `activity_logs` | Nhật ký hoạt động |

---

## Migration

Nếu sửa schema:
1. Tạo file migration trong `database/migrations/`
2. Chạy migrate
3. Test API sau khi migrate

```bash
npm run db:migrate
```

Seed demo data:
```bash
npm run db:seed-demo
```

---

## Lệnh kiểm tra nhanh

```bash
psql -h localhost -U procurehub -d procurehub
```

Kiểm tra API đọc được DB:
```bash
curl http://localhost:3001/api/suppliers
curl https://dauthau.zlab.io.vn/api/suppliers
```
