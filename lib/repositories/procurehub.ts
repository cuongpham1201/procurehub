import { randomUUID } from "crypto";
import { query, withTransaction } from "@/lib/db";
import type { AdminTender } from "@/types/adminTender";
import type {
  ActivityLog,
  ActivityLogFilters,
  ActivityLogListResponse,
  ActivityPayload,
} from "@/types/activityLog";
import type { MaterialItem, PurchaseCategory } from "@/types/category";
import type { InternalUser } from "@/types/internalUser";
import type { SupplierAccount } from "@/types/supplierAccount";
import type { SupplierBid } from "@/types/supplierBid";
import type { AwardItem, UpsertAwardItemInput } from "@/types/awardItem";
import type { BidClarification } from "@/types/bidClarification";
import type { Upload, UploadInput } from "@/types/upload";

type JsonRecord = Record<string, unknown>;

type TenderRow = {
  id: string;
  code: string | null;
  title: string;
  category: string | null;
  status: string | null;
  deadline: string | Date | null;
  estimated_value: string | number | null;
  description: string | null;
  delivery_location: string | null;
  delivery_time: string | null;
  payment_terms: string | null;
  document_requirements: unknown;
  created_at: string | Date | null;
  updated_at: string | Date | null;
  raw_data: JsonRecord;
  items?: TenderItemRow[];
};

type TenderItemRow = {
  id: string;
  tender_id: string;
  material_id: string | null;
  material_code: string | null;
  item_name: string;
  specification: string | null;
  quantity: string | number | null;
  unit: string | null;
  note: string | null;
  raw_data: JsonRecord;
};

type BidRow = {
  id: string;
  bid_code: string | null;
  tender_id: string | null;
  tender_code: string | null;
  tender_title: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  supplier_email: string | null;
  supplier_phone: string | null;
  status: string | null;
  submitted_at: string | Date | null;
  total_amount: string | number | null;
  delivery_time: string | null;
  payment_terms: string | null;
  warranty_policy: string | null;
  note: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
  raw_data: JsonRecord;
  items?: BidItemRow[];
  // Phase 2 columns (nullable for backward compat)
  revision_no: number | null;
  parent_bid_id: string | null;
};

type BidItemRow = {
  id: string;
  bid_id: string;
  tender_item_id: string | null;
  item_name: string;
  specification: string | null;
  quantity: string | number | null;
  unit: string | null;
  unit_price: string | number | null;
  amount: string | number | null;
  brand: string | null;
  origin: string | null;
  delivery_time: string | null;
  note: string | null;
  raw_data: JsonRecord;
  // Phase 2 columns (nullable for backward compat with rows inserted before migration 005)
  item_code: string | null;
  specification_snapshot: string | null;
  quantity_snapshot: string | number | null;
  unit_snapshot: string | null;
  item_status: string | null;
};

type AwardItemRow = {
  id: string;
  tender_id: string;
  tender_item_id: string;
  bid_id: string;
  bid_item_id: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  unit_price: string | number;
  quantity: string | number;
  amount: string | number;
  note: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function asIso(value: string | Date | null | undefined): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function asDateInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function asNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asObject(value: unknown): ActivityPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as ActivityPayload;
}

function tenderItemFromRow(row: TenderItemRow) {
  return {
    ...row.raw_data,
    id: row.id,
    materialId: row.material_id ?? undefined,
    materialCode: row.material_code ?? undefined,
    itemName: row.item_name,
    specification: row.specification ?? "",
    quantity: asNumber(row.quantity),
    unit: row.unit ?? "",
    note: row.note ?? "",
  };
}

function tenderFromRow(row: TenderRow): AdminTender {
  return {
    ...(row.raw_data as Partial<AdminTender>),
    id: row.id,
    code: row.code ?? "",
    title: row.title,
    category: row.category ?? "",
    status: (row.status ?? "Đang nhận báo giá") as AdminTender["status"],
    deadline: asDateInput(row.deadline),
    estimatedValue: asNumber(row.estimated_value),
    description: row.description ?? "",
    deliveryLocation: row.delivery_location ?? "",
    deliveryTime: row.delivery_time ?? "",
    paymentTerms: row.payment_terms ?? "",
    documentRequirements: asArray<string>(row.document_requirements),
    items: (row.items ?? []).map(tenderItemFromRow),
    createdAt: asIso(row.created_at),
    updatedAt: row.updated_at ? asIso(row.updated_at) : (row.raw_data.updatedAt as string | undefined),
  };
}

function bidItemFromRow(row: BidItemRow) {
  return {
    ...row.raw_data,
    id: row.id,
    tenderItemId: row.tender_item_id ?? "",
    itemName: row.item_name,
    specification: row.specification ?? undefined,
    quantity: asNumber(row.quantity),
    unit: row.unit ?? "",
    unitPrice: asNumber(row.unit_price),
    amount: asNumber(row.amount),
    brand: row.brand ?? undefined,
    origin: row.origin ?? undefined,
    deliveryTime: row.delivery_time ?? undefined,
    note: row.note ?? undefined,
    // Phase 2 snapshot + status fields
    itemCode: row.item_code ?? undefined,
    specificationSnapshot: row.specification_snapshot ?? undefined,
    quantitySnapshot: row.quantity_snapshot != null ? asNumber(row.quantity_snapshot) : undefined,
    unitSnapshot: row.unit_snapshot ?? undefined,
    itemStatus: (row.item_status as "pending" | "awarded" | "rejected" | null) ?? "pending",
  };
}

function bidFromRow(row: BidRow): SupplierBid {
  const total = asNumber(row.total_amount);
  return {
    ...(row.raw_data as Partial<SupplierBid>),
    id: row.id,
    bidCode: row.bid_code ?? row.id,
    tenderId: row.tender_id ?? "",
    tenderCode: row.tender_code ?? "",
    tenderTitle: row.tender_title ?? "",
    tenderName: row.tender_title ?? undefined,
    supplierId: row.supplier_id ?? "",
    supplierName: row.supplier_name ?? "",
    supplierEmail: row.supplier_email ?? undefined,
    supplierPhone: row.supplier_phone ?? undefined,
    status: (row.status ?? "Đã nộp") as SupplierBid["status"],
    submittedAt: asIso(row.submitted_at),
    createdAt: row.created_at ? asIso(row.created_at) : undefined,
    totalAmount: total,
    totalPrice: total,
    deliveryTime: row.delivery_time ?? undefined,
    paymentTerms: row.payment_terms ?? undefined,
    warrantyPolicy: row.warranty_policy ?? undefined,
    note: row.note ?? undefined,
    items: (row.items ?? []).map(bidItemFromRow),
    // Phase 2 revision fields
    revisionNo: row.revision_no ?? 0,
    parentBidId: row.parent_bid_id ?? undefined,
  };
}

