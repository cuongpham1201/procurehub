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

### Phase 0 — PostgreSQL-only data layer ✅
- Tất cả services đã route qua API → PostgreSQL
- Xóa bỏ mọi localStorage cho business data
- JWT cookie `ph_auth` là session source of truth
- `useCurrentUser()` hook thay thế mọi localStorage session read
- `actorFromSession()` cho activity log attribution
- `TenderDetailLoader`, `TenderListPage` dùng `useCurrentUser()` thay `getInternalSession()`
- `getBidById()` → direct GET /api/bids/[id]

### Phase 1 — API Security Hardening ✅
- Auth guards trên tất cả API endpoints (401 nếu không có JWT)
- Internal-only routes: tenders write, internal-users, award-items, activity-logs
- Supplier isolation: GET /api/bids chỉ trả bids của chính supplier
- Tender visibility: supplier/guest chỉ thấy non-draft tenders
- GET /api/suppliers: internal thấy tất cả, supplier thấy profile của mình
- GET /api/bids hỗ trợ `?tenderId=X&supplierId=X` query params
- Dead code removed: localStorage session functions trong authStorage/supplierAccountStorage

### Phase 3 — Auth Hardening + Security Cleanup ✅
- **Rate limiting** trên `POST /api/auth/login`: 10 lần / 15 phút / IP, trả 429 + Retry-After header
- **`lib/auth/rate-limit.ts`**: in-memory sliding window rate limiter (PM2 single-server), tự dọn entry hết hạn
- **`GET /api/suppliers/[id]`**: thêm auth guard — supplier chỉ xem được record của chính mình
- **`PUT /api/suppliers/[id]`**: thêm RBAC đầy đủ:
  - Supplier: chỉ update profile của chính mình, không được tự đổi status
  - Internal `Kế hoạch vật tư`: chỉ `suppliers:write` (không duyệt được)
  - Internal `Trưởng phòng vật tư` / `Ban giám đốc` / `Admin`: `suppliers:approve` (duyệt, từ chối, khóa)
- **`DELETE /api/bids/[id]`**: fix bug — `deleteBidRecord()` chưa được gọi (log ghi nhưng DB không xóa)
- **Dead code removed**: `findByCredentials` trong `supplierAccountStorage.ts` (so sánh plaintext password)
- **Activity log actor**: dùng `actorFromSession(session)` thay vì hardcode supplier fallback trong `PUT /api/suppliers/[id]`

### Phase 2 — Server-side Validation + Service Efficiency ✅
- **POST /api/suppliers**: required field validation, duplicate check (email/taxCode/phone), password hash lưu DB
- **GET /api/suppliers/check**: public endpoint kiểm tra trùng lặp — chỉ trả boolean, không lộ data
- **POST /api/bids**: supplierId phải khớp JWT session (chống forge), tender phải đang mở, ownership check khi sửa
- **POST /api/tenders**: required field validation (title, category, deadline + date parse)
- **`upsertSupplier`**: lưu `password_hash` vào DB (migration 003 đã có column)
- **`listSuppliers`**: đọc `password_hash` từ DB row
- **`getBidsBySupplier/getBidsByTender`**: dùng `?supplierId=X / ?tenderId=X` thay vì fetch-all + filter client-side
- **`generateBidCode`**: chuyển lên `GET /api/bids/next-code` (DB query, không fetch-all)
- **`nextBidCode()`**: DB-level generation từ repository

### Phase 3 — Real Procurement Workflow ✅

#### Clarification workflow hai chiều
- **`bid_clarifications` table** (migration 006): lưu request + response, FK → bids ON DELETE CASCADE
- **`GET/POST /api/bids/[id]/clarifications`**: admin tạo yêu cầu kèm note bắt buộc → bid → "Cần làm rõ" → notify supplier
- **`PUT /api/bids/[id]/clarifications/[cid]`**: supplier respond → bid → "Đã phản hồi" → notify internal
- **Admin UI**: modal nhập lý do bắt buộc, timeline hiển thị request/response pairs
- **Supplier UI**: banner "cần làm rõ", form phản hồi inline trong danh sách báo giá

#### Lifecycle status rename (migration 007)
- **Tender**: xóa "Đang mở", "Sắp đóng"; thêm "Chờ phê duyệt"
- **Bid**: "Chờ xem xét"→"Đang xem xét", "Cần bổ sung"→"Cần làm rõ", "Đã bổ sung"→"Đã phản hồi"; thêm "Đề xuất chọn"

