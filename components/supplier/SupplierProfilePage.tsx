"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getCurrentSession,
  updateAccount,
  setCurrentSession,
} from "@/services/supplierAccountStorage";
import type { SupplierAccount } from "@/types/supplierAccount";

// ── icons ──────────────────────────────────────────────────────────────────
function IconFile() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

// ── data ───────────────────────────────────────────────────────────────────
const PROVINCES = [
  "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Quảng Ninh",
  "Bình Dương", "Đồng Nai", "Bà Rịa - Vũng Tàu", "Cần Thơ", "An Giang",
  "Hưng Yên", "Hải Dương", "Bắc Ninh", "Vĩnh Phúc", "Thái Nguyên",
  "Lào Cai", "Nghệ An", "Thanh Hóa", "Huế", "Khánh Hòa", "Lâm Đồng",
  "Tỉnh thành khác",
];

const CATEGORIES = [
  "Nguyên vật liệu",
  "Máy móc",
  "Thiết bị",
  "Công cụ dụng cụ",
  "Dịch vụ phụ trợ",
];

const ATTACH_DOCS = [
  { key: "license", label: "Giấy phép kinh doanh" },
  { key: "profile", label: "Hồ sơ năng lực" },
  { key: "cert", label: "Chứng chỉ" },
  { key: "finance", label: "Báo cáo tài chính" },
];

interface ProfileForm {
  address: string;
  province: string;
  website: string;
  businessDescription: string;
  categories: string[];
  hotline: string;
  rfqEmail: string;
  quotationContact: string;
}
type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;