export async function listSuppliers(): Promise<SupplierAccount[]> {
  const result = await query<{
    id: string;
    company_name: string;
    tax_code: string | null;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    password: string | null;
    password_hash: string | null;
    profile_completed: boolean | null;
    status: string | null;
    address: string | null;
    province: string | null;
    website: string | null;
    business_description: string | null;
    categories: unknown;
    created_at: string | Date | null;
    updated_at: string | Date | null;
    raw_data: JsonRecord;
  }>("select * from suppliers order by created_at desc, company_name asc");

  return result.rows.map((row) => ({
    ...(row.raw_data as Partial<SupplierAccount>),
    id: row.id,
    companyName: row.company_name,
    taxCode: row.tax_code ?? "",
    contactName: row.contact_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    password: row.password ?? "",
    password_hash: row.password_hash ?? undefined,
    profileCompleted: Boolean(row.profile_completed),
    status: row.status ?? "",
    createdAt: asIso(row.created_at),
    address: row.address ?? undefined,
    province: row.province ?? undefined,
    website: row.website ?? undefined,
    businessDescription: row.business_description ?? undefined,
    categories: asArray<string>(row.categories),
  }));
}

export async function getSupplier(id: string): Promise<SupplierAccount | null> {
  const suppliers = await listSuppliers();
  return suppliers.find((supplier) => supplier.id === id) ?? null;
}

/**
 * Kiểm tra trùng lặp email / taxCode / phone trực tiếp tại DB.
 * Dùng cho supplier registration validation — không fetch toàn bộ danh sách.
 * excludeId: bỏ qua record của chính supplier khi update profile.
 */
export async function checkSupplierDuplicates(params: {
  email?: string;
  taxCode?: string;
  phone?: string;
  excludeId?: string;
}): Promise<{ emailExists: boolean; taxCodeExists: boolean; phoneExists: boolean }> {
  const { email, taxCode, phone, excludeId } = params;

  const checkField = async (field: string, value: string | undefined): Promise<boolean> => {
    if (!value?.trim()) return false;
    const res = await query<{ exists: boolean }>(
      `SELECT EXISTS(
        SELECT 1 FROM suppliers
        WHERE lower(${field}) = lower($1)
        ${excludeId ? "AND id <> $2" : ""}
      ) AS exists`,
      excludeId ? [value.trim(), excludeId] : [value.trim()],
    );
    return res.rows[0]?.exists ?? false;
  };

  const [emailExists, taxCodeExists, phoneExists] = await Promise.all([
    checkField("email", email),
    checkField("tax_code", taxCode),
    checkField("phone", phone),
  ]);

  return { emailExists, taxCodeExists, phoneExists };
}

export async function upsertSupplier(account: SupplierAccount): Promise<SupplierAccount> {
  await query(
    `insert into suppliers (
      id, company_name, tax_code, contact_name, email, phone, password, password_hash,
      profile_completed, status, address, province, website,
      business_description, categories, created_at, updated_at, raw_data
    ) values (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13,
      $14, $15::jsonb, $16, now(), $17::jsonb
    )
    on conflict (id) do update set
      company_name = excluded.company_name,
      tax_code = excluded.tax_code,
      contact_name = excluded.contact_name,
      email = excluded.email,
      phone = excluded.phone,
      password = excluded.password,
      password_hash = excluded.password_hash,
      profile_completed = excluded.profile_completed,
      status = excluded.status,
      address = excluded.address,
      province = excluded.province,
      website = excluded.website,
      business_description = excluded.business_description,
      categories = excluded.categories,
      updated_at = now(),
      raw_data = excluded.raw_data`,
    [
      account.id,
      account.companyName,
      account.taxCode,
      account.contactName,
      account.email,
      account.phone,
      account.password,
      account.password_hash ?? null,
      account.profileCompleted,
      account.status,
      account.address ?? null,
      account.province ?? null,
      account.website ?? null,
      account.businessDescription ?? null,
      JSON.stringify(account.categories ?? []),
      account.createdAt || new Date().toISOString(),
      JSON.stringify(account),
    ],
  );
  return account;
}

/** Called during registration: store verification token + random password hash, mark unverified */
export async function setSupplierActivation(
  id: string,
  passwordHash: string,
  verificationToken: string,
): Promise<void> {
  await query(
    `UPDATE suppliers
     SET password_hash = $1, password = '', verification_token = $2,
         email_verified = FALSE, must_change_password = TRUE, updated_at = NOW()
     WHERE id = $3`,
    [passwordHash, verificationToken, id],
  );
}

/** Called from verify-email route: mark supplier as verified and clear token */
export async function verifySupplierEmail(token: string): Promise<string | null> {
  const res = await query<{ id: string }>(
    `UPDATE suppliers
     SET email_verified = TRUE, verification_token = NULL, updated_at = NOW()
     WHERE verification_token = $1
     RETURNING id`,
    [token],
  );
  return res.rows[0]?.id ?? null;
}

/** Called after supplier successfully sets a new password */
export async function markPasswordChanged(id: string, newPasswordHash: string): Promise<void> {
  await query(
    `UPDATE suppliers
     SET password_hash = $1, password = '', must_change_password = FALSE, updated_at = NOW()
     WHERE id = $2`,
    [newPasswordHash, id],
  );
}

/**
 * Find supplier by email, reset their password, and set must_change_password.
 * Returns { id, company_name } if found, null if no supplier with that email.
 */
