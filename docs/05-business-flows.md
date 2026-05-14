# 05 — Luồng nghiệp vụ

## Tender flow (Gói thầu)

```
Nháp
  → Đang mở
  → Đã đóng
  → Đang đánh giá
  → Đã có kết quả
  → Đã hủy  (ngoài luồng chính)
```

Quy tắc:
- NCC chỉ thấy gói thầu `Đang mở`
- Admin/nội bộ thấy tất cả trạng thái

---

## Supplier flow (Nhà cung cấp)

```
Chưa hoàn thiện
  → Chờ xét duyệt
  → Đã duyệt
  → Yêu cầu bổ sung
  → Từ chối
```

Các bước onboarding:
1. `/supplier/register-account` — Đăng ký tài khoản
2. `/supplier/profile` — Hoàn thiện hồ sơ năng lực
3. Admin xét duyệt
4. NCC được duyệt → truy cập `/supplier/dashboard`
5. NCC nộp báo giá

Quy tắc:
- Chỉ NCC `Đã duyệt` mới được nộp báo giá
- Validation phải có ở cả UI layer và API layer

---

## Full procurement flow

```
Admin tạo gói thầu
  → Gói thầu mở (Đang mở)
  → NCC đăng ký và được duyệt
  → NCC xem gói thầu
  → NCC nộp báo giá
  → Admin đóng thầu (Đã đóng)
  → Admin đánh giá (Đang đánh giá)
  → Admin so sánh báo giá
  → Admin chọn NCC trúng thầu
  → Gói thầu → Đã có kết quả
  → NCC xem kết quả báo giá
```

---

## Bid model (Báo giá)

Báo giá theo hạng mục (item-based).

```ts
type Bid = {
  id: string;
  tenderId: string;
  supplierId: string;
  status:
    | "Đã nộp"
    | "Chờ xem xét"
    | "Đang đánh giá"
    | "Cần bổ sung"
    | "Được chọn"
    | "Không được chọn";
  totalAmount: number;
  items: BidItem[];
};
```

Tính tiền:
- `BidItem.amount = quantity × unitPrice`
- `Bid.totalAmount = sum(items.amount)`

---

## Admin Portal — chức năng hiện có

| Module | Chức năng |
|--------|-----------|
| Dashboard | KPI cards, hoạt động gần đây, shortcut actions |
| Gói thầu | Danh sách, search, filter, tạo mới |
| Nhà cung cấp | Danh sách, duyệt NCC, xem hồ sơ |
| Báo giá | Danh sách, xem trạng thái |
| So sánh báo giá | So sánh NCC, chọn trúng thầu |
| Người dùng nội bộ | Roles, tạo/sửa/khóa |
