# HANDOVER.md

# ProcureHub — AI Agent Handover Context

Project handover document for Codex / Claude / GPT coding agents.

IMPORTANT:
- Read this file BEFORE editing code.
- Preserve architecture decisions.
- Do not redesign the system.
- Continue implementation incrementally.
- Current architecture is PostgreSQL-backed production runtime.
- DO NOT revert back to localStorage-first architecture.

---

# 1. PROJECT OVERVIEW

ProcureHub is an MVP procurement / supplier bidding portal for Bia Hạ Long.

Current phase:
- PostgreSQL migration completed
- Production runtime completed
- Core CRUD completed
- Public domain deployed
- Currently focusing on:
  - business flow stabilization
  - UX refinement
  - permissions
  - validation
  - supplier workflow completion
  - production hardening

Current production domain:
- https://dauthau.zlab.io.vn

Tech stack:
- Next.js
- TypeScript
- PostgreSQL
- Next.js API Routes
- Repository pattern
- PM2 runtime
- Cloudflare Tunnel
- Ubuntu homelab

Current goal:
- Stable production-like MVP
- Business flow correctness
- Real PostgreSQL persistence
- Good UX consistency
- Expandable architecture without overengineering

---

# 2. VERY IMPORTANT RULES

## DO NOT

- DO NOT redesign architecture
- DO NOT replace repository pattern
- DO NOT replace API routes
- DO NOT introduce microservices
- DO NOT introduce enterprise abstractions
- DO NOT add Prisma unless explicitly requested
- DO NOT add Redux/Zustand unless truly necessary
- DO NOT redesign the whole UI
- DO NOT break PostgreSQL persistence
- DO NOT move business data back to localStorage
- DO NOT expose DATABASE_URL to client
- DO NOT use NEXT_PUBLIC_DATABASE_URL
- DO NOT overengineer

## DO

- Keep implementation simple
- Reuse existing repositories/helpers/services
- Use TypeScript
- Prefer functional components
- Prefer lightweight helpers
- Keep business logic in repositories/services
- Maintain current UI style
- Use Vietnamese business wording
- Preserve existing routes when possible
- Preserve business flow correctness
- Run build after changes

---

# 3. CURRENT ARCHITECTURE

Current architecture:

```txt
Browser
  ↓
Next.js UI
  ↓
Next.js API Routes
  ↓
Repository layer
  ↓
PostgreSQL
```

Production routing:

```txt
https://dauthau.zlab.io.vn
  ↓
Cloudflare Tunnel
  ↓
Ubuntu homelab
  ↓
Next.js app on localhost:3001
  ↓
PostgreSQL on localhost:5432
```

Business persistence:
- PostgreSQL

localStorage:
- only temporary session/mock state
- NOT business master data

---

# 4. INFRASTRUCTURE

## Ubuntu Server

Ubuntu 24.04 LTS homelab

IPs:
- LAN: 192.168.2.11
- Tailscale: 100.91.188.83

---

## Docker Services

Current containers:
- postgres
- adminer
- portainer
- n8n
- open-webui
- nginx-proxy-manager

---

## PM2

Production process:
- procurehub

Commands:

```bash
pm2 list
pm2 restart procurehub --update-env
pm2 logs procurehub
```

---

## Cloudflare Tunnel

Tunnel name:
- homelab

Config:
- /etc/cloudflared/config.yml

Current hostnames:

```txt
n8n.zlab.io.vn      -> localhost:5678
ai.zlab.io.vn       -> localhost:3000
dauthau.zlab.io.vn  -> localhost:3001
```

Commands:

```bash
systemctl status cloudflared
sudo systemctl restart cloudflared
```

---

# 5. DATABASE

## PostgreSQL

Database:
- procurehub

User:
- procurehub

Password:
- procurehub_demo_password

Example connection:

```env
DATABASE_URL=postgresql://procurehub:procurehub_demo_password@100.91.188.83:5432/procurehub
```

Ubuntu localhost version:

```env
DATABASE_URL=postgresql://procurehub:procurehub_demo_password@localhost:5432/procurehub
```

---

## Main Tables

Core tables:
- suppliers
- tenders
- tender_items
- bids
- bid_items
- internal_users
- procurement_groups
- material_items
- activity_logs

---

# 6. CURRENT DATA PERSISTENCE

Business data persistence:
- PostgreSQL only

DO NOT store these in localStorage:
- suppliers
- tenders
- bids
- comparison data
- procurement groups
- internal users

localStorage may still be used for:
- current session
- temporary UI state
- mock auth session

---

# 7. CURRENT REPOSITORY / API STRUCTURE

DB client:
- lib/db.ts

Repositories:
- lib/repositories/

API routes:
- app/api/suppliers
- app/api/tenders
- app/api/bids
- app/api/internal-users
- app/api/procurement-groups
- app/api/material-items
- app/api/activity-logs

