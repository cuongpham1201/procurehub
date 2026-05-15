"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccounts, updateAccount } from "@/services/supplierAccountStorage";
import { normalizePhone } from "@/services/supplierAccountStorage";
import { getBids } from "@/services/supplierBidStorage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { SupplierAccount } from "@/types/supplierAccount";
import type { SupplierBid } from "@/types/supplierBid";

// ── permissions ───────────────────────────────────────────────────────────

function canEditSupplier(role: string) {
  return role === "Admin" || role === "Trưởng phòng vật tư";
}

function canSupplierAction(role: string, key: string): boolean {
  if (role === "Admin" || role === "Trưởng phòng vật tư") return true;
  if (role === "Kế hoạch vật tư") return key === "Yêu cầu bổ sung";
  return false;
}

// ── helpers ───────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case "Đã duyệt":         return "bg-green-100 text-green-700 border-green-200";
    case "Chờ xét duyệt":    return "bg-blue-100 text-blue-700 border-blue-200";
    case "Yêu cầu bổ sung":  return "bg-amber-100 text-amber-700 border-amber-200";
    case "Từ chối":          return "bg-red-100 text-red-700 border-red-200";
    case "Tạm khóa":         return "bg-orange-100 text-orange-700 border-orange-200";
    default:                 return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function bidStatusBadge(status: string) {
  switch (status) {
    case "Được chọn":      return "bg-green-100 text-green-700";
    case "Đang xem xét":   return "bg-blue-100 text-blue-700";
    case "Đã nộp":         return "bg-slate-100 text-slate-600";
    case "Không được chọn": return "bg-red-100 text-red-600";
    default:               return "bg-slate-100 text-slate-500";
  }
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("vi-VN"); } catch { return iso; }
}

function formatCurrency(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + " tỷ ₫";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + " triệu ₫";
  return n.toLocaleString("vi-VN") + " ₫";
}

function shortId(id: string) {
  return "NCC-" + id.slice(-6).toUpperCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── constants ─────────────────────────────────────────────────────────────

const SUPPLIER_CATEGORIES = [
  "Nguyên vật liệu",
  "Máy móc",
  "Thiết bị",
  "Công cụ dụng cụ",
  "Dịch vụ phụ trợ",
];

type ActionKey = "Đã duyệt" | "Yêu cầu bổ sung" | "Từ chối" | "Tạm khóa";

const ACTIONS: { key: ActionKey; label: string; style: string }[] = [
  { key: "Đã duyệt",       label: "Duyệt nhà cung cấp", style: "bg-[#0f2d5e] text-white hover:bg-[#0d2550] disabled:opacity-40" },
  { key: "Yêu cầu bổ sung", label: "Yêu cầu bổ sung",   style: "bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40" },
  { key: "Từ chối",        label: "Từ chối",             style: "border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40" },
  { key: "Tạm khóa",       label: "Tạm khóa",           style: "border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40" },
];

// ── sub-components ────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-3 border-b border-slate-50 last:border-0">
      <dt className="w-44 shrink-0 text-xs font-medium text-slate-400 uppercase tracking-wide mt-0.5">{label}</dt>
      <dd className="text-sm text-slate-800 flex-1">{value || <span className="text-slate-300">—</span>}</dd>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <h3 className="font-semibold text-slate-700 text-sm">{title}</h3>
      </div>
      <dl className="px-5 py-1">{children}</dl>
    </section>
  );
}

// ── edit form types ───────────────────────────────────────────────────────

interface EditForm {
  companyName: string;
  taxCode: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  website: string;
  businessDescription: string;
  categories: string[];
}

function accountToEditForm(a: SupplierAccount): EditForm {
  return {
    companyName: a.companyName,
    taxCode: a.taxCode,
    contactName: a.contactName,
    email: a.email,
    phone: a.phone,
    address: a.address || "",
    province: a.province || "",
    website: a.website || "",
    businessDescription: a.businessDescription || "",
    categories: a.categories ? [...a.categories] : [],
  };
}

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e] bg-white";
const labelCls = "block text-xs font-medium text-slate-500 mb-1";

// ── main component ────────────────────────────────────────────────────────

