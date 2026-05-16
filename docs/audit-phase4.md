# Audit Report — ProcureHub Phase 4 (File Upload & Communications)

> **Phạm vi:** File upload, email notification, API routes, RBAC, deployment, UX
> **Ngày:** 2026-05-16
> **Trạng thái:** Read-only — không sửa code

---

## 1. Completed — Những gì đã hoàn thành

### ✅ Database (`database/migrations/008_uploads.sql`)

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | TEXT PK | `gen_random_uuid()` — không đoán được |
| `entity_type` | TEXT | `supplier \| bid \| tender \| clarification` |
| `entity_id` | TEXT | FK-less, indexed |
| `uploaded_by` | TEXT | ID của người upload |
| `uploaded_by_kind` | TEXT | `internal \| supplier` |
| `filename` | TEXT | Tên gốc hiển thị cho user |
| `stored_name` | TEXT | UUID-based trên disk — không đoán được |
| `mime_type` | TEXT | Lưu từ Content-Type |
| `size_bytes` | BIGINT | |
| `purpose` | TEXT | `capability_doc \| bid_attachment \| tender_spec \| clarification_attachment` |
| `created_at` | TIMESTAMPTZ | |

**Index:** `idx_uploads_entity (entity_type, entity_id)` + `idx_uploads_uploaded_by`

**Liên kết với entity:** FK-less by design — không bị cascade khi xóa tender/bid/supplier. Metadata còn lại trong DB nhưng file vật lý đã xóa. Đây là trade-off có chủ ý.

---

### ✅ API Routes

| Method | Route | Chức năng |
|--------|-------|-----------|
| POST | `/api/uploads` | Upload file: validate MIME+size → disk → DB → log |
| GET | `/api/uploads?entityType=X&entityId=Y` | List file của một entity |
| GET | `/api/uploads/[id]` | Stream file từ disk về browser |
| DELETE | `/api/uploads/[id]` | Xóa file disk + DB record + log |

---

### ✅ File Storage (`lib/storage/files.ts`)

- **Path pattern:** `{UPLOAD_DIR}/{entityType}/{entityId}/{uuid.ext}`
- **Config:** `process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads")`
- **MIME whitelist:** PDF, DOCX, DOC, XLSX, XLS, JPEG, PNG, ZIP
- **Size limit:** 25 MB (hằng số `MAX_FILE_SIZE`)
- **UUID naming:** `randomUUID()` + giữ extension gốc — không bao giờ trùng

---

### ✅ Repository (`lib/repositories/procurehub.ts`)

Đã implement đầy đủ 5 functions:

- `listUploads(entityType, entityId)` — ORDER BY created_at ASC
- `createUploadRecord(input)` — INSERT với parameterized query
- `getUpload(id)` — SELECT single
- `deleteUploadRecord(id)` — DELETE by id
- `getInternalEmailsByRoles(roles)` — SELECT email WHERE role = ANY($1) AND status = 'active'

---

### ✅ Email Service (Phase 4)

5 email functions đã wire vào API routes:

| Trigger | Function | Route |
|---------|----------|-------|
| Clarification requested | `emailClarificationRequested` | POST /api/bids/[id]/clarifications |
| Clarification responded | `emailClarificationResponded` | PUT /api/bids/[id]/clarifications/[cid] |
| Award proposed | `emailAwardProposed` | POST /api/award-items/propose |
| Award finalized | `emailAwardFinalized` (per bid) | POST /api/award-items/finalize |
| Tender published | `emailTenderPublishedInternal` | PUT /api/tenders/[id] |

Pattern fire-and-forget đúng: `await emailXxx(...)` sau in-app notify, không block response khi SMTP lỗi.

---

### ✅ UI Integration

