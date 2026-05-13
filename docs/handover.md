# HANDOVER.md

# ProcureHub — AI Agent Handover Context

Project handover document for Codex / Claude / GPT coding agents.

IMPORTANT:
- Read this file BEFORE editing code.
- Preserve architecture decisions.
- Do not redesign the system.
- Continue implementation incrementally.

---

# 1. PROJECT OVERVIEW

ProcureHub is an MVP procurement / supplier bidding portal for Bia Hạ Long.

Current phase:
- MVP workflow completed
- Now focusing on:
  - bug fixing
  - UX refinement
  - role permissions
  - data consistency
  - preparing for future PostgreSQL migration

Tech stack:
- Next.js
- TypeScript
- localStorage-first architecture
- No backend yet
- No PostgreSQL yet
- No Supabase yet

Current goal:
- Stable MVP demo
- Business flow correctness
- Good UX consistency
- Easy future migration to PostgreSQL

---

# 2. VERY IMPORTANT RULES

## DO NOT

- DO NOT add backend/API
- DO NOT add Prisma
- DO NOT add ORM
- DO NOT add Redux/Zustand unless absolutely necessary
- DO NOT redesign the whole UI
- DO NOT refactor entire architecture
- DO NOT create enterprise abstractions
- DO NOT introduce microservices
- DO NOT replace existing services structure
- DO NOT break localStorage compatibility without reason
- DO NOT overengineer

## DO

- Keep implementation simple
- Reuse existing services/helpers
- Use TypeScript
- Prefer functional components
- Prefer lightweight helpers
- Keep business logic in services when possible
- Maintain current UI style
- Use Vietnamese business wording
- Preserve existing routes
- Preserve existing localStorage keys

---

# 3. CURRENT ARCHITECTURE

The project is intentionally:
- localStorage-first
- service-driven
- simple CRUD style
- MVP-oriented

Data persistence:
- localStorage only

Pages read/write through service layer helpers.

The project previously had scattered mock data.
It has now been consolidated into unified localStorage sources.

---

# 4. MAIN LOCALSTORAGE KEYS

## Tenders
Key:
`procurehub_admin_tenders`

Used as:
- single source of truth for all tenders

Read through:
- getTenders()
- getAdminTenderById()

Used by:
- homepage
- /tenders
- /admin/tenders
- tender detail pages
- comparison pages

---

## Supplier Profiles
Key:
`procurehub_supplier_profiles`

Contains:
- supplier profile
- approval status
- company info
- capability info

Important statuses:
- Chưa hoàn thiện
- Chờ xét duyệt
- Đã duyệt
- Yêu cầu bổ sung
- Từ chối

IMPORTANT:
Only supplier status = "Đã duyệt" can submit bids.

---

## Supplier Bids
Key:
`procurehub_supplier_bids`

Contains:
- bid header
- bid items
- bid statuses

Bid statuses:
- Đã nộp
- Chờ xem xét
- Đang đánh giá
- Cần bổ sung
- Được chọn
- Không được chọn

---

## Internal Users
Key:
`procurehub_internal_users`

Contains:
- admin/internal accounts

Roles:
- Admin
- Trưởng phòng vật tư
- Kế hoạch vật tư
- Chỉ xem

---

## Current Sessions

Internal:
`procurehub_current_internal_user`

Supplier:
`procurehub_current_supplier`

---

# 5. TENDER FLOW

Tender statuses:

```txt
Nháp
→ Đang mở
→ Sắp đóng
→ Đã đóng
→ Đang đánh giá
→ Đã có kết quả
→ Đã hủy
```

Public supplier visibility rules:

- Supplier sees:
  - Đang mở
  - Sắp đóng

- Supplier DOES NOT see closed tenders unless:
  - supplier already submitted a bid

Internal/admin:
- sees all tenders

---

# 6. SUPPLIER FLOW

```txt
Chưa hoàn thiện
→ Chờ xét duyệt
→ Đã duyệt
→ Yêu cầu bổ sung
→ Từ chối
```

Rules:
- only "Đã duyệt" suppliers can:
  - submit bids
  - see bid action button

Suppliers not approved:
- can still browse public tenders
- cannot submit bids

Validation exists BOTH:
- UI layer
- service/business layer

---

# 7. BID MODEL

IMPORTANT:
Bids are now ITEM-BASED.

OLD total-only bid model is deprecated.

Current structure:

