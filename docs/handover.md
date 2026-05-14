# HANDOVER.md — ProcureHub AI Agent Handover

> Đọc trước khi edit bất kỳ file nào.
> Preserve architecture decisions. Continue incrementally. Do NOT redesign.

---

## Project summary

ProcureHub — MVP procurement / supplier bidding portal cho Bia Hạ Long.

Phase hiện tại: **Stabilization & UX refinement**
- PostgreSQL migration: DONE
- Production runtime: DONE
- Core CRUD: DONE
- Domain public: DONE
- Đang làm: validation, UX, supplier workflow, bid comparison

Production URL: **https://dauthau.zlab.io.vn**

---

## DO NOT

| Cấm | Lý do |
|-----|-------|
| Redesign kiến trúc | Production đang chạy, đã ổn định |
| Thay repository pattern | Core pattern của project |
| Thay API routes | Business routes đã stable |
| Thêm microservices | Out of scope |
| Thêm Prisma | Không cần, trừ khi yêu cầu rõ |
| Thêm Redux/Zustand | Không cần hiện tại |
| Redesign global UI | Phá UX hiện có |
| Đưa business data về localStorage | Đã migrate xong sang PostgreSQL |
| Expose DATABASE_URL ra client | Security risk |
| Dùng NEXT_PUBLIC_DATABASE_URL | Security risk |
| Overengineer | Không phù hợp phase MVP |

---

## DO

- Giữ implementation đơn giản
- Tái sử dụng repository/helper/service có sẵn
- Dùng TypeScript
- Ưu tiên functional components
- Business logic để ở repository/service layer
- Giữ UI style (navy + gold, Vietnamese text)
- Bảo toàn routes hiện có
- Bảo toàn business flow
- Chạy `npm run build` sau khi sửa

---

## Kiến trúc (KHÔNG thay đổi)

```
Browser
  → Next.js UI  (app/)
  → Next.js API Routes  (app/api/)
  → Repository  (lib/repositories/)
  → PostgreSQL
```

Data persistence: **PostgreSQL only**
localStorage: chỉ session tạm thời, không phải business data

---

## Quy trình làm việc

```
1. Đọc AI_CONTEXT.md + HANDOVER.md
2. Inspect file liên quan (repositories, API, services)
3. Giải thích hiểu biết ngắn gọn
4. Implement incremental
5. npm run build
6. Fix TypeScript errors
```

---

## Business rules cốt lõi

- Chỉ NCC `Đã duyệt` mới được nộp báo giá
- Validation phải có ở cả UI layer và API layer
- Tender statuses: Nháp → Đang mở → Đã đóng → Đang đánh giá → Đã có kết quả
- Bid amount = quantity × unitPrice; totalAmount = sum(items)

---

## Docs chi tiết

Xem [README.md](README.md) để navigate toàn bộ docs.