| Component | Entity | Purpose | Upload | View | Delete |
|-----------|--------|---------|--------|------|--------|
| `SupplierProfilePage` | supplier | capability_doc | ✅ Supplier tự upload | ✅ FileList | ✅ Supplier xóa file của mình |
| `SubmitBidPage` | bid | bid_attachment | ✅ Sau submit thành công | ✅ local state | ✅ |
| `AdminBidDetailPage` | bid | bid_attachment | ❌ Read-only | ✅ FileList | ❌ |
| `AdminSupplierDetailPage` | supplier | capability_doc | ❌ Read-only | ✅ FileList | ❌ |
| `AdminTenderDetailPage` | tender | tender_spec | ❌ Skipped (optional) | ❌ | ❌ |

---

### ✅ Activity Log

`types/activityLog.ts` đã có:

- `"file_uploaded"` → label `"Tải lên tài liệu"`
- `"file_deleted"` → label `"Xóa tài liệu"`

Cả POST và DELETE `/api/uploads` đều gọi `logActivitySafe()` với metadata đầy đủ (uploadId, filename, storedName, sizeBytes, mimeType, purpose).

---

### ✅ Deployment Config

- `UPLOAD_DIR` env var dùng trong `lib/storage/files.ts` — không hardcode path Windows/laptop
- `.env.example` có đủ `UPLOAD_DIR`, `SMTP_*` — không commit secret
- `.gitignore` có `/uploads` (local dev) và `.env*`
- `next.config.ts` có `serverActions.bodySizeLimit: "25mb"`

---

## 2. Security — Bảo mật

### ✅ Những gì đã làm tốt

**Chặn path traversal:**
- Stored name = `randomUUID() + ext` do server sinh — user không control tên file trên disk
- Path xây từ `path.join(UPLOAD_DIR, entityType, entityId, storedName)` — không dùng filename gốc để build path

**MIME validation (2 lớp):**
- Client-side: `FileUploadZone.tsx` validate trước khi gửi
- Server-side: `isMimeAllowed(file.type)` trong POST `/api/uploads`

**Size validation (2 lớp):**
- Client-side: `FileUploadZone.tsx` kiểm tra `file.size <= maxSizeMb * 1024 * 1024`
- Server-side: `isSizeAllowed(file.size)` trong POST `/api/uploads`

**Ownership check khi upload (`canUpload`):**

```
Internal                 → luôn được phép
Supplier + supplier      → chỉ entityId === session.sub
Supplier + bid           → getBid(entityId).supplierId === session.sub
Supplier + tender/clarification → false (không được phép)
```

**Ownership check khi truy cập (`canAccess`):**

```
Internal → luôn được phép
Supplier → được phép nếu: uploader là họ
                        OR entity là supplier record của họ
                        OR bid thuộc họ
```

**Không expose folder upload trực tiếp:** Files được serve qua `/api/uploads/[id]` — có auth check trước khi stream.

**Không lưu file đè nhau:** UUID đảm bảo tên unique tuyệt đối.

**Auth guard trên tất cả endpoints:** Mọi route đều check `getServerSession()` → 401 nếu không có JWT.

---

### ⚠️ Rủi ro cần chú ý

**[Rủi ro THẤP] `canAccess` — cross-entity leak tiềm ẩn**

```typescript
// app/api/uploads/[id]/route.ts — canAccess()
if (upload.uploadedByKind === "supplier" && upload.uploadedBy === session.sub)
  return true;
```

Điều kiện này cho phép supplier xem **bất kỳ file nào họ đã upload**, kể cả file upload sai entity. Trong thực tế flow hiện tại `canUpload` đã chặn từ đầu nên rủi ro thực tế thấp, nhưng logic hơi lỏng lẻo.

**[Rủi ro TRUNG BÌNH] `next.config.ts` bodySizeLimit không cover Route Handler**

```typescript
experimental: { serverActions: { bodySizeLimit: "25mb" } }
```

Setting này chỉ áp dụng cho **Server Actions**, không áp dụng cho **Route Handlers** (API routes). Upload đang dùng Route Handler (`POST /api/uploads`). Body size limit cho Route Handler được control ở tầng deployment (Nginx/reverse proxy).