function inputCls(err?: string) {
  return [
    "w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors",
    "focus:ring-2 focus:ring-[#0f2d5e]/20",
    err
      ? "border-red-400 bg-red-50 focus:border-red-400"
      : "border-slate-200 bg-white focus:border-[#0f2d5e]",
  ].join(" ");
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1.5">{msg}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
      {children}
    </p>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export default function SupplierProfilePage() {
  const router = useRouter();
  const [account, setAccount] = useState<SupplierAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});

  const [form, setForm] = useState<ProfileForm>({
    address: "",
    province: "",
    website: "",
    businessDescription: "",
    categories: [],
    hotline: "",
    rfqEmail: "",
    quotationContact: "",
  });

  useEffect(() => {
    const session = getCurrentSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setAccount(session);
    // Pre-fill from existing profile data
    setForm({
      address: session.address ?? "",
      province: session.province ?? "",
      website: session.website ?? "",
      businessDescription: session.businessDescription ?? "",
      categories: session.categories ?? [],
      hotline: session.hotline ?? "",
      rfqEmail: session.rfqEmail ?? "",
      quotationContact: session.quotationContact ?? "",
    });
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Đang tải...</p>
      </div>
    );
  }

  if (!account) return null;

  function setField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaved(false);
  }

  function toggleCategory(cat: string) {
    setForm((prev) => {
      const has = prev.categories.includes(cat);
      return {
        ...prev,
        categories: has
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
    setErrors((prev) => ({ ...prev, categories: undefined }));
    setSaved(false);
  }

  function validate(): ProfileErrors {
    const e: ProfileErrors = {};
    if (!form.address.trim()) e.address = "Vui lòng nhập địa chỉ trụ sở.";
    if (!form.province) e.province = "Vui lòng chọn tỉnh/thành phố.";
    if (!form.businessDescription.trim())
      e.businessDescription = "Vui lòng mô tả ngắn về doanh nghiệp.";
    if (form.categories.length === 0)
      e.categories = "Vui lòng chọn ít nhất một nhóm hàng.";
    return e;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!account) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const updated: SupplierAccount = {
      ...account,
      ...form,
      profileCompleted: true,
      status: "Chờ xét duyệt",
    };
    await updateAccount(updated);
    setCurrentSession(updated);
    setAccount(updated);
    setSaved(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#0f2d5e] text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Bia Hạ Long <span className="text-[#c9a227]">Procurement</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70 hidden sm:block">
              {account.companyName}
            </span>
            <span
              className={[
                "text-xs px-2.5 py-1 rounded-full font-medium",
                account.profileCompleted
                  ? "bg-green-500/20 text-green-300"
                  : "bg-amber-500/20 text-amber-300",
              ].join(" ")}
            >
              {account.status}
            </span>
            <Link
              href="/supplier/dashboard"
              className="text-xs text-white/70 hover:text-white transition-colors border border-white/30 px-2.5 py-1 rounded-lg"
            >
              ← Quay lại portal
            </Link>
            <Link
              href="/"
              className="text-xs text-white/50 hover:text-white/80 transition-colors border border-white/20 px-2.5 py-1 rounded-lg"
            >
              Trang chủ
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0f2d5e]">Hồ sơ nhà cung cấp</h1>
          <p className="text-sm text-slate-500 mt-1">
            Hoàn thiện thông tin để được xét duyệt và nhận yêu cầu báo giá.
          </p>
        </div>

        {/* Success banner */}
        {saved && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-6 text-sm">
            <span className="text-green-600"><IconCheck /></span>
            <div>
              <p className="font-semibold">Hồ sơ đã được lưu thành công!</p>
              <p className="text-xs text-green-600 mt-0.5">
                Trạng thái: Chờ xét duyệt. Bia Hạ Long sẽ liên hệ trong 1–3 ngày làm việc.
              </p>
            </div>
            <Link
              href="/tenders"
              className="ml-auto shrink-0 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Xem gói thầu
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
            {/* 1. Business info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <SectionTitle>1. Thông tin doanh nghiệp</SectionTitle>
              <div className="space-y-4">
                {/* Read-only from account */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên công ty</label>
                    <input type="text" value={account.companyName} readOnly
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-100 bg-slate-50 text-sm text-slate-500 cursor-default" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mã số thuế</label>
                    <input type="text" value={account.taxCode} readOnly
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-100 bg-slate-50 text-sm text-slate-500 cursor-default" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Địa chỉ trụ sở <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    placeholder="Số nhà, đường, phường/xã..."
                    className={inputCls(errors.address)}
                  />
                  <FieldError msg={errors.address} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Tỉnh/Thành phố <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.province}
                      onChange={(e) => setField("province", e.target.value)}
                      className={inputCls(errors.province)}
                    >
                      <option value="">Chọn tỉnh/thành phố</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <FieldError msg={errors.province} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => setField("website", e.target.value)}
                      placeholder="https://congty.vn"
                      className={inputCls()}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Giới thiệu doanh nghiệp <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.businessDescription}
                    onChange={(e) => setField("businessDescription", e.target.value)}
                    rows={3}
                    placeholder="Mô tả ngắn về lĩnh vực kinh doanh, sản phẩm/dịch vụ chính..."
                    className={inputCls(errors.businessDescription)}
                  />
                  <FieldError msg={errors.businessDescription} />
                </div>
              </div>
            </div>

            {/* 2. Categories */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <SectionTitle>2. Nhóm hàng cung cấp</SectionTitle>
              <p className="text-sm text-slate-500 mb-4">
                Chọn các nhóm hàng mà doanh nghiệp có khả năng cung cấp.{" "}
                <span className="text-red-500">*</span>
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => {
                  const checked = form.categories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={[
                        "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors select-none",
                        checked
                          ? "border-[#0f2d5e] bg-[#0f2d5e]/5 text-[#0f2d5e]"
                          : "border-slate-200 hover:border-slate-300 text-slate-700",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(cat)}
                        className="w-4 h-4 accent-[#0f2d5e]"
                      />
                      <span className="text-sm font-medium">{cat}</span>
                    </label>
                  );
                })}
              </div>
              <FieldError msg={errors.categories} />
            </div>

            {/* 3. Documents (UI only) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <SectionTitle>3. Hồ sơ năng lực</SectionTitle>
              <p className="text-sm text-slate-500 mb-4">
                Tải lên các tài liệu sau để hoàn thiện hồ sơ. (Chức năng demo — không upload thật)
              </p>
              <div className="space-y-3">
                {ATTACH_DOCS.map((doc) => (
                  <div
                    key={doc.key}
                    className="flex items-center gap-4 border border-dashed border-slate-200 rounded-xl p-4 hover:border-[#0f2d5e]/40 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50 group-hover:bg-[#0f2d5e]/5 transition-colors text-slate-400">
                      <IconFile />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">{doc.label}</p>
                      <p className="text-xs text-slate-400">PDF, DOCX, XLSX — tối đa 10MB</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconUpload />
                      <span className="text-xs text-slate-400 hidden sm:block">Chọn file</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Additional contact */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <SectionTitle>4. Thông tin liên hệ bổ sung</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Hotline</label>
                  <input
                    type="tel"
                    value={form.hotline}
                    onChange={(e) => setField("hotline", e.target.value)}
                    placeholder="0901 234 567"
                    className={inputCls()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email nhận RFQ</label>
                  <input
                    type="email"
                    value={form.rfqEmail}
                    onChange={(e) => setField("rfqEmail", e.target.value)}
                    placeholder="rfq@congty.vn"
                    className={inputCls()}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Người phụ trách báo giá
                  </label>
                  <input
                    type="text"
                    value={form.quotationContact}
                    onChange={(e) => setField("quotationContact", e.target.value)}
                    placeholder="Họ tên, chức vụ"
                    className={inputCls()}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 bg-[#c9a227] hover:bg-[#b8960c] text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                {account.profileCompleted ? "Cập nhật hồ sơ" : "Hoàn thiện hồ sơ"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 border border-[#0f2d5e] text-[#0f2d5e] hover:bg-[#0f2d5e]/5 font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Lưu hồ sơ
              </button>
            </div>
          </form>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Account summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 mb-4 text-sm">Thông tin tài khoản</h3>
              <div className="space-y-3">
                {[
                  ["Mã tài khoản", account.id],
                  ["Người liên hệ", account.contactName],
                  ["Email", account.email],
                  ["Điện thoại", account.phone],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Completion checklist */}
            <div className="bg-[#0f2d5e] text-white rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-[#c9a227] text-sm">Tiến độ hồ sơ</h3>
              <ul className="space-y-3">
                {[
                  ["Tạo tài khoản", true],
                  ["Địa chỉ & tỉnh/thành", !!form.address && !!form.province],
                  ["Giới thiệu doanh nghiệp", !!form.businessDescription],
                  ["Nhóm hàng cung cấp", form.categories.length > 0],
                  ["Hồ sơ năng lực", false],
                ].map(([label, done]) => (
                  <li key={label as string} className="flex items-center gap-3 text-sm">
                    <span
                      className={[
                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                        done ? "bg-green-500 text-white" : "border-2 border-white/30",
                      ].join(" ")}
                    >
                      {done && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className={done ? "text-white" : "text-white/50"}>{label as string}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 mb-3 text-sm">Cần hỗ trợ?</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-medium">Hotline:</span>{" "}<span className="text-[#0f2d5e]">1800 1234</span></p>
                <p><span className="font-medium">Email:</span>{" "}<span className="text-[#0f2d5e]">ncc@biahalong.vn</span></p>
                <p className="text-xs text-slate-400 pt-1">Thứ 2 – Thứ 6, 8:00–17:30</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