export async function resetSupplierPasswordByEmail(
  email: string,
  newPasswordHash: string,
): Promise<{ id: string; companyName: string } | null> {
  const res = await query<{ id: string; company_name: string }>(
    `UPDATE suppliers
     SET password_hash = $1, password = '', must_change_password = TRUE, updated_at = NOW()
     WHERE lower(trim(email)) = lower(trim($2))
     RETURNING id, company_name`,
    [newPasswordHash, email],
  );
  const row = res.rows[0];
  if (!row) return null;
  return { id: row.id, companyName: row.company_name };
}

/** Returns email_verified + must_change_password for a supplier by id */
export async function getSupplierAuthFlags(
  id: string,
): Promise<{ emailVerified: boolean; mustChangePassword: boolean } | null> {
  const res = await query<{ email_verified: boolean; must_change_password: boolean }>(
    `SELECT email_verified, must_change_password FROM suppliers WHERE id = $1`,
    [id],
  );
  const row = res.rows[0];
  if (!row) return null;
  return { emailVerified: row.email_verified, mustChangePassword: row.must_change_password };
}

export async function listTenders(): Promise<AdminTender[]> {
  // Auto-close tenders whose deadline has passed (server-side, idempotent)
  await query(
    `UPDATE tenders SET status = 'Đã đóng', updated_at = NOW()
     WHERE status = 'Đang nhận báo giá' AND deadline < CURRENT_DATE`,
  ).catch(() => {/* non-fatal */});
  const tenders = await query<TenderRow>("select * from tenders order by created_at desc, code asc");
  const items = await query<TenderItemRow>("select * from tender_items order by tender_id asc, sort_order asc, id asc");
  const itemMap = new Map<string, TenderItemRow[]>();
  items.rows.forEach((item) => {
    const list = itemMap.get(item.tender_id) ?? [];
    list.push(item);
    itemMap.set(item.tender_id, list);
  });
  return tenders.rows.map((row) => tenderFromRow({ ...row, items: itemMap.get(row.id) ?? [] }));
}

export async function getTender(id: string): Promise<AdminTender | null> {
  const tenders = await listTenders();
  return tenders.find((tender) => tender.id === id || tender.code === id) ?? null;
}

export async function upsertTender(tender: AdminTender): Promise<AdminTender> {
  return withTransaction(async (txQuery) => {
    await txQuery(
      `insert into tenders (
        id, code, title, category, status, deadline, estimated_value,
        description, delivery_location, delivery_time, payment_terms,
        document_requirements, created_at, updated_at, raw_data
      ) values (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12::jsonb, $13, now(), $14::jsonb
      )
      on conflict (id) do update set
        code = excluded.code,
        title = excluded.title,
        category = excluded.category,
        status = excluded.status,
        deadline = excluded.deadline,
        estimated_value = excluded.estimated_value,
        description = excluded.description,
        delivery_location = excluded.delivery_location,
        delivery_time = excluded.delivery_time,
        payment_terms = excluded.payment_terms,
        document_requirements = excluded.document_requirements,
        updated_at = now(),
        raw_data = excluded.raw_data`,
      [
        tender.id,
        tender.code,
        tender.title,
        tender.category,
        tender.status,
        tender.deadline || null,
        tender.estimatedValue,
        tender.description,
        tender.deliveryLocation,
        tender.deliveryTime,
        tender.paymentTerms,
        JSON.stringify(tender.documentRequirements ?? []),
        tender.createdAt || new Date().toISOString(),
        JSON.stringify(tender),
      ],
    );
    await txQuery("delete from tender_items where tender_id = $1", [tender.id]);
    for (const [index, item] of (tender.items ?? []).entries()) {
      await txQuery(
        `insert into tender_items (
          id, tender_id, material_id, material_code, item_name, specification,
          quantity, unit, note, sort_order, raw_data
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)`,
        [
          item.id,
          tender.id,
          item.materialId ?? null,
          item.materialCode ?? null,
          item.itemName,
          item.specification,
          item.quantity,
          item.unit,
          item.note,
          index,
          JSON.stringify(item),
        ],
      );
    }
    return tender;
  });
}

export async function deleteTenderRecord(id: string): Promise<void> {
  await query("delete from tenders where id = $1 or code = $1", [id]);
}

export async function deleteSupplierRecord(id: string): Promise<void> {
  await query("DELETE FROM suppliers WHERE id = $1", [id]);
}

export async function deleteInternalUserRecord(id: string): Promise<void> {
  await query("DELETE FROM internal_users WHERE id = $1", [id]);
}

export async function listBids(): Promise<SupplierBid[]> {
  const bids = await query<BidRow>("select * from bids order by submitted_at desc nulls last, created_at desc");
  const items = await query<BidItemRow>("select * from bid_items order by bid_id asc, sort_order asc, id asc");
  const itemMap = new Map<string, BidItemRow[]>();
  items.rows.forEach((item) => {
    const list = itemMap.get(item.bid_id) ?? [];
    list.push(item);
    itemMap.set(item.bid_id, list);
  });
  return bids.rows.map((row) => bidFromRow({ ...row, items: itemMap.get(row.id) ?? [] }));
}

export async function getBidsByTender(tenderId: string): Promise<SupplierBid[]> {
  const bids = await query<BidRow>(
    "select * from bids where tender_id = $1 order by submitted_at desc nulls last, created_at desc",
    [tenderId],
  );
  if (bids.rows.length === 0) return [];
  const bidIds = bids.rows.map((r) => r.id);
  const items = await query<BidItemRow>(
    "select * from bid_items where bid_id = ANY($1::text[]) order by sort_order asc, id asc",
    [bidIds],
  );
  const itemMap = new Map<string, BidItemRow[]>();
  items.rows.forEach((item) => {
    const list = itemMap.get(item.bid_id) ?? [];
    list.push(item);
    itemMap.set(item.bid_id, list);
  });
  return bids.rows.map((row) => bidFromRow({ ...row, items: itemMap.get(row.id) ?? [] }));
}

export async function getBid(id: string): Promise<SupplierBid | null> {
  const bids = await listBids();
  return bids.find((bid) => bid.id === id) ?? null;
}

