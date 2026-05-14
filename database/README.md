# ProcureHub PostgreSQL

## Environment

Set `DATABASE_URL` before running migrations, imports, or the Next.js server.

```bash
export DATABASE_URL="postgresql://procurehub:procurehub_demo_password@100.91.188.83:5432/procurehub"
```

For local Next.js development, create `.env.local` from `.env.example`.

## Run Migration

```bash
npm run db:migrate
```

This creates the ProcureHub tables:

- `suppliers`
- `tenders`
- `tender_items`
- `bids`
- `bid_items`
- `procurement_groups`
- `material_items`
- `internal_users`
- `audit_events`
- `activity_logs`

IDs are stored as `text` so existing local IDs can be imported without remapping. Complex source payloads are preserved in each table's `raw_data jsonb` column.

## Export Existing LocalStorage Data

Open the localhost or Vercel page that still has the browser data, then open DevTools Console and run:

```js
const dump = {};
Object.keys(localStorage).forEach((key) => {
  dump[key] = localStorage.getItem(key);
});
console.log(JSON.stringify(dump, null, 2));
```

Copy the output into:

```text
data/localstorage-export.json
```

## Import LocalStorage Export

```bash
npm run db:import-local
```

The import is idempotent. It uses `insert ... on conflict` and can be run multiple times without duplicating rows. The importer currently maps these localStorage keys:

- `procurehub_supplier_accounts`
- `procurehub_supplier_profiles`
- `procurehub_suppliers`
- `procurehub_admin_tenders`
- `procurehub_supplier_bids`
- `procurehub_admin_users`
- `procurehub_internal_users`
- `procurehub_purchase_categories`
- `procurehub_material_items`
- `procurehub_admin_activity_logs`

## App Data Flow

Client services call Next.js API routes. API routes use the server-only PostgreSQL pool in `lib/db.ts`. Do not expose `DATABASE_URL` through `NEXT_PUBLIC_*` variables and do not query PostgreSQL directly from client components.