```ts
type Bid = {
  id: string;
  bidCode: string;

  tenderId: string;
  tenderCode: string;
  tenderTitle: string;

  supplierId: string;
  supplierName: string;

  status:
    | "Đã nộp"
    | "Chờ xem xét"
    | "Đang đánh giá"
    | "Cần bổ sung"
    | "Được chọn"
    | "Không được chọn";

  submittedAt: string;

  totalAmount: number;

  deliveryTime?: string;
  paymentTerms?: string;
  warrantyPolicy?: string;
  note?: string;

  items: BidItem[];
};
```

Bid item:

```ts
type BidItem = {
  id: string;

  tenderItemId: string;

  itemName: string;
  specification?: string;

  quantity: number;
  unit: string;

  unitPrice: number;
  amount: number;

  brand?: string;
  origin?: string;
  deliveryTime?: string;
  note?: string;
};
```

Rules:
- amount = quantity * unitPrice
- totalAmount = sum(items.amount)

Backward compatibility:
- old bids may not contain items[]
- code must not crash

---

# 8. CURRENT COMPLETED FEATURES

## Admin

Completed:
- admin dashboard
- tender management
- supplier management
- bid management
- bid comparison
- internal user management
- supplier account management
- tender winner selection

---

## Supplier

Completed:
- supplier onboarding
- supplier profile
- supplier dashboard
- public tenders
- bid submission
- submitted bid tracking
- winner/result viewing

---

## Comparison

Completed:
- compare bids by supplier
- compare bids by item
- highlight lowest price
- select winner supplier
- update tender result

---

# 9. CURRENT BUSINESS FLOW

```txt
Admin creates tender
→ Tender published
→ Supplier views tender
→ Approved supplier submits bid
→ Admin reviews bids
→ Admin compares bids
→ Admin selects winner
→ Tender becomes "Đã có kết quả"
→ Supplier sees bid result
```

MVP business flow is considered COMPLETE.

Current phase:
- bug fixing
- UX refinement
- sorting consistency
- permission consistency

---

# 10. CURRENT KNOWN ISSUES / RECENT FIXES

Recently fixed:
- unified tender source
- removed legacy mock tender source
- hidden closed tenders from suppliers
- supplier approval validation before bid submission
- item-based bidding
- comparison page
- winner selection

Recent work:
- sorting improvements
- dashboard activity ordering
- supplier dashboard activities optimization

Potential unstable areas:
- sorting consistency
- localStorage migration edge cases
- old mock bid compatibility
- supplier permission edge cases
- timeline ordering

---

# 11. UI / UX STYLE

Keep existing style.

## Admin UI
- dark navy sidebar
- procurement dashboard style
- compact tables
- status badges

## Supplier UI
- cleaner portal look
- softer cards
- dashboard activity section
- Vietnamese business text

DO NOT redesign globally.

---

# 12. CODING STYLE

Preferred:
- small helper functions
- readable code
- lightweight utilities
- simple sorting/filtering
- avoid giant files

Avoid:
- massive abstractions
- premature optimization
- enterprise architecture

---

# 13. FUTURE ROADMAP (NOT NOW)

Future plans:
- PostgreSQL migration
- backend/API
- authentication server
- file uploads
- audit logs
- approval workflow
- notifications
- email
- Excel export

NOT part of current phase.

Current phase remains:
- stabilize MVP
- fix bugs
- improve UX

---

# 14. HOW TO WORK ON THIS PROJECT

Before coding:

1. Read:
   - HANDOVER.md
   - AI_CONTEXT.md

2. Inspect:
   - current services
   - existing routes
   - existing storage helpers

3. Explain understanding briefly

4. THEN implement

When editing:
- prefer incremental edits
- preserve business logic
- avoid unnecessary rewrites

Always:
- run build
- fix TypeScript errors

---

# 15. IMPORTANT BUSINESS RULES

## Supplier permissions

Supplier:
- only sees own bids
- never sees competitor bids

Internal/admin:
- sees all bids

---

## Closed tenders

Closed tenders:
- hidden from suppliers WITHOUT bids

Suppliers WITH submitted bids:
- can still view tender detail
- can still view their submitted bid

---

## Winner selection

When selecting winner:
- selected bid → "Được chọn"
- other bids → "Không được chọn"
- tender → "Đã có kết quả"

---

## Supplier approval

Only approved suppliers:
- can submit bids
- can see bid action

Validation must exist:
- UI
- service layer

---

# 16. CURRENT PRIORITY

Priority order:

1. Bug fixing
2. UX refinement
3. Permission consistency
4. Sorting consistency
5. Timeline/activity quality
6. Prepare for future DB migration

NOT:
- backend rewrite
- architecture rewrite

---

# 17. FINAL NOTE

This project intentionally prioritizes:
- speed
- clarity
- business flow correctness
- MVP usability

Do not turn this into an enterprise platform yet.

Keep it practical.
Keep it incremental.
Keep it maintainable.