export async function nextBidCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BG-${year}-`;
  const res = await query<{ bid_code: string }>(
    `SELECT bid_code FROM bids
     WHERE bid_code LIKE $1
     ORDER BY bid_code DESC
     LIMIT 1`,
    [`${prefix}%`],
  );
  const last = res.rows[0]?.bid_code ?? null;
  const lastNum = last ? parseInt(last.slice(prefix.length), 10) : 0;
  const next = isNaN(lastNum) ? 1 : lastNum + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export async function upsertBid(bid: SupplierBid): Promise<SupplierBid> {
  return withTransaction(async (txQuery) => {
    await txQuery(
      `insert into bids (
        id, bid_code, tender_id, tender_code, tender_title, supplier_id,
        supplier_name, supplier_email, supplier_phone, status, submitted_at,
        total_amount, delivery_time, payment_terms, warranty_policy, note,
        revision_no, parent_bid_id,
        created_at, updated_at, raw_data
      ) values (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18,
        $19, now(), $20::jsonb
      )
      on conflict (id) do update set
        bid_code = excluded.bid_code,
        tender_id = excluded.tender_id,
        tender_code = excluded.tender_code,
        tender_title = excluded.tender_title,
        supplier_id = excluded.supplier_id,
        supplier_name = excluded.supplier_name,
        supplier_email = excluded.supplier_email,
        supplier_phone = excluded.supplier_phone,
        status = excluded.status,
        submitted_at = excluded.submitted_at,
        total_amount = excluded.total_amount,
        delivery_time = excluded.delivery_time,
        payment_terms = excluded.payment_terms,
        warranty_policy = excluded.warranty_policy,
        note = excluded.note,
        revision_no = excluded.revision_no,
        parent_bid_id = excluded.parent_bid_id,
        updated_at = now(),
        raw_data = excluded.raw_data`,
      [
        bid.id,
        bid.bidCode,
        bid.tenderId,
        bid.tenderCode,
        bid.tenderTitle ?? bid.tenderName ?? "",
        bid.supplierId,
        bid.supplierName,
        bid.supplierEmail ?? null,
        bid.supplierPhone ?? null,
        bid.status,
        bid.submittedAt ?? bid.createdAt ?? new Date().toISOString(),
        bid.totalAmount ?? bid.totalPrice ?? 0,
        bid.deliveryTime ?? null,
        bid.paymentTerms ?? null,
        bid.warrantyPolicy ?? null,
        bid.note ?? null,
        bid.revisionNo ?? 0,
        bid.parentBidId ?? null,
        bid.createdAt ?? bid.submittedAt ?? new Date().toISOString(),
        JSON.stringify(bid),
      ],
    );
    await txQuery("delete from bid_items where bid_id = $1", [bid.id]);
    for (const [index, item] of (bid.items ?? []).entries()) {
      await txQuery(
        `insert into bid_items (
          id, bid_id, tender_item_id, item_name, specification, quantity,
          unit, unit_price, amount, brand, origin, delivery_time, note,
          item_code, specification_snapshot, quantity_snapshot, unit_snapshot,
          sort_order, raw_data
        ) values (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17,
          $18, $19::jsonb
        )`,
        [
          item.id,
          bid.id,
          item.tenderItemId,
          item.itemName,
          item.specification ?? null,
          item.quantity,
          item.unit,
          item.unitPrice,
          item.amount,
          item.brand ?? null,
          item.origin ?? null,
          item.deliveryTime ?? null,
          item.note ?? null,
          item.itemCode ?? null,
          item.specificationSnapshot ?? item.specification ?? null,
          item.quantitySnapshot ?? item.quantity ?? null,
          item.unitSnapshot ?? item.unit ?? null,
          index,
          JSON.stringify(item),
        ],
      );
    }
    return bid;
  });
}

export async function deleteBidRecord(id: string): Promise<void> {
  await query("delete from bids where id = $1", [id]);
}

export async function listInternalUsers(): Promise<InternalUser[]> {
  const result = await query<{
    id: string;
    full_name: string;
    email: string | null;
    password: string | null;
    role: string | null;
    department: string | null;
    status: string | null;
    created_at: string | Date | null;
    raw_data: JsonRecord;
  }>("select * from internal_users order by created_at asc, full_name asc");
  return result.rows.map((row) => ({
    ...(row.raw_data as Partial<InternalUser>),
    id: row.id,
    fullName: row.full_name,
    name: (row.raw_data.name as string | undefined) ?? row.full_name,
    email: row.email ?? "",
    password: row.password ?? "",
    role: row.role ?? "",
    department: row.department ?? "",
    status: row.status ?? "",
    createdAt: asIso(row.created_at),
  }));
}

export async function upsertInternalUser(user: InternalUser): Promise<InternalUser> {
  await query(
    `insert into internal_users (
      id, full_name, email, password, role, department, status, created_at, updated_at, raw_data
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, now(), $9::jsonb)
    on conflict (id) do update set
      full_name = excluded.full_name,
      email = excluded.email,
      password = excluded.password,
      role = excluded.role,
      department = excluded.department,
      status = excluded.status,
      updated_at = now(),
      raw_data = excluded.raw_data`,
    [
      user.id,
      user.fullName,
      user.email,
      user.password,
      user.role,
      user.department,
      user.status,
      user.createdAt || new Date().toISOString(),
      JSON.stringify(user),
    ],
  );
  return user;
}

export async function getInternalUser(id: string): Promise<InternalUser | null> {
  const users = await listInternalUsers();
  return users.find((user) => user.id === id) ?? null;
}

export async function listCategories(): Promise<PurchaseCategory[]> {
  const result = await query<{
    id: string;
    code: string | null;
    name: string;
    description: string | null;
    status: string | null;
    created_at: string | Date | null;
    updated_at: string | Date | null;
    raw_data: JsonRecord;
  }>("select * from procurement_groups order by name asc");
  return result.rows.map((row) => ({
    ...(row.raw_data as Partial<PurchaseCategory>),
    id: row.id,
    code: row.code ?? "",
    name: row.name,
    description: row.description ?? undefined,
    status: (row.status ?? "Hoạt động") as PurchaseCategory["status"],
    createdAt: asIso(row.created_at),
    updatedAt: row.updated_at ? asIso(row.updated_at) : undefined,
  }));
}

export async function upsertCategory(category: PurchaseCategory): Promise<PurchaseCategory> {
  await query(
    `insert into procurement_groups (id, code, name, description, status, created_at, updated_at, raw_data)
    values ($1, $2, $3, $4, $5, $6, now(), $7::jsonb)
    on conflict (id) do update set
      code = excluded.code,
      name = excluded.name,
      description = excluded.description,
      status = excluded.status,
      updated_at = now(),
      raw_data = excluded.raw_data`,
    [
      category.id,
      category.code,
      category.name,
      category.description ?? null,
      category.status,
      category.createdAt || new Date().toISOString(),
      JSON.stringify(category),
    ],
  );
  return category;
}

export async function listMaterials(): Promise<MaterialItem[]> {
  const result = await query<{
    id: string;
    category_id: string | null;
    category_name: string | null;
    material_code: string | null;
    material_name: string;
    specification: string | null;
    unit: string | null;
    description: string | null;
    status: string | null;
    created_at: string | Date | null;
    updated_at: string | Date | null;
    raw_data: JsonRecord;
  }>("select * from material_items order by material_code asc, material_name asc");
  return result.rows.map((row) => ({
    ...(row.raw_data as Partial<MaterialItem>),
    id: row.id,
    categoryId: row.category_id ?? "",
    categoryName: row.category_name ?? "",
    materialCode: row.material_code ?? "",
    materialName: row.material_name,
    specification: row.specification ?? undefined,
    unit: row.unit ?? "",
    description: row.description ?? undefined,
    status: (row.status ?? "Hoạt động") as MaterialItem["status"],
    createdAt: asIso(row.created_at),
    updatedAt: row.updated_at ? asIso(row.updated_at) : undefined,
  }));
}

export async function getMaterial(id: string): Promise<MaterialItem | null> {
  const materials = await listMaterials();
  return materials.find((material) => material.id === id) ?? null;
}

export async function upsertMaterial(material: MaterialItem): Promise<MaterialItem> {
  await query(
    `insert into material_items (
      id, category_id, category_name, material_code, material_name,
      specification, unit, description, status, created_at, updated_at, raw_data
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), $11::jsonb)
    on conflict (id) do update set
      category_id = excluded.category_id,
      category_name = excluded.category_name,
      material_code = excluded.material_code,
      material_name = excluded.material_name,
      specification = excluded.specification,
      unit = excluded.unit,
      description = excluded.description,
      status = excluded.status,
      updated_at = now(),
      raw_data = excluded.raw_data`,
    [
      material.id,
      material.categoryId,
      material.categoryName,
      material.materialCode,
      material.materialName,
      material.specification ?? null,
      material.unit,
      material.description ?? null,
      material.status,
      material.createdAt || new Date().toISOString(),
      JSON.stringify(material),
    ],
  );
  return material;
}

export async function listActivityLogs(
  filters: ActivityLogFilters = {},
): Promise<ActivityLogListResponse> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let index = 1;

  if (filters.entityType) {
    conditions.push(`entity_type = $${index++}`);
    params.push(filters.entityType);
  }

  if (filters.action) {
    conditions.push(`action = $${index++}`);
    params.push(filters.action);
  }

  if (filters.fromDate) {
    conditions.push(`created_at >= $${index++}::date`);
    params.push(filters.fromDate);
  }

  if (filters.toDate) {
    conditions.push(`created_at < ($${index++}::date + interval '1 day')`);
    params.push(filters.toDate);
  }

  if (filters.search?.trim()) {
    conditions.push(
      `(coalesce(actor_name, '') ilike $${index}
        or coalesce(actor_email, '') ilike $${index}
        or coalesce(entity_name, '') ilike $${index}
        or coalesce(entity_id, '') ilike $${index}
        or coalesce(description, '') ilike $${index})`,
    );
    params.push(`%${filters.search.trim()}%`);
    index += 1;
  }

  const whereClause = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";
  const rawLimit = Number.isFinite(filters.limit) ? Number(filters.limit) : 50;
  const rawOffset = Number.isFinite(filters.offset) ? Number(filters.offset) : 0;
  const limit = Math.max(1, Math.min(rawLimit, 100));
  const offset = Math.max(0, rawOffset);

  const totalResult = await query<{ total: string }>(
    `select count(*)::text as total from activity_logs ${whereClause}`,
    params,
  );

  const result = await query<{
    id: string;
    entity_type: string;
    entity_id: string;
    entity_name: string | null;
    action: string;
    actor_id: string | null;
    actor_type: string | null;
    actor_name: string | null;
    actor_email: string | null;
    description: string;
    metadata: unknown;
    old_values: unknown;
    new_values: unknown;
    created_at: string | Date | null;
  }>(
    `select *
    from activity_logs
    ${whereClause}
    order by created_at desc
    limit $${index++}
    offset $${index++}`,
    [...params, limit, offset],
  );

  return {
    items: result.rows.map((row) => ({
      id: row.id,
      entityType: row.entity_type as ActivityLog["entityType"],
      entityId: row.entity_id,
      entityName: row.entity_name ?? undefined,
      action: row.action as ActivityLog["action"],
      actorId: row.actor_id ?? undefined,
      actorType: row.actor_type as ActivityLog["actorType"] | undefined,
      actorName: row.actor_name ?? undefined,
      actorEmail: row.actor_email ?? undefined,
      description: row.description,
      metadata: asObject(row.metadata),
      oldValues: asObject(row.old_values),
      newValues: asObject(row.new_values),
      createdAt: asIso(row.created_at),
    })),
    total: Number(totalResult.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}

// ── Award items ───────────────────────────────────────────────────────────────

function awardItemFromRow(row: AwardItemRow): AwardItem {
  return {
    id: row.id,
    tenderId: row.tender_id,
    tenderItemId: row.tender_item_id,
    bidId: row.bid_id,
    bidItemId: row.bid_item_id ?? undefined,
    supplierId: row.supplier_id ?? undefined,
    supplierName: row.supplier_name ?? undefined,
    unitPrice: asNumber(row.unit_price),
    quantity: asNumber(row.quantity),
    amount: asNumber(row.amount),
    note: row.note ?? undefined,
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

export async function listAwardItems(tenderId: string): Promise<AwardItem[]> {
  const result = await query<AwardItemRow>(
    "select * from award_items where tender_id = $1 order by created_at asc",
    [tenderId],
  );
  return result.rows.map(awardItemFromRow);
}

export async function upsertAwardItem(input: UpsertAwardItemInput): Promise<AwardItem> {
  const id = `AWD-${randomUUID()}`;
  const result = await query<AwardItemRow>(
    `insert into award_items (
      id, tender_id, tender_item_id, bid_id, bid_item_id,
      supplier_id, supplier_name, unit_price, quantity, amount, note,
      created_at, updated_at
    ) values (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, $11,
      now(), now()
    )
    on conflict (tender_item_id) do update set
      bid_id        = excluded.bid_id,
      bid_item_id   = excluded.bid_item_id,
      supplier_id   = excluded.supplier_id,
      supplier_name = excluded.supplier_name,
      unit_price    = excluded.unit_price,
      quantity      = excluded.quantity,
      amount        = excluded.amount,
      note          = excluded.note,
      updated_at    = now()
    returning *`,
    [
      id,
      input.tenderId,
      input.tenderItemId,
      input.bidId,
      input.bidItemId ?? null,
      input.supplierId ?? null,
      input.supplierName ?? null,
      input.unitPrice,
      input.quantity,
      input.amount,
      input.note ?? null,
    ],
  );
  return awardItemFromRow(result.rows[0]);
}

export async function deleteAwardItem(id: string): Promise<void> {
  await query("delete from award_items where id = $1", [id]);
}

export async function deleteAwardItemByTenderItem(tenderItemId: string): Promise<void> {
  await query("delete from award_items where tender_item_id = $1", [tenderItemId]);
}

// ── Bid Clarifications ────────────────────────────────────────────────────────

type ClarificationRow = {
  id: string;
  bid_id: string;
  tender_id: string;
  requested_by: string;
  requested_by_name: string;
  request_note: string;
  requested_at: string | Date;
  responded_by: string | null;
  responded_by_name: string | null;
  response_note: string | null;
  responded_at: string | Date | null;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
};

function clarificationFromRow(row: ClarificationRow): BidClarification {
  return {
    id: row.id,
    bidId: row.bid_id,
    tenderId: row.tender_id,
    requestedBy: row.requested_by,
    requestedByName: row.requested_by_name,
    requestNote: row.request_note,
    requestedAt: asIso(row.requested_at),
    respondedBy: row.responded_by ?? undefined,
    respondedByName: row.responded_by_name ?? undefined,
    responseNote: row.response_note ?? undefined,
    respondedAt: row.responded_at ? asIso(row.responded_at) : undefined,
    status: row.status as "pending" | "responded",
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

export async function listBidClarifications(bidId: string): Promise<BidClarification[]> {
  const result = await query<ClarificationRow>(
    "SELECT * FROM bid_clarifications WHERE bid_id = $1 ORDER BY created_at ASC",
    [bidId],
  );
  return result.rows.map(clarificationFromRow);
}

export async function createBidClarification(input: {
  bidId: string;
  tenderId: string;
  requestedBy: string;
  requestedByName: string;
  requestNote: string;
}): Promise<BidClarification> {
  const id = randomUUID();
  const result = await query<ClarificationRow>(
    `INSERT INTO bid_clarifications (id, bid_id, tender_id, requested_by, requested_by_name, request_note)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, input.bidId, input.tenderId, input.requestedBy, input.requestedByName, input.requestNote],
  );
  // Đồng thời đổi bid status → "Cần làm rõ"
  await query(
    "UPDATE bids SET status = 'Cần làm rõ', updated_at = now() WHERE id = $1",
    [input.bidId],
  );
  return clarificationFromRow(result.rows[0]);
}