- **Trên Ubuntu + Cloudflare Tunnel:** Cloudflare free plan có giới hạn upload 100MB (đủ dùng). Nginx nếu có cần thêm `client_max_body_size 26m`.
- **Thực tế:** App vẫn hoạt động vì client validate 25MB trước — nhưng server không reject nếu ai bypass client-side validation.

**[Rủi ro THẤP] Rate limiter in-memory**

`lib/auth/rate-limit.ts` dùng `Map` in-memory — reset khi PM2 restart. Chấp nhận được cho single-server hiện tại.

**[Rủi ro THẤP] MIME type spoofing**

Validation dựa trên `file.type` (Content-Type từ browser) — không check magic bytes của file. Browser có thể fake Content-Type. Trong môi trường nội bộ procurement rủi ro thấp, nhưng production hardening nên dùng thư viện như `file-type` để check magic bytes.

---

## 3. Business Flow — Luồng nghiệp vụ

### ✅ Supplier nộp báo giá kèm tài liệu

1. Supplier submit bid → success state
2. `SubmitBidPage` hiện `FileUploadZone` với `entityType="bid"`, `entityId=savedBidId`
3. Supplier upload → file lưu disk + DB với `purpose="bid_attachment"`
4. Admin xem `AdminBidDetailPage` → `FileList` read-only load từ `/api/uploads?entityType=bid&entityId=X`

**Gap:** Supplier không thể upload trước khi submit (chưa có bidId). Cần submit trước, sau đó mới upload. Hợp lý về kỹ thuật nhưng UX hơi rời rạc.

---

### ✅ Supplier upload hồ sơ năng lực

1. `SupplierProfilePage` → Section "Hồ sơ năng lực" → `FileUploadZone` + `FileList`
2. `entityType="supplier"`, `entityId=session.id`, `purpose="capability_doc"`
3. Admin xem `AdminSupplierDetailPage` → FileList read-only

**Gap nhỏ:** Sidebar checklist dùng `capabilityDocs.length > 0` để tick "Đã upload hồ sơ" — đúng. Nhưng không có validation bắt buộc loại file nào (VD: GPKD, hợp đồng mẫu...).

---

### ❌ Admin/KHVT đính kèm file vào gói thầu (tender_spec)

Chưa có UI. `AdminTenderDetailPage` không tích hợp upload. Backend (DB schema, API) đã hỗ trợ `entityType="tender"` nhưng không có UI entry point. Đây là tính năng "optional" theo plan Phase 4.

---

### ❌ Clarification attachment

`UploadPurpose` có `"clarification_attachment"` trong type definition nhưng không có UI nào cho phép upload kèm theo clarification request hoặc response. Chỉ là text note.

---

### ✅ File tồn tại sau PM2 restart

File lưu trên disk tại `UPLOAD_DIR` (không phải trong `.next/` hay `node_modules`). PM2 restart không ảnh hưởng file. Chỉ mất nếu xóa folder hoặc re-provision server.

---

## 4. Database — Đồng bộ Schema

| Migration | Nội dung | Trạng thái |
|-----------|----------|------------|
| 001–005 | Base tables (suppliers, tenders, bids, users, etc.) | ✅ Applied |
| 006 | `bid_clarifications` | ✅ Applied (Phase 3) |
| 007 | Lifecycle status renames | ✅ Applied (Phase 3) |
| 008 | `uploads` table | ✅ Applied (Phase 4) |

**Vấn đề tiềm ẩn:** Migration 008 không có cột `updated_at`. Nếu sau này cần track file edit/replace, sẽ cần migration thêm. Hiện tại không phải vấn đề vì upload là immutable (xóa + upload lại).

---

## 5. Bugs & Technical Issues

### 🐛 Bug #1 — Unused import trong `/api/uploads/route.ts`

