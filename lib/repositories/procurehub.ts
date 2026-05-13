import { query, withTransaction } from "@/lib/db";
import type { AdminActivityLog } from "@/services/activityStorage";
import type { AdminTender } from "@/types/adminTender";
import type { MaterialItem, PurchaseCategory } from "@/types/category";
import type { InternalUser } from "@/types/internalUser";
import type { SupplierAccount } from "@/types/supplierAccount";
import type { SupplierBid } from "@/types/supplierBid";

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
    status: (row.status ?? "Đang mở") as AdminTender["status"],
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

export async function upsertSupplier(account: SupplierAccount): Promise<SupplierAccount> {
  await query(
    `insert into suppliers (
      id, company_name, tax_code, contact_name, email, phone, password,
      profile_completed, status, address, province, website,
      business_description, categories, created_at, updated_at, raw_data
    ) values (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13, $14::jsonb, $15, now(), $16::jsonb
    )
    on conflict (id) do update set
      company_name = excluded.company_name,
      tax_code = excluded.tax_code,
      contact_name = excluded.contact_name,
      email = excluded.email,
      phone = excluded.phone,
      password = excluded.password,
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

export async function listTenders(): Promise<AdminTender[]> {
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

export async function getBid(id: string): Promise<SupplierBid | null> {
  const bids = await listBids();
  return bids.find((bid) => bid.id === id) ?? null;
}

export async function upsertBid(bid: SupplierBid): Promise<SupplierBid> {
  return withTransaction(async (txQuery) => {
    await txQuery(
      `insert into bids (
        id, bid_code, tender_id, tender_code, tender_title, supplier_id,
        supplier_name, supplier_email, supplier_phone, status, submitted_at,
        total_amount, delivery_time, payment_terms, warranty_policy, note,
        created_at, updated_at, raw_data
      ) values (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, now(), $18::jsonb
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
          sort_order, raw_data
        ) values (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13,
          $14, $15::jsonb
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

export async function listActivityLogs(): Promise<AdminActivityLog[]> {
  const result = await query<{
    id: string;
    type: string | null;
    title: string;
    description: string | null;
    entity_type: string | null;
    entity_id: string | null;
    entity_code: string | null;
    actor_name: string | null;
    actor_role: string | null;
    created_at: string | Date | null;
    raw_data: JsonRecord;
  }>("select * from audit_events order by created_at desc limit 100");
  return result.rows.map((row) => ({
    ...(row.raw_data as Partial<AdminActivityLog>),
    id: row.id,
    type: (row.type ?? "system") as AdminActivityLog["type"],
    title: row.title,
    description: row.description ?? undefined,
    entityType: row.entity_type as AdminActivityLog["entityType"],
    entityId: row.entity_id ?? undefined,
    entityCode: row.entity_code ?? undefined,
    actorName: row.actor_name ?? undefined,
    actorRole: row.actor_role ?? undefined,
    createdAt: asIso(row.created_at),
  }));
}

export async function createActivityLog(log: AdminActivityLog): Promise<AdminActivityLog> {
  await query(
    `insert into audit_events (
      id, type, title, description, entity_type, entity_id, entity_code,
      actor_name, actor_role, created_at, raw_data
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
    on conflict (id) do update set raw_data = excluded.raw_data`,
    [
      log.id,
      log.type,
      log.title,
      log.description ?? null,
      log.entityType ?? null,
      log.entityId ?? null,
      log.entityCode ?? null,
      log.actorName ?? null,
      log.actorRole ?? null,
      log.createdAt,
      JSON.stringify(log),
    ],
  );
  return log;
}
