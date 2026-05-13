import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const inputPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(rootDir, "data", "localstorage-export.json");

const STORAGE_KEYS = {
  supplierAccounts: "procurehub_supplier_accounts",
  supplierProfiles: "procurehub_supplier_profiles",
  legacySuppliers: "procurehub_suppliers",
  adminTenders: "procurehub_admin_tenders",
  supplierBids: "procurehub_supplier_bids",
  adminUsers: "procurehub_admin_users",
  internalUsers: "procurehub_internal_users",
  categories: "procurehub_purchase_categories",
  materials: "procurehub_material_items",
  activityLogs: "procurehub_admin_activity_logs",
};

function parseStoredArray(dump, key) {
  const value = dump[key];
  if (value === undefined || value === null || value === "") return [];
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      console.warn(`Skipping ${key}: value is not valid JSON`);
      return [];
    }
  }
  if (Array.isArray(parsed)) return parsed;
  console.warn(`Skipping ${key}: parsed value is not an array`);
  return [];
}

function cleanText(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function optionalText(...values) {
  const text = cleanText(...values);
  return text || null;
}

function boolValue(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "1", "yes"].includes(value.toLowerCase());
  return Boolean(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isoTimestamp(value) {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function dateOnly(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function rawWithSource(value, sourceKey) {
  return JSON.stringify({ ...value, _importedFromLocalStorageKey: sourceKey });
}

async function upsertSupplier(client, supplier, sourceKey) {
  const id = cleanText(supplier.id, supplier.taxCode, supplier.email, supplier.contactEmail);
  if (!id) return null;

  const account = {
    id,
    companyName: cleanText(supplier.companyName, supplier.name),
    taxCode: cleanText(supplier.taxCode),
    contactName: cleanText(supplier.contactName),
    email: cleanText(supplier.email, supplier.contactEmail),
    phone: cleanText(supplier.phone, supplier.contactPhone),
    password: cleanText(supplier.password),
    profileCompleted: boolValue(
      supplier.profileCompleted ?? supplier.address ?? supplier.businessDescription ?? supplier.businessField,
    ),
    status: cleanText(supplier.status, "Hoạt động"),
    address: optionalText(supplier.address),
    province: optionalText(supplier.province),
    website: optionalText(supplier.website),
    businessDescription: optionalText(supplier.businessDescription, supplier.businessField),
    categories: asArray(supplier.categories),
    createdAt: isoTimestamp(supplier.createdAt),
  };

  await client.query(
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
      account.companyName || "Nha cung cap",
      account.taxCode || null,
      account.contactName || null,
      account.email || null,
      account.phone || null,
      account.password || null,
      account.profileCompleted,
      account.status,
      account.address,
      account.province,
      account.website,
      account.businessDescription,
      JSON.stringify(account.categories),
      account.createdAt,
      rawWithSource({ ...supplier, ...account }, sourceKey),
    ],
  );
  return account.id;
}

async function upsertInternalUser(client, user, sourceKey) {
  const id = cleanText(user.id, user.email);
  if (!id) return null;
  const fullName = cleanText(user.fullName, user.name, user.email, "Internal user");
  await client.query(
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
      id,
      fullName,
      optionalText(user.email),
      optionalText(user.password),
      optionalText(user.role),
      optionalText(user.department),
      cleanText(user.status, "Hoạt động"),
      isoTimestamp(user.createdAt),
      rawWithSource({ ...user, id, fullName }, sourceKey),
    ],
  );
  return id;
}

async function upsertCategory(client, category, sourceKey) {
  const id = cleanText(category.id, category.code, category.name);
  if (!id) return null;
  await client.query(
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
      id,
      optionalText(category.code),
      cleanText(category.name, category.code, "Nhom mua sam"),
      optionalText(category.description),
      cleanText(category.status, "Hoạt động"),
      isoTimestamp(category.createdAt),
      rawWithSource({ ...category, id }, sourceKey),
    ],
  );
  return id;
}

async function upsertMaterial(client, material, sourceKey, categoryIds) {
  const id = cleanText(material.id, material.materialCode, material.materialName);
  if (!id) return null;
  const categoryId = cleanText(material.categoryId);
  await client.query(
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
      id,
      categoryIds.has(categoryId) ? categoryId : null,
      optionalText(material.categoryName),
      optionalText(material.materialCode),
      cleanText(material.materialName, material.name, "Vat tu"),
      optionalText(material.specification, material.spec),
      optionalText(material.unit),
      optionalText(material.description),
      cleanText(material.status, "Hoạt động"),
      isoTimestamp(material.createdAt),
      rawWithSource({ ...material, id }, sourceKey),
    ],
  );
  return id;
}