Rules:
- Client components must NOT access PostgreSQL directly
- All DB access goes through:
  - API routes
  - repositories
  - server-side code

---

# 8. CURRENT ROUTES

## Public

- /
- /tenders
- /tenders/[id]
- /login
- /supplier/register-account

---

## Supplier Portal

- /supplier/dashboard
- /supplier/profile
- /supplier/tenders
- /supplier/bids

---

## Admin Portal

- /admin
- /admin/tenders
- /admin/tenders/create
- /admin/tenders/[id]
- /admin/suppliers
- /admin/suppliers/[id]
- /admin/bids
- /admin/bid-comparison
- /admin/users

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

Current system already supports:
- real PostgreSQL persistence
- production runtime
- multi-user shared data

---

# 10. TENDER FLOW

Tender statuses:

```txt
Nháp
→ Đang mở
→ Đã đóng
→ Đang đánh giá
→ Đã có kết quả
→ Đã hủy
```

Rules:
- Suppliers only see public/open tenders
- Internal/admin sees all tenders

---

# 11. SUPPLIER FLOW

Supplier statuses:

```txt
Chưa hoàn thiện
→ Chờ xét duyệt
→ Đã duyệt
→ Yêu cầu bổ sung
→ Từ chối
```

Rules:
- Only approved suppliers can submit bids
- Validation must exist:
  - UI layer
  - API/business layer

---

# 12. BID MODEL

Bids are ITEM-BASED.

Structure:

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

Rules:
- amount = quantity * unitPrice
- totalAmount = sum(items.amount)

---

# 13. CURRENT COMPLETED FEATURES

## Admin

Completed:
- admin dashboard
- tender management
- supplier management
- bid management
- bid comparison
- internal user management
- winner selection

---

## Supplier

Completed:
- supplier onboarding
- supplier profile
- supplier dashboard
- public tenders
- bid submission
- bid tracking

---

## Infrastructure

Completed:
- PostgreSQL migration
- API routes
- repository pattern
- Ubuntu production runtime
- PM2 runtime
- Cloudflare Tunnel
- public production domain

---

# 14. CURRENT KNOWN ISSUES / ACTIVE AREAS

Potential unstable areas:
- sorting consistency
- validation consistency
- permission edge cases
- older localStorage compatibility remnants
- dashboard ordering
- bid comparison logic refinement

---

# 15. UI / UX STYLE

Keep current style.

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

# 16. DEPLOYMENT WORKFLOW

## Local Development

Laptop:

```bash
npm run dev
```

---

## Push Code

```bash
git add .
git commit -m "message"
git push
```

---

## Production Deploy

Ubuntu:

```bash
cd /data/homelab/apps/procurehub

git pull

npm install

npm run build

pm2 restart procurehub --update-env
```

---

# 17. DEBUGGING QUICK CHECKS

## App not responding

```bash
pm2 list
pm2 logs procurehub
curl http://localhost:3001
```

---

## Domain not responding

```bash
systemctl status cloudflared
sudo systemctl restart cloudflared
curl -I https://dauthau.zlab.io.vn
```

---

## DATABASE_URL missing

Fix:

```bash
pm2 restart procurehub --update-env
```

Check `.env.local` on Ubuntu.

---

## localhost has data but domain does not

Check:

```bash
curl http://localhost:3001/api/suppliers
curl https://dauthau.zlab.io.vn/api/suppliers
```

Possible causes:
- stale production code
- wrong tunnel route
- missing env
- PM2 not restarted

---

# 18. CURRENT PRIORITY

Priority order:

1. Bug fixing
2. CRUD stabilization
3. Validation consistency
4. UX refinement
5. Supplier workflow completion
6. Bid comparison refinement
7. Dashboard improvements
8. Auth + RBAC
9. File uploads
10. Notifications

NOT:
- architecture rewrite
- microservices
- enterprise redesign

---

# 19. FUTURE ROADMAP

Future plans:
- Microsoft login
- Supplier email verification
- RBAC
- File uploads
- Email notifications
- Audit logs
- Approval workflow
- Backup automation
- CI/CD
- ERP integration
- Security hardening

NOT part of current stabilization phase.

---

# 20. HOW TO WORK ON THIS PROJECT

Before coding:

1. Read:
   - HANDOVER.md
   - AI_CONTEXT.md

2. Inspect:
   - repositories
   - API routes
   - existing services
   - existing business flow

3. Explain understanding briefly

4. THEN implement

When editing:
- prefer incremental edits
- preserve business logic
- avoid unnecessary rewrites

Always:
- run build
- fix TypeScript errors
- preserve production compatibility

---

# 21. FINAL NOTE

This project intentionally prioritizes:
- speed
- clarity
- business flow correctness
- production-like MVP usability

Do not turn this into a giant enterprise platform yet.

Keep it:
- practical
- incremental
- maintainable
- demo-friendly
- business-focused