export default function AdminSupplierDetailPage({ id }: { id: string }) {
  const { user: currentUser } = useCurrentUser();
  const role = currentUser?.role ?? "Chỉ xem";
  const [account, setAccount] = useState<SupplierAccount | null | undefined>(undefined);
  const [bids, setBids] = useState<SupplierBid[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      const [all, allBids] = await Promise.all([getAccounts(), getBids()]);
      const found = all.find((a) => a.id === id) ?? null;
      setAccount(found);
      setBids(allBids.filter((b) => b.supplierId === id));
    }
    loadData();
  }, [id]);

  async function handleAction(newStatus: ActionKey) {
    if (!account) return;
    const oldStatus = account.status || "Chưa xác định";
    const updated: SupplierAccount = { ...account, status: newStatus };
    await updateAccount(updated);
    setAccount(updated);
    setSuccessMsg("Đã cập nhật trạng thái nhà cung cấp.");
    setTimeout(() => setSuccessMsg(""), 4000);
    void oldStatus;
  }

  function startEdit() {
    if (!account) return;
    setForm(accountToEditForm(account));
    setFormErrors({});
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setForm(null);
    setFormErrors({});
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setFormErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  function toggleCategory(cat: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const cats = prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories: cats };
    });
  }

  async function handleSave() {
    if (!form || !account) return;
    const errors: Record<string, string> = {};

    if (!form.companyName.trim()) errors.companyName = "Tên công ty không được rỗng.";
    if (!form.taxCode.trim()) errors.taxCode = "Mã số thuế không được rỗng.";
    if (!form.email.trim()) errors.email = "Email không được rỗng.";
    else if (!isValidEmail(form.email.trim())) errors.email = "Email không hợp lệ.";
    if (!form.phone.trim()) errors.phone = "Số điện thoại không được rỗng.";

    if (!errors.email) {
      const normEmail = form.email.trim().toLowerCase();
      const dup = (await getAccounts()).find(
        (a) => a.id !== id && a.email.trim().toLowerCase() === normEmail
      );
      if (dup) errors.email = "Email đã được sử dụng bởi nhà cung cấp khác.";
    }

    if (!errors.taxCode) {
      const normTax = form.taxCode.trim().replace(/\s/g, "").toLowerCase();
      const dup = (await getAccounts()).find(
        (a) => a.id !== id && a.taxCode.trim().replace(/\s/g, "").toLowerCase() === normTax
      );
      if (dup) errors.taxCode = "Mã số thuế đã tồn tại ở nhà cung cấp khác.";
    }

    if (!errors.phone) {
      const normPhone = normalizePhone(form.phone.trim());
      const dup = (await getAccounts()).find(
        (a) => a.id !== id && normalizePhone(a.phone.trim()) === normPhone
      );
      if (dup) errors.phone = "Số điện thoại đã đăng ký bởi nhà cung cấp khác.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const updated: SupplierAccount = {
      ...account,
      companyName: form.companyName.trim(),
      taxCode: form.taxCode.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      province: form.province.trim(),
      website: form.website.trim(),
      businessDescription: form.businessDescription.trim(),
      categories: form.categories,
    };

    await updateAccount(updated);
    setAccount(updated);


    setIsEditing(false);
    setForm(null);
    setFormErrors({});
    setSuccessMsg("Đã cập nhật thông tin nhà cung cấp.");
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  if (account === undefined) {
    return <div className="py-20 text-center text-sm text-slate-400">Đang tải...</div>;
  }

  if (account === null) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <div className="text-slate-200 mb-4">
          <svg className="w-14 h-14 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-slate-600 font-medium mb-1">Không tìm thấy nhà cung cấp</p>
        <p className="text-sm text-slate-400 mb-6">ID: {id}</p>
        <Link href="/admin/suppliers" className="inline-flex items-center gap-2 text-sm text-[#0f2d5e] font-medium hover:text-[#c9a227] transition-colors">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const canEdit = canEditSupplier(role);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/suppliers" className="hover:text-[#0f2d5e] transition-colors">Nhà cung cấp</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate">{account.companyName}</span>
        {isEditing && <span className="text-amber-600 font-medium">· Đang chỉnh sửa</span>}
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-slate-400">{shortId(account.id)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusBadge(account.status)}`}>
              {account.status}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">{account.companyName}</h2>
          <p className="text-sm text-slate-500 mt-0.5">MST: {account.taxCode} · {account.email}</p>
        </div>
        <div className="text-right shrink-0 text-xs text-slate-400">
          <div>Đăng ký: {formatDate(account.createdAt)}</div>
          <div className="mt-1">
            {account.profileCompleted ? (
              <span className="text-green-600 font-medium">Hồ sơ đã hoàn thiện</span>
            ) : (
              <span className="text-amber-500">Hồ sơ chưa hoàn thiện</span>
            )}
          </div>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left: info / edit form */}
        <div className="lg:col-span-2 space-y-5">
          {isEditing && form ? (
            <>
              {/* Edit: Account info */}
              <section className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-100 bg-amber-50">
                  <h3 className="font-semibold text-slate-700 text-sm">Thông tin tài khoản</h3>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div>
                    <label className={labelCls}>Tên công ty <span className="text-red-500">*</span></label>
                    <input className={inputCls} value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} />
                    {formErrors.companyName && <p className="text-xs text-red-500 mt-1">{formErrors.companyName}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Mã số thuế <span className="text-red-500">*</span></label>
                    <input className={inputCls} value={form.taxCode} onChange={(e) => setField("taxCode", e.target.value)} />
                    {formErrors.taxCode && <p className="text-xs text-red-500 mt-1">{formErrors.taxCode}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Người liên hệ</label>
                    <input className={inputCls} value={form.contactName} onChange={(e) => setField("contactName", e.target.value)} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                      <input className={inputCls} type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
                      {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Số điện thoại <span className="text-red-500">*</span></label>
                      <input className={inputCls} type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                      {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                    </div>
                  </div>
                </div>
              </section>

              {/* Edit: Profile */}
              <section className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-100 bg-amber-50">
                  <h3 className="font-semibold text-slate-700 text-sm">Hồ sơ doanh nghiệp</h3>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div>
                    <label className={labelCls}>Địa chỉ</label>
                    <input className={inputCls} value={form.address} onChange={(e) => setField("address", e.target.value)} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Tỉnh / Thành phố</label>
                      <input className={inputCls} value={form.province} onChange={(e) => setField("province", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Website</label>
                      <input className={inputCls} value={form.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Giới thiệu doanh nghiệp</label>
                    <textarea className={`${inputCls} resize-none`} rows={3} value={form.businessDescription} onChange={(e) => setField("businessDescription", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Nhóm hàng cung cấp</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {SUPPLIER_CATEGORIES.map((cat) => (
                        <label key={cat} className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={form.categories.includes(cat)}
                            onChange={() => toggleCategory(cat)}
                            className="accent-[#0f2d5e]"
                          />
                          <span className="text-sm text-slate-700">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* View: Account info */}
              <SectionCard title="Thông tin tài khoản">
                <InfoRow label="Mã NCC" value={shortId(account.id)} />
                <InfoRow label="Tên công ty" value={account.companyName} />
                <InfoRow label="Mã số thuế" value={account.taxCode} />
                <InfoRow label="Người liên hệ" value={account.contactName} />
                <InfoRow label="Email" value={account.email} />
                <InfoRow label="Số điện thoại" value={account.phone} />
                <InfoRow label="Ngày đăng ký" value={formatDate(account.createdAt)} />
                <InfoRow label="Trạng thái" value={account.status} />
              </SectionCard>

              {/* View: Profile */}
              {account.profileCompleted ? (
                <SectionCard title="Hồ sơ doanh nghiệp">
                  <InfoRow label="Địa chỉ" value={account.address} />
                  <InfoRow label="Tỉnh / Thành phố" value={account.province} />
                  <InfoRow label="Website" value={account.website} />
                  <InfoRow label="Giới thiệu" value={account.businessDescription} />
                  <InfoRow label="Nhóm hàng cung cấp" value={account.categories?.join(", ")} />
                  <InfoRow label="Hotline" value={account.hotline} />
                  <InfoRow label="Email RFQ" value={account.rfqEmail} />
                  <InfoRow label="Đầu mối báo giá" value={account.quotationContact} />
                </SectionCard>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Nhà cung cấp chưa hoàn thiện hồ sơ năng lực.</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Hồ sơ doanh nghiệp chưa được nộp. Yêu cầu nhà cung cấp hoàn thiện trước khi xét duyệt.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Bids history — always visible */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-700 text-sm">
                Lịch sử báo giá
                {bids.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400">({bids.length})</span>}
              </h3>
            </div>
            {bids.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-400 text-center">
                Nhà cung cấp chưa nộp báo giá nào.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Gói thầu</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Giá trị</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Trạng thái</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs hidden sm:table-cell">Ngày nộp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {bids.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 text-xs leading-tight">{b.tenderCode}</div>
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{b.tenderName}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 text-xs whitespace-nowrap">
                          {formatCurrency(b.totalAmount ?? b.totalPrice ?? 0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bidStatusBadge(b.status)}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs hidden sm:table-cell">
                          {formatDate(b.submittedAt ?? b.createdAt ?? "")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">
          {isEditing ? (
            <div className="bg-white rounded-xl border border-amber-200 p-5">
              <h3 className="font-semibold text-slate-700 text-sm mb-4">Lưu thay đổi</h3>
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-[#0f2d5e] text-white hover:bg-[#0d2550] transition-colors"
                >
                  Lưu thay đổi
                </button>
                <button
                  onClick={cancelEdit}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <>
              {canEdit && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-700 text-sm mb-3">Chỉnh sửa</h3>
                  <button
                    onClick={startEdit}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-[#0f2d5e] text-[#0f2d5e] hover:bg-[#0f2d5e] hover:text-white transition-colors"
                  >
                    Chỉnh sửa thông tin NCC
                  </button>
                </div>
              )}
              {!canEdit && (
                <p className="text-xs text-slate-400 text-center px-2">Bạn chỉ có quyền xem thông tin.</p>
              )}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-700 text-sm mb-4">Xét duyệt hồ sơ</h3>
                <div className="space-y-2">
                  {ACTIONS.filter((a) => canSupplierAction(role, a.key)).map((action) => (
                    <button
                      key={action.key}
                      onClick={() => handleAction(action.key)}
                      disabled={account.status === action.key}
                      className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${action.style}`}
                    >
                      {action.label}
                      {account.status === action.key && <span className="ml-2 text-xs opacity-60">(hiện tại)</span>}
                    </button>
                  ))}
                  {ACTIONS.filter((a) => canSupplierAction(role, a.key)).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">Không có quyền thao tác.</p>
                  )}
                </div>
              </div>
            </>
          )}

          <Link
            href="/admin/suppliers"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại danh sách
          </Link>
        </div>
      </div>
    </div>
  );
}