function normalizeTenderItem(item, tenderId, index) {
  return {
    id: cleanText(item.id, item.materialId, `${tenderId}-item-${index + 1}`),
    materialId: optionalText(item.materialId),
    materialCode: optionalText(item.materialCode),
    itemName: cleanText(item.itemName, item.name, "Hang muc"),
    specification: optionalText(item.specification, item.spec),
    quantity: asNumber(item.quantity),
    unit: optionalText(item.unit),
    note: optionalText(item.note),
    raw: item,
  };
}

async function upsertTender(client, tender, sourceKey) {
  const id = cleanText(tender.id, tender.code);
  if (!id) return null;
  const title = cleanText(tender.title, tender.name, "Goi thau");
  const documentRequirements = asArray(tender.documentRequirements).length
    ? asArray(tender.documentRequirements)
    : asArray(tender.commercialTerms?.quotationRequirements);

  await client.query(
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
      id,
      optionalText(tender.code),
      title,
      optionalText(tender.category),
      cleanText(tender.status, "Đang mở"),
      dateOnly(tender.deadline),
      asNumber(tender.estimatedValue ?? tender.value),
      optionalText(tender.description),
      optionalText(tender.deliveryLocation, tender.commercialTerms?.deliveryLocation),
      optionalText(tender.deliveryTime, tender.commercialTerms?.deliveryTime),
      optionalText(tender.paymentTerms, tender.commercialTerms?.paymentTerms),
      JSON.stringify(documentRequirements),
      isoTimestamp(tender.createdAt),
      rawWithSource({ ...tender, id, title }, sourceKey),
    ],
  );

  await client.query("delete from tender_items where tender_id = $1", [id]);
  for (const [index, rawItem] of asArray(tender.items).entries()) {
    const item = normalizeTenderItem(rawItem, id, index);
    await client.query(
      `insert into tender_items (
        id, tender_id, material_id, material_code, item_name, specification,
        quantity, unit, note, sort_order, raw_data
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)`,
      [
        item.id,
        id,
        item.materialId,
        item.materialCode,
        item.itemName,
        item.specification,
        item.quantity,
        item.unit,
        item.note,
        index,
        rawWithSource(item.raw, sourceKey),
      ],
    );
  }

  return id;
}

function normalizeBidItem(item, bidId, index) {
  return {
    id: cleanText(item.id, `${bidId}-item-${index + 1}`),
    tenderItemId: optionalText(item.tenderItemId),
    itemName: cleanText(item.itemName, item.name, "Dong bao gia"),
    specification: optionalText(item.specification, item.spec),
    quantity: asNumber(item.quantity),
    unit: optionalText(item.unit),
    unitPrice: asNumber(item.unitPrice),
    amount: asNumber(item.amount ?? asNumber(item.quantity) * asNumber(item.unitPrice)),
    brand: optionalText(item.brand),
    origin: optionalText(item.origin),
    deliveryTime: optionalText(item.deliveryTime),
    note: optionalText(item.note),
    raw: item,
  };
}