export async function respondToBidClarification(
  clarificationId: string,
  respondedBy: string,
  respondedByName: string,
  responseNote: string,
): Promise<BidClarification> {
  const result = await query<ClarificationRow>(
    `UPDATE bid_clarifications
     SET responded_by = $1, responded_by_name = $2, response_note = $3,
         responded_at = now(), status = 'responded', updated_at = now()
     WHERE id = $4 RETURNING *`,
    [respondedBy, respondedByName, responseNote, clarificationId],
  );
  if (!result.rows[0]) throw new Error("Clarification không tồn tại");
  const row = result.rows[0];
  // Đồng thời đổi bid status → "Đã phản hồi"
  await query(
    "UPDATE bids SET status = 'Đã phản hồi', updated_at = now() WHERE id = $1",
    [row.bid_id],
  );
  return clarificationFromRow(row);
}

// ── Propose Awards (KHVT flow) ────────────────────────────────────────────────

/**
 * KHVT đề xuất kết quả — bids có award items → "Đề xuất chọn",
 * tender → "Chờ phê duyệt". Trưởng phòng/Admin sẽ finalize sau.
 */
export async function proposeAwards(tenderId: string): Promise<void> {
  await withTransaction(async (txQuery) => {
    // Lấy danh sách bid_id đã có award items
    const awardResult = await txQuery<{ bid_id: string }>(
      "SELECT DISTINCT bid_id FROM award_items WHERE tender_id = $1",
      [tenderId],
    );
    const proposedBidIds = awardResult.rows.map((r) => r.bid_id);

    // Tất cả bids của tender
    const bidResult = await txQuery<{ id: string }>(
      "SELECT id FROM bids WHERE tender_id = $1",
      [tenderId],
    );

    for (const bid of bidResult.rows) {
      const isProposed = proposedBidIds.includes(bid.id);
      const newStatus = isProposed ? "Đề xuất chọn" : "Không được chọn";
      await txQuery(
        "UPDATE bids SET status = $1, updated_at = now() WHERE id = $2",
        [newStatus, bid.id],
      );
    }

    // Tender → "Chờ phê duyệt"
    await txQuery(
      "UPDATE tenders SET status = 'Chờ phê duyệt', updated_at = now() WHERE id = $1",
      [tenderId],
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────

export async function finalizeAwards(tenderId: string): Promise<void> {
  await withTransaction(async (txQuery) => {
    // 1. Get all award_items for this tender
    const awardResult = await txQuery<{ bid_id: string; tender_item_id: string; bid_item_id: string | null }>(
      "select bid_id, tender_item_id, bid_item_id from award_items where tender_id = $1",
      [tenderId],
    );
    const awards = awardResult.rows;

    // Count how many items each bid won
    const awardCountPerBid = new Map<string, number>();
    for (const a of awards) {
      awardCountPerBid.set(a.bid_id, (awardCountPerBid.get(a.bid_id) ?? 0) + 1);
    }

    const awardedBidItemIds = new Set(
      awards.map((a) => a.bid_item_id).filter((id): id is string => id !== null),
    );

    // 2. Get all bids for this tender, including how many items they submitted
    const bidResult = await txQuery<{ id: string; status: string | null }>(
      "select id, status from bids where tender_id = $1",
      [tenderId],
    );

    // 3. Update each bid status
    //    Any bid that won at least one item → "Được chọn"
    //    Bids that won nothing → "Không được chọn"
    for (const bid of bidResult.rows) {
      const wonCount = awardCountPerBid.get(bid.id) ?? 0;
      const newStatus = wonCount > 0 ? "Được chọn" : "Không được chọn";
      await txQuery(
        "update bids set status = $1, updated_at = now() where id = $2",
        [newStatus, bid.id],
      );
    }

    // 4. Update bid_items.item_status
    //    Awarded items → 'awarded'
    if (awardedBidItemIds.size > 0) {
      await txQuery(
        `update bid_items set item_status = 'awarded', updated_at = now()
         where id = any($1::text[])`,
        [Array.from(awardedBidItemIds)],
      );
    }
    //    Remaining items for this tender's bids → 'rejected'
    await txQuery(
      `update bid_items set item_status = 'rejected', updated_at = now()
       where bid_id in (
         select id from bids where tender_id = $1
       ) and item_status = 'pending'`,
      [tenderId],
    );

    // 5. Update tender status to "Đã có kết quả"
    await txQuery(
      "update tenders set status = 'Đã có kết quả', updated_at = now() where id = $1",
      [tenderId],
    );
  });
}

export async function createActivityLog(log: ActivityLog): Promise<ActivityLog> {
  await query(
    `insert into activity_logs (
      id, entity_type, entity_id, entity_name, action, actor_id, actor_type,
      actor_name, actor_email, description, metadata, old_values, new_values, created_at
    ) values (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14
    )
    on conflict (id) do update set
      entity_type = excluded.entity_type,
      entity_id = excluded.entity_id,
      entity_name = excluded.entity_name,
      action = excluded.action,
      actor_id = excluded.actor_id,
      actor_type = excluded.actor_type,
      actor_name = excluded.actor_name,
      actor_email = excluded.actor_email,
      description = excluded.description,
      metadata = excluded.metadata,
      old_values = excluded.old_values,
      new_values = excluded.new_values`,
    [
      log.id,
      log.entityType,
      log.entityId,
      log.entityName ?? null,
      log.action,
      log.actorId ?? null,
      log.actorType ?? null,
      log.actorName ?? null,
      log.actorEmail ?? null,
      log.description,
      JSON.stringify(log.metadata ?? null),
      JSON.stringify(log.oldValues ?? null),
      JSON.stringify(log.newValues ?? null),
      log.createdAt,
    ],
  );
  return log;
}

// ─────────────────────────────────────────────────────────────────────────────
// Uploads
// ─────────────────────────────────────────────────────────────────────────────

type UploadRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  uploaded_by: string | null;
  uploaded_by_kind: string | null;
  filename: string;
  stored_name: string;
  mime_type: string | null;
  size_bytes: string | number | null;
  purpose: string | null;
  created_at: string | Date;
};

function uploadFromRow(row: UploadRow): Upload {
  return {
    id: row.id,
    entityType: row.entity_type as Upload["entityType"],
    entityId: row.entity_id,
    uploadedBy: row.uploaded_by ?? undefined,
    uploadedByKind: (row.uploaded_by_kind as Upload["uploadedByKind"]) ?? undefined,
    filename: row.filename,
    storedName: row.stored_name,
    mimeType: row.mime_type ?? undefined,
    sizeBytes: row.size_bytes != null ? Number(row.size_bytes) : undefined,
    purpose: (row.purpose as Upload["purpose"]) ?? undefined,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function listUploads(
  entityType: string,
  entityId: string,
): Promise<Upload[]> {
  const result = await query<UploadRow>(
    `SELECT * FROM uploads WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at ASC`,
    [entityType, entityId],
  );
  return result.rows.map(uploadFromRow);
}

export async function createUploadRecord(input: UploadInput): Promise<Upload> {
  const id = randomUUID();
  const result = await query<UploadRow>(
    `INSERT INTO uploads
       (id, entity_type, entity_id, uploaded_by, uploaded_by_kind,
        filename, stored_name, mime_type, size_bytes, purpose)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      id,
      input.entityType,
      input.entityId,
      input.uploadedBy ?? null,
      input.uploadedByKind ?? null,
      input.filename,
      input.storedName,
      input.mimeType ?? null,
      input.sizeBytes ?? null,
      input.purpose ?? null,
    ],
  );
  return uploadFromRow(result.rows[0]);
}

export async function getUpload(id: string): Promise<Upload | null> {
  const result = await query<UploadRow>(
    `SELECT * FROM uploads WHERE id = $1`,
    [id],
  );
  return result.rows.length > 0 ? uploadFromRow(result.rows[0]) : null;
}

export async function deleteUploadRecord(id: string): Promise<void> {
  await query(`DELETE FROM uploads WHERE id = $1`, [id]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal user email lookup (for email notifications)
// ─────────────────────────────────────────────────────────────────────────────

export async function getInternalEmailsByRoles(roles: string[]): Promise<string[]> {
  if (!roles.length) return [];
  const result = await query<{ email: string }>(
    `SELECT email FROM internal_users
     WHERE role = ANY($1::text[]) AND status = 'active' AND email IS NOT NULL AND email <> ''`,
    [roles],
  );
  return result.rows.map((r) => r.email).filter(Boolean);
}

export async function getActiveSupplierEmails(): Promise<string[]> {
  const result = await query<{ email: string }>(
    `SELECT email FROM suppliers WHERE status = 'Đã duyệt' AND email IS NOT NULL AND email <> ''`,
  );
  return result.rows.map((r) => r.email).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Statistics (Phase 5)
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalTenders: number;
  openTenders: number;
  closedTenders: number;
  awardedTenders: number;
  pendingApprovalTenders: number;
  totalTenderValue: number;
  totalAwardedValue: number;
  totalSuppliers: number;
  approvedSuppliers: number;
  pendingSuppliers: number;
  totalBids: number;
  newBids: number;
  awardedBids: number;
}

export interface MonthlyTrend {
  month: string;   // "2025-01"
  label: string;   // "Th1/25"
  tenders: number;
  bids: number;
  value: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const result = await query<{
    total_tenders: string;
    open_tenders: string;
    closed_tenders: string;
    awarded_tenders: string;
    pending_approval_tenders: string;
    total_tender_value: string;
    total_awarded_value: string;
    total_suppliers: string;
    approved_suppliers: string;
    pending_suppliers: string;
    total_bids: string;
    new_bids: string;
    awarded_bids: string;
  }>(`
    SELECT
      (SELECT COUNT(*)::text FROM tenders)                                              AS total_tenders,
      (SELECT COUNT(*)::text FROM tenders WHERE status = 'Đang nhận báo giá')          AS open_tenders,
      (SELECT COUNT(*)::text FROM tenders WHERE status = 'Đã đóng')                    AS closed_tenders,
      (SELECT COUNT(*)::text FROM tenders WHERE status = 'Đã có kết quả')              AS awarded_tenders,
      (SELECT COUNT(*)::text FROM tenders WHERE status = 'Chờ phê duyệt')              AS pending_approval_tenders,
      (SELECT COALESCE(SUM(estimated_value),0)::text FROM tenders)                     AS total_tender_value,
      (SELECT COALESCE(SUM(total_amount),0)::text FROM bids WHERE status='Được chọn') AS total_awarded_value,
      (SELECT COUNT(*)::text FROM suppliers)                                            AS total_suppliers,
      (SELECT COUNT(*)::text FROM suppliers WHERE status = 'Đã duyệt')                 AS approved_suppliers,
      (SELECT COUNT(*)::text FROM suppliers WHERE status = 'Chờ xét duyệt')            AS pending_suppliers,
      (SELECT COUNT(*)::text FROM bids)                                                 AS total_bids,
      (SELECT COUNT(*)::text FROM bids WHERE status = 'Đã nộp')                        AS new_bids,
      (SELECT COUNT(*)::text FROM bids WHERE status = 'Được chọn')                     AS awarded_bids
  `);
  const row = result.rows[0];
  return {
    totalTenders:           Number(row.total_tenders),
    openTenders:            Number(row.open_tenders),
    closedTenders:          Number(row.closed_tenders),
    awardedTenders:         Number(row.awarded_tenders),
    pendingApprovalTenders: Number(row.pending_approval_tenders),
    totalTenderValue:       Number(row.total_tender_value),
    totalAwardedValue:      Number(row.total_awarded_value),
    totalSuppliers:         Number(row.total_suppliers),
    approvedSuppliers:      Number(row.approved_suppliers),
    pendingSuppliers:       Number(row.pending_suppliers),
    totalBids:              Number(row.total_bids),
    newBids:                Number(row.new_bids),
    awardedBids:            Number(row.awarded_bids),
  };
}

export async function getMonthlyTrends(): Promise<MonthlyTrend[]> {
  const result = await query<{
    month: string;
    tenders: string;
    bids: string;
    value: string;
  }>(`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', NOW() - INTERVAL '5 months'),
        date_trunc('month', NOW()),
        '1 month'::interval
      ) AS m
    ),
    t_counts AS (
      SELECT date_trunc('month', created_at) AS m,
             COUNT(*)::text AS cnt,
             COALESCE(SUM(estimated_value), 0)::text AS val
      FROM tenders
      WHERE created_at >= date_trunc('month', NOW() - INTERVAL '5 months')
      GROUP BY 1
    ),
    b_counts AS (
      SELECT date_trunc('month', COALESCE(submitted_at, created_at)) AS m,
             COUNT(*)::text AS cnt
      FROM bids
      WHERE COALESCE(submitted_at, created_at) >= date_trunc('month', NOW() - INTERVAL '5 months')
      GROUP BY 1
    )
    SELECT
      TO_CHAR(months.m, 'YYYY-MM') AS month,
      COALESCE(t.cnt, '0')         AS tenders,
      COALESCE(b.cnt, '0')         AS bids,
      COALESCE(t.val, '0')         AS value
    FROM months
    LEFT JOIN t_counts t ON t.m = months.m
    LEFT JOIN b_counts b ON b.m = months.m
    ORDER BY months.m ASC
  `);
  return result.rows.map((row) => {
    const [year, mon] = row.month.split("-");
    const label = `Th${parseInt(mon)}/${String(year).slice(2)}`;
    return {
      month:   row.month,
      label,
      tenders: Number(row.tenders),
      bids:    Number(row.bids),
      value:   Number(row.value),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Permissions (Phase 6 — dynamic RBAC)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllRolePermissions(): Promise<Record<string, string[]>> {
  const result = await query<{ role: string; permission: string }>(
    `SELECT role, permission FROM role_permissions ORDER BY role, permission`,
    [],
  );
  const map: Record<string, string[]> = {};
  for (const row of result.rows) {
    if (!map[row.role]) map[row.role] = [];
    map[row.role].push(row.permission);
  }
  return map;
}

export async function setRolePermissions(role: string, permissions: string[]): Promise<void> {
  await withTransaction(async (txQuery) => {
    await txQuery(`DELETE FROM role_permissions WHERE role = $1`, [role]);
    for (const permission of permissions) {
      await txQuery(
        `INSERT INTO role_permissions (role, permission) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [role, permission],
      );
    }
  });
}