```typescript
import { createUploadRecord, getBid, getSupplier, listUploads } from "@/lib/repositories/procurehub";
//                                        ^^^^^^^^^^^
// getSupplier được import nhưng không bao giờ được gọi trong file này
```

Nhỏ, nhưng là dead import. TypeScript không báo lỗi theo default config.

---

### 🐛 Bug #2 — Duplicate `case "Đang xem xét"` trong `AdminBidDetailPage.tsx`

```typescript
// getActions() function — hai case giống nhau
case "Đang xem xét":
  return [/* ... nút A, B, C */];  // line ~173 — ĐÂY CHẠY

case "Đang xem xét":              // line ~178 — DEAD CODE, không bao giờ reach
  return [/* ... nút D, E */];
```

**Hậu quả:** Một bộ action buttons cho status "Đang xem xét" bị ẩn hoàn toàn — admin không thấy một số thao tác có thể hợp lệ. Đây là **bug thực sự ảnh hưởng UX admin**.

---

### 🐛 Bug #3 (Critical) — `SubmitBidPage.tsx` mix localStorage + REST API

File import và gọi cả:

- `getAccounts()` — localStorage service (`@/services/supplierAccountStorage`)
- `getBidsBySupplier()` — localStorage service
- `saveBid()`, `updateBid()` — localStorage service
- `getAdminTenderById()` — localStorage service (`@/services/tenderStorage`)
- `/api/bids/:id` — REST API (chỉ khi load bid cho edit mode)

**Hậu quả:** Nếu localStorage empty (fresh browser, incognito, hoặc sau khi clear storage), supplier xem trang này sẽ thấy màn hình "Chưa đăng nhập" hoặc không load được tender — dù đã login bằng JWT cookie. Đây là **regression nghiêm trọng** sau Phase 0 migration localStorage → PostgreSQL và là chặn luồng demo cốt lõi: *NCC nộp báo giá*.

---

### ⚠️ Concern #4 — `finalize` fetch ALL bids in memory

```typescript
// app/api/award-items/finalize/route.ts
const allBids = await listBids();                                     // Fetch tất cả bids trong DB
const tenderBids = allBids.filter((b) => b.tenderId === tenderId);   // Filter client-side
```

Nếu hệ thống có hàng nghìn bids, query này sẽ chậm. Repository đã có `getBidsByTender(tenderId)` — nên dùng thay thế.

---

### ⚠️ Concern #5 — `propose` reuse sai `NotificationType`

```typescript
// app/api/award-items/propose/route.ts
type: NotificationType.TENDER_PUBLISHED,  // Dùng sai type cho award proposal
title: "Đề xuất kết quả cần phê duyệt",
```

Notification type không khớp với content. Icon/style của `TENDER_PUBLISHED` notification sẽ hiển thị sai context cho approver. Cần thêm `NotificationType.AWARD_PROPOSED`.

---

### ⚠️ Concern #6 — DELETE tender log sai action

```typescript
// app/api/tenders/[id]/route.ts — DELETE handler
action: "cancelled",   // Ghi log là "cancelled" nhưng thực tế là xóa khỏi DB
description: `Xóa dữ liệu gói thầu ${previous.title}`,
```

Audit log có description nói "Xóa" nhưng action type là "cancelled" — gây nhầm lẫn khi đọc activity log. Nên dùng action `"deleted"` (cần thêm vào `ACTIVITY_ACTIONS`).

---

## 6. UX Review

| Tính năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Hiển thị file đã upload | ✅ | FileList render tên, loại (emoji icon), size, ngày |
| Download file | ✅ | `<a href="/api/uploads/[id]" target="_blank">` |
| Xóa file | ✅ (supplier) / ❌ (admin UI) | Admin không có nút xóa trong UI hiện tại |
| Loading state khi upload | ✅ | FileUploadZone có spinner + "Đang tải lên..." |
| Error state | ✅ | Hiển thị error message, có nút "Thử lại" |
| Success feedback | ✅ | Hiển thị tên file sau upload thành công |
| Drag-and-drop | ✅ | `onDragOver`, `onDrop` handlers |
| File nào bắt buộc | ❌ | Không có chỉ dẫn về file bắt buộc trong hồ sơ năng lực |
| Replace file | ❌ | Chỉ có delete + re-upload; không có "thay file" 1 click |
| Preview file | ❌ | Không có preview; mở tab mới |
| Upload trước khi submit bid | ❌ by design | Chỉ upload sau khi có bidId |