#### Approval separation (propose → finalize)
- **`POST /api/award-items/propose`**: KHVT đề xuất → bid → "Đề xuất chọn", tender → "Chờ phê duyệt"; notify Trưởng phòng + Ban giám đốc
- **`POST /api/award-items/finalize`**: RBAC guard `bids:evaluate` (Trưởng phòng/Admin/Ban giám đốc chỉ); chốt từ "Đang đánh giá" hoặc "Chờ phê duyệt"
- **AdminTenderComparisonPage**: hiện nút "Đề xuất kết quả" (KHVT) hoặc "Chốt kết quả" (TP/Admin) tuỳ permission; banner trạng thái "Chờ phê duyệt"

#### Supplier eligibility check
- `POST /api/bids`: check `supplier.status === "Đã duyệt"` trước khi cho phép nộp → 403 nếu chưa duyệt

#### Contextual comparison only
- Standalone `/admin/bid-comparison` redirect về `/admin/tenders`
- Sidebar link "So sánh báo giá" đã xóa

### Phase 4 — Document Flow + Communications ✅

#### File upload system
- **Migration 008** (`uploads` table): PostgreSQL metadata, FK-less, indexed by `(entity_type, entity_id)`
- **`types/upload.ts`**: `Upload`, `UploadEntityType`, `UploadPurpose`, `UploadInput`
- **`lib/storage/files.ts`**: local disk storage (`UPLOAD_DIR` env), UUID-based stored filenames, MIME validation, size limit 25 MB
- **`POST /api/uploads`**: multipart/form-data; supplier guard (own bid/profile only); `logActivitySafe(action="file_uploaded")`
- **`GET /api/uploads?entityType=X&entityId=Y`**: list with auth guard (role/ownership)
- **`GET /api/uploads/[id]`**: stream file with correct `Content-Type`, `Content-Disposition: inline`
- **`DELETE /api/uploads/[id]`**: uploader or internal; `logActivitySafe(action="file_deleted")`
- **`components/ui/FileUploadZone.tsx`**: drag-drop + click-to-browse; client MIME/size validation; upload states (idle/dragging/uploading/error/success)
- **`components/ui/FileList.tsx`**: download link, delete button, MIME icon, file size, date

#### Email notifications (fire-and-forget, bổ sung in-app)
- **nodemailer SMTP**; `emailEnabled = !!SMTP_HOST` guard — graceful no-op nếu chưa cấu hình
- **`lib/email/config.ts`**: `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` env vars
- **`lib/email/templates.ts`**: 5 branded HTML templates (VI language)
- **`lib/email/service.ts`**: `sendEmailSafe()` + typed helpers: `emailClarificationRequested`, `emailClarificationResponded`, `emailAwardProposed`, `emailAwardFinalized`, `emailTenderPublishedInternal`
- **Wiring**: clarification request → supplier email; clarification response → internal emails; award proposed → approver emails; award finalized (per bid, selected/not) → supplier email; tender published → internal emails

#### Stabilization fixes
- **H1**: `createNotificationDedupedSafe` trong finalize (không double-notify BID_AWARDED/BID_REJECTED)
- **H2**: xóa notify block khỏi bid PUT route (finalize là nguồn authoritative duy nhất)
- **H3**: clarification link → `/supplier/bids` (list page render clarification inline)
- **listTenders auto-close**: prepend UPDATE deadline-expired → "Đã đóng" trước mỗi SELECT (không cần cron)
- **`next.config.ts`**: `serverActions.bodySizeLimit: "25mb"`

#### Activity log additions
- `"file_uploaded"` + `"file_deleted"` actions thêm vào `ACTIVITY_ACTIONS` + `ACTIVITY_ACTION_LABELS`

#### UI integration
- **SupplierProfilePage**: section "3. Hồ sơ năng lực" thay mock bằng `FileUploadZone` + `FileList`; sidebar checklist dùng `capabilityDocs.length > 0`
- **SubmitBidPage**: sau submit thành công, `SuccessState` hiện `FileUploadZone` cho bid attachments (optional)
- **AdminBidDetailPage**: section "Tài liệu đính kèm" (read-only `FileList`) load song song với clarifications
- **AdminSupplierDetailPage**: section "Tài liệu năng lực" (read-only `FileList`) bên cạnh hồ sơ doanh nghiệp

---

## Ưu tiên tiếp theo (Phase 5+)

Thứ tự ưu tiên:

1. Dashboard improvements (KPI thực, charts từ PostgreSQL)
2. Zod validation server-side
3. Microsoft SSO cho internal users
4. ERP integration

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
| File upload thật | ✅ Phase 4 — local disk + PostgreSQL metadata |
| Email notification | ✅ Phase 4 — nodemailer SMTP, fire-and-forget |
| Audit log đầy đủ | ✅ Phase 4 — file_uploaded/file_deleted; clarification/award actions đã có |
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