async function upsertBid(client, bid, sourceKey, supplierIds, tenderIds) {
  const id = cleanText(bid.id, bid.bidCode);
  if (!id) return null;
  const supplierId = cleanText(bid.supplierId);
  const tenderId = cleanText(bid.tenderId);
  const totalAmount = asNumber(bid.totalAmount ?? bid.totalPrice ?? bid.priceBeforeVat);

  await client.query(
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
      id,
      optionalText(bid.bidCode),
      tenderIds.has(tenderId) ? tenderId : null,
      optionalText(bid.tenderCode),
      optionalText(bid.tenderTitle, bid.tenderName),
      supplierIds.has(supplierId) ? supplierId : null,
      optionalText(bid.supplierName),
      optionalText(bid.supplierEmail),
      optionalText(bid.supplierPhone),
      cleanText(bid.status, "Đã nộp"),
      isoTimestamp(bid.submittedAt ?? bid.createdAt),
      totalAmount,
      optionalText(bid.deliveryTime),
      optionalText(bid.paymentTerms),
      optionalText(bid.warrantyPolicy),
      optionalText(bid.note, bid.technicalNote),
      isoTimestamp(bid.createdAt ?? bid.submittedAt),
      rawWithSource({ ...bid, id }, sourceKey),
    ],
  );

  await client.query("delete from bid_items where bid_id = $1", [id]);
  for (const [index, rawItem] of asArray(bid.items).entries()) {
    const item = normalizeBidItem(rawItem, id, index);
    await client.query(
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
        id,
        item.tenderItemId,
        item.itemName,
        item.specification,
        item.quantity,
        item.unit,
        item.unitPrice,
        item.amount,
        item.brand,
        item.origin,
        item.deliveryTime,
        item.note,
        index,
        rawWithSource(item.raw, sourceKey),
      ],
    );
  }

  return id;
}

async function upsertActivityLog(client, log, sourceKey) {
  const id = cleanText(log.id, `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await client.query(
    `insert into audit_events (
      id, type, title, description, entity_type, entity_id, entity_code,
      actor_name, actor_role, created_at, raw_data
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
    on conflict (id) do update set
      type = excluded.type,
      title = excluded.title,
      description = excluded.description,
      entity_type = excluded.entity_type,
      entity_id = excluded.entity_id,
      entity_code = excluded.entity_code,
      actor_name = excluded.actor_name,
      actor_role = excluded.actor_role,
      raw_data = excluded.raw_data`,
    [
      id,
      optionalText(log.type),
      cleanText(log.title, "Activity"),
      optionalText(log.description),
      optionalText(log.entityType),
      optionalText(log.entityId),
      optionalText(log.entityCode),
      optionalText(log.actorName),
      optionalText(log.actorRole),
      isoTimestamp(log.createdAt),
      rawWithSource({ ...log, id }, sourceKey),
    ],
  );
  return id;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const raw = await fs.readFile(inputPath, "utf8");
  const dump = JSON.parse(raw);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  const counts = {
    suppliers: 0,
    internalUsers: 0,
    categories: 0,
    materials: 0,
    tenders: 0,
    bids: 0,
    activityLogs: 0,
  };

  try {
    await client.query("begin");

    const supplierIds = new Set();
    for (const key of [STORAGE_KEYS.legacySuppliers, STORAGE_KEYS.supplierProfiles, STORAGE_KEYS.supplierAccounts]) {
      for (const item of parseStoredArray(dump, key)) {
        const id = await upsertSupplier(client, item, key);
        if (id) {
          supplierIds.add(id);
          counts.suppliers += 1;
        }
      }
    }

    for (const key of [STORAGE_KEYS.internalUsers, STORAGE_KEYS.adminUsers]) {
      for (const item of parseStoredArray(dump, key)) {
        if (await upsertInternalUser(client, item, key)) counts.internalUsers += 1;
      }
    }

    const categoryIds = new Set();
    for (const item of parseStoredArray(dump, STORAGE_KEYS.categories)) {
      const id = await upsertCategory(client, item, STORAGE_KEYS.categories);
      if (id) {
        categoryIds.add(id);
        counts.categories += 1;
      }
    }

    for (const item of parseStoredArray(dump, STORAGE_KEYS.materials)) {
      if (await upsertMaterial(client, item, STORAGE_KEYS.materials, categoryIds)) counts.materials += 1;
    }

    const tenderIds = new Set();
    for (const item of parseStoredArray(dump, STORAGE_KEYS.adminTenders)) {
      const id = await upsertTender(client, item, STORAGE_KEYS.adminTenders);
      if (id) {
        tenderIds.add(id);
        counts.tenders += 1;
      }
    }

    for (const item of parseStoredArray(dump, STORAGE_KEYS.supplierBids)) {
      if (await upsertBid(client, item, STORAGE_KEYS.supplierBids, supplierIds, tenderIds)) counts.bids += 1;
    }

    for (const item of parseStoredArray(dump, STORAGE_KEYS.activityLogs)) {
      if (await upsertActivityLog(client, item, STORAGE_KEYS.activityLogs)) counts.activityLogs += 1;
    }

    await client.query("commit");
    console.log("Import complete:", counts);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