---

## 7. Deployment — Production Ubuntu

| Hạng mục | Trạng thái | Ghi chú |
|----------|------------|---------|
| `UPLOAD_DIR` env var | ✅ | `lib/storage/files.ts` |
| Không hardcode Windows path | ✅ | Không có `C:\`, `D:\` trong storage code |
| `/uploads` trong .gitignore | ✅ | `.gitignore` |
| `.env*` trong .gitignore | ✅ | `.gitignore` |
| Migration 008 phải chạy thủ công | ⚠️ | Không có auto-migration — cần `psql $DATABASE_URL -f 008_uploads.sql` |
| PM2 env reload | ⚠️ | Phải `pm2 delete + pm2 start` khi thay đổi `.env.local` |
| Nginx body size limit | ❓ Chưa xác nhận | `next.config.ts` bodySizeLimit chỉ áp dụng Server Actions, không phải Route Handler |
| File persist sau PM2 restart | ✅ | Files trên disk, không liên quan PM2 |
| Cloudflare upload limit | ✅ | Free plan 100MB >> 25MB app limit |

---

## 8. Kết luận Phase

### Mức độ: **Usable — Chưa Production-Ready**

**Lý do "usable":** Core upload flow hoạt động end-to-end. Security cơ bản đúng. Files lưu được, serve được, xóa được. Email notifications hoạt động.

**Lý do "chưa production-ready":**
- Bug #3 (`SubmitBidPage` dùng localStorage) là regression nghiêm trọng — supplier có thể không submit được bid trên production khi localStorage empty.
- Bug #2 (duplicate case) làm ẩn action buttons của admin.
- Không có server-side body size guard thực sự cho Route Handler upload.

---

## 9. Priority Actions (theo thứ tự ưu tiên)

| # | Hạng mục | Loại | Mức độ |
|---|----------|------|--------|
| 1 | **Fix `SubmitBidPage` — migrate off localStorage sang REST API** | Bug nghiêm trọng | 🔴 Critical |
| 2 | **Fix duplicate `case "Đang xem xét"` trong `AdminBidDetailPage`** | Bug | 🟠 High |
| 3 | **Thêm Nginx `client_max_body_size 26m`** (hoặc verify Cloudflare cover) | Security/Deploy | 🟠 High |
| 4 | **Xóa unused import `getSupplier`** trong `/api/uploads/route.ts` | Cleanup | 🟡 Medium |
| 5 | **Thay `listBids()` bằng `getBidsByTender(tenderId)`** trong finalize route | Performance | 🟡 Medium |
| 6 | **Thêm `NotificationType.AWARD_PROPOSED`** thay vì reuse TENDER_PUBLISHED | Correctness | 🟡 Medium |
| 7 | **Thêm upload UI cho AdminTenderDetailPage** (tender_spec) | Feature | 🟢 Low |
| 8 | **Thêm server-side magic bytes check** (dùng `file-type` package) | Security hardening | 🟢 Low |
| 9 | **Thêm hướng dẫn file bắt buộc** trong SupplierProfilePage | UX | 🟢 Low |
| 10 | **Fix audit log action "cancelled" → "deleted"** cho tender DELETE | Correctness | 🟢 Low |

---

> **Ưu tiên ngay:** Bug #3 (`SubmitBidPage` localStorage) là chặn luồng demo cốt lõi: _NCC nộp báo giá_. Cần fix trước mọi thứ khác.
