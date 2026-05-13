"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { saveSupplier, isTaxCodeExists } from "@/services/supplierStorage";
import type { Supplier } from "@/types/supplier";

// ─── Local types ──────────────────────────────────────────────────────────────

type FormData = {
  companyName: string;
  taxCode: string;
  address: string;
  province: string;
  website: string;
  businessField: string;
  contactName: string;
  contactPosition: string;
  contactEmail: string;
  contactPhone: string;
  categories: string[];
  agreed: boolean;
};

type FormErrors = {
  companyName?: string;
  taxCode?: string;
  address?: string;
  province?: string;
  businessField?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  categories?: string;
  agreed?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPPLY_CATEGORIES = [
  "Nguyên vật liệu",
  "Máy móc",
  "Thiết bị",
  "Công cụ dụng cụ",
  "Dịch vụ phụ trợ",
];

const PROVINCES = [
  "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
  "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
  "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông",
  "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang",
  "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang", "Hòa Bình",
  "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu",
  "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định",
  "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên",
  "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị",
  "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên",
  "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang",
  "Vĩnh Long", "Vĩnh Phúc", "Yên Bái",
];

const ATTACH_DOCS = [
  { key: "license",     label: "Giấy phép đăng ký kinh doanh",              required: true,  hint: "Bản sao công chứng, còn hiệu lực" },
  { key: "capability",  label: "Hồ sơ năng lực doanh nghiệp",               required: true,  hint: "Giới thiệu công ty, danh mục sản phẩm/dịch vụ" },
  { key: "certificate", label: "Chứng chỉ / Chứng nhận",                    required: false, hint: "ISO, HACCP, CE hoặc chứng nhận liên quan nếu có" },
  { key: "finance",     label: "Báo cáo tài chính hoặc tài liệu tham khảo", required: false, hint: "BCTC năm gần nhất hoặc thư giới thiệu từ đối tác" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FORM: FormData = {
  companyName: "", taxCode: "", address: "", province: "", website: "",
  businessField: "", contactName: "", contactPosition: "", contactEmail: "",
  contactPhone: "", categories: [], agreed: false,
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconUpload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function IconAlertCircle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  );
}

function IconCheck({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  );
}

// ─── Input helpers ────────────────────────────────────────────────────────────

const baseCls =
  "w-full px-3 py-2.5 text-sm text-slate-800 border rounded-lg outline-none transition-colors placeholder-slate-400 bg-white";

function inputCls(err?: string) {
  return err
    ? `${baseCls} border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100`
    : `${baseCls} border-slate-300 focus:border-[#0f2d5e] focus:ring-2 focus:ring-[#0f2d5e]/10`;
}

const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1.5">{msg}</p>;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Page header ─────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/">
              <Image src="/images/logo-bia-ha-long.png" alt="Bia Hạ Long" width={160} height={48} className="h-10 w-auto object-contain" priority />
            </Link>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <span className="hidden sm:block text-sm font-medium text-slate-500 leading-tight">
              Cổng đấu thầu<br />
              <span className="text-xs text-slate-400">Mua sắm nhà cung cấp</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: "Trang chủ", href: "/" },
              { label: "Gói thầu", href: "/tenders" },
              { label: "Hướng dẫn", href: "/guide" },
              { label: "Nhà cung cấp", href: "#", active: true },
              { label: "Liên hệ", href: "#" },
            ].map((item) => (
              <Link key={item.label} href={item.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${item.active ? "text-[#0f2d5e] bg-slate-100 font-semibold" : "text-slate-600 hover:text-[#0f2d5e] hover:bg-slate-50"}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="#" className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
              Đăng nhập
            </Link>
            <Link href="/supplier/register" className="inline-flex items-center px-4 py-2 text-sm font-semibold text-[#0f2d5e] bg-[#c9a227] rounded-md hover:bg-[#b8960c] transition-colors">
              Đăng ký nhà cung cấp
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function GuideSidebar() {
  const steps = [
    { step: "01", title: "Gửi hồ sơ đăng ký", desc: "Điền đầy đủ thông tin và đính kèm hồ sơ năng lực qua hệ thống." },
    { step: "02", title: "Xem xét ban đầu", desc: "Phòng mua sắm kiểm tra tính đầy đủ trong vòng 3–5 ngày làm việc." },
    { step: "03", title: "Đánh giá năng lực", desc: "Phỏng vấn hoặc khảo sát thực tế nếu cần (áp dụng nhà cung cấp mới)." },
    { step: "04", title: "Thông báo kết quả", desc: "Kết quả xét duyệt được gửi qua email đăng ký." },
    { step: "05", title: "Ký hợp đồng khung", desc: "Nhà cung cấp đạt yêu cầu được mời ký hợp đồng khung và cấp tài khoản hệ thống." },
  ];
  const docList = [
    "Giấy phép đăng ký kinh doanh (bản sao công chứng còn hiệu lực)",
    "Hồ sơ năng lực: giới thiệu công ty, danh mục hàng hóa/dịch vụ",
    "Báo cáo tài chính năm gần nhất",
    "Chứng chỉ chất lượng ISO, HACCP, CE… (nếu có)",
    "Danh sách dự án/hợp đồng tham chiếu (tối thiểu 3)",
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-700">Quy trình xét duyệt</h3>
        </div>
        <div className="p-5">
          <div className="relative">
            {steps.map((s, i) => (
              <div key={s.step} className="flex gap-3 pb-5 last:pb-0 relative">
                {i < steps.length - 1 && <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-100" />}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0f2d5e]/8 border border-[#0f2d5e]/15 flex items-center justify-center z-10">
                  <span className="text-[10px] font-bold text-[#0f2d5e]">{s.step}</span>
                </div>
                <div className="pt-0.5">
                  <div className="text-xs font-semibold text-slate-700 mb-0.5">{s.title}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-700">Hồ sơ cần chuẩn bị</h3>
        </div>
        <div className="p-5">
          <ul className="space-y-2.5">
            {docList.map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 bg-[#c9a227]/20 rounded-full flex items-center justify-center text-[#c9a227]">
                  <IconCheck size={9} />
                </span>
                {doc}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bg-[#0f2d5e] rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <IconInfo />
          <h3 className="text-sm font-semibold">Cần hỗ trợ?</h3>
        </div>
        <div className="space-y-2 text-xs text-white/75">
          <div className="flex items-start gap-2"><span className="text-[#c9a227] mt-0.5">✉</span><span>procurement@biahalong.com.vn</span></div>
          <div className="flex items-start gap-2"><span className="text-[#c9a227] mt-0.5">☎</span><span>(0203) 383 4567 – Phòng Mua sắm</span></div>
          <div className="flex items-start gap-2"><span className="text-[#c9a227] mt-0.5">◷</span><span>Thứ 2 – Thứ 6, 08:00 – 17:00</span></div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/15 text-xs text-white/50">
          Thời gian phản hồi hồ sơ thường không quá 5 ngày làm việc.
        </div>
      </div>
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState({ supplierId, onReset }: { supplierId: string; onReset: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 text-green-500">
        <IconCheckCircle />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Hồ sơ đã được ghi nhận</h2>
      <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto mb-5">
        Hồ sơ đăng ký nhà cung cấp đã được lưu ở chế độ demo.
      </p>

      {/* Supplier ID + status */}
      <div className="inline-flex flex-col items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-8 py-5 mb-5">
        <div className="text-xs text-slate-400">Mã hồ sơ đăng ký</div>
        <div className="text-xl font-bold text-[#0f2d5e] font-mono tracking-wide">{supplierId}</div>
        <span className="text-xs font-semibold px-3 py-1 bg-orange-100 text-orange-700 rounded-full border border-orange-200">
          Chờ xét duyệt
        </span>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto mb-8 px-4 py-3 bg-amber-50 rounded-lg border border-amber-100">
        Thông tin đã được lưu vào hệ thống và sẽ hiển thị trong màn quản trị nhà cung cấp.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/tenders"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0f2d5e] rounded-lg hover:bg-[#0a1e3d] transition-colors"
        >
          Xem gói thầu đang mở
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Đăng ký nhà cung cấp khác
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function validate(form: FormData): FormErrors {
  const e: FormErrors = {};
  if (!form.companyName.trim())    e.companyName    = "Vui lòng nhập tên công ty.";
  if (!form.taxCode.trim())        e.taxCode        = "Vui lòng nhập mã số thuế.";
  if (!form.address.trim())        e.address        = "Vui lòng nhập địa chỉ trụ sở.";
  if (!form.province)              e.province       = "Vui lòng chọn tỉnh/thành phố.";
  if (!form.businessField.trim())  e.businessField  = "Vui lòng mô tả lĩnh vực cung cấp chính.";
  if (!form.contactName.trim())    e.contactName    = "Vui lòng nhập họ và tên người liên hệ.";
  if (!form.contactEmail.trim())   e.contactEmail   = "Vui lòng nhập địa chỉ email.";
  else if (!EMAIL_RE.test(form.contactEmail)) e.contactEmail = "Địa chỉ email không hợp lệ.";
  if (!form.contactPhone.trim())   e.contactPhone   = "Vui lòng nhập số điện thoại.";
  if (form.categories.length === 0) e.categories   = "Vui lòng chọn ít nhất một nhóm hàng cung cấp.";
  if (!form.agreed)                e.agreed         = "Vui lòng xác nhận cam kết trước khi gửi.";
  return e;
}

export default function SupplierRegisterPage() {
  const [form, setForm]           = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors]       = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [savedId, setSavedId]     = useState("");

  const set = (field: keyof FormData, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === "taxCode") setGlobalError("");
  };

  const toggleCategory = (cat: string) => {
    const next = form.categories.includes(cat)
      ? form.categories.filter((c) => c !== cat)
      : [...form.categories, cat];
    set("categories", next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");

    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (await isTaxCodeExists(form.taxCode)) {
      setGlobalError("Mã số thuế này đã được đăng ký trong hệ thống demo.");
      setErrors((prev) => ({ ...prev, taxCode: "Mã số thuế đã tồn tại." }));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const id = `SUP-${Date.now()}`;
    const supplier: Supplier = {
      id,
      companyName:     form.companyName.trim(),
      taxCode:         form.taxCode.trim(),
      address:         form.address.trim(),
      province:        form.province,
      website:         form.website.trim(),
      businessField:   form.businessField.trim(),
      contactName:     form.contactName.trim(),
      contactPosition: form.contactPosition.trim(),
      contactEmail:    form.contactEmail.trim(),
      contactPhone:    form.contactPhone.trim(),
      categories:      form.categories,
      attachments:     ATTACH_DOCS.map((d) => d.label),
      status:          "Chờ xét duyệt",
      createdAt:       new Date().toISOString(),
    };

    await saveSupplier(supplier);
    setSavedId(id);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setGlobalError("");
    setSavedId("");
    setSubmitted(false);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader />

      {/* Page intro */}
      <div className="bg-white border-b border-slate-100 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <Link href="/" className="hover:text-slate-600 transition-colors">Trang chủ</Link>
            <span>›</span>
            <span className="text-slate-600 font-medium">Đăng ký nhà cung cấp</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f2d5e] mb-1">Đăng ký nhà cung cấp</h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Gửi thông tin doanh nghiệp để tham gia hệ thống đấu thầu và mua sắm của Bia Hạ Long.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="lg:grid lg:grid-cols-3 lg:gap-7">

          {/* Form column */}
          <div className="lg:col-span-2">
            {submitted ? (
              <SuccessState supplierId={savedId} onReset={reset} />
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

                {/* Global error banner */}
                {globalError && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <span className="flex-shrink-0 mt-0.5"><IconAlertCircle /></span>
                    <span>{globalError}</span>
                  </div>
                )}

                {/* Validation summary banner */}
                {hasErrors && !globalError && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <span className="flex-shrink-0 mt-0.5"><IconAlertCircle /></span>
                    <span>Vui lòng điền đầy đủ các trường bắt buộc (đánh dấu <strong>*</strong>) trước khi gửi.</span>
                  </div>
                )}

                {/* ── 1. Thông tin doanh nghiệp ── */}
                <FormSection title="Thông tin doanh nghiệp">
                  <div className="grid gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Tên công ty <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="Công ty TNHH / Cổ phần..."
                          value={form.companyName} onChange={(e) => set("companyName", e.target.value)}
                          className={inputCls(errors.companyName)} />
                        <FieldError msg={errors.companyName} />
                      </div>
                      <div>
                        <label className={labelCls}>Mã số thuế <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="0123456789"
                          value={form.taxCode} onChange={(e) => set("taxCode", e.target.value)}
                          className={inputCls(errors.taxCode)} />
                        <FieldError msg={errors.taxCode} />
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Địa chỉ trụ sở <span className="text-red-500">*</span></label>
                      <textarea rows={2} placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                        value={form.address} onChange={(e) => set("address", e.target.value)}
                        className={`${inputCls(errors.address)} resize-none`} />
                      <FieldError msg={errors.address} />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Tỉnh / Thành phố <span className="text-red-500">*</span></label>
                        <select value={form.province} onChange={(e) => set("province", e.target.value)}
                          className={`${inputCls(errors.province)} cursor-pointer`}>
                          <option value="">-- Chọn tỉnh/thành --</option>
                          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <FieldError msg={errors.province} />
                      </div>
                      <div>
                        <label className={labelCls}>Website <span className="text-slate-400 font-normal text-xs">(nếu có)</span></label>
                        <input type="url" placeholder="https://congty.com.vn"
                          value={form.website} onChange={(e) => set("website", e.target.value)}
                          className={inputCls()} />
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Lĩnh vực cung cấp chính <span className="text-red-500">*</span></label>
                      <textarea rows={2} placeholder="Mô tả ngắn về hàng hóa, dịch vụ hoặc nhóm ngành mà doanh nghiệp cung cấp..."
                        value={form.businessField} onChange={(e) => set("businessField", e.target.value)}
                        className={`${inputCls(errors.businessField)} resize-none`} />
                      <FieldError msg={errors.businessField} />
                    </div>
                  </div>
                </FormSection>

                {/* ── 2. Người liên hệ ── */}
                <FormSection title="Người liên hệ">
                  <div className="grid gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Họ và tên <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="Nguyễn Văn A"
                          value={form.contactName} onChange={(e) => set("contactName", e.target.value)}
                          className={inputCls(errors.contactName)} />
                        <FieldError msg={errors.contactName} />
                      </div>
                      <div>
                        <label className={labelCls}>Chức vụ</label>
                        <input type="text" placeholder="Giám đốc kinh doanh / Trưởng phòng..."
                          value={form.contactPosition} onChange={(e) => set("contactPosition", e.target.value)}
                          className={inputCls()} />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                        <input type="email" placeholder="lienhe@congty.com.vn"
                          value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)}
                          className={inputCls(errors.contactEmail)} />
                        <FieldError msg={errors.contactEmail} />
                      </div>
                      <div>
                        <label className={labelCls}>Số điện thoại <span className="text-red-500">*</span></label>
                        <input type="tel" placeholder="0912 345 678"
                          value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)}
                          className={inputCls(errors.contactPhone)} />
                        <FieldError msg={errors.contactPhone} />
                      </div>
                    </div>
                  </div>
                </FormSection>

                {/* ── 3. Nhóm hàng cung cấp ── */}
                <FormSection title="Nhóm hàng cung cấp">
                  <p className="text-xs text-slate-400 mb-4">
                    Chọn tất cả nhóm hàng mà doanh nghiệp có thể cung cấp cho Bia Hạ Long.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SUPPLY_CATEGORIES.map((cat) => {
                      const checked = form.categories.includes(cat);
                      return (
                        <label key={cat}
                          className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                            checked ? "border-[#0f2d5e] bg-[#0f2d5e]/5"
                                    : errors.categories ? "border-red-200 hover:border-red-300 hover:bg-red-50"
                                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                          onClick={() => toggleCategory(cat)}
                        >
                          <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            checked ? "bg-[#0f2d5e] border-[#0f2d5e]" : "border-slate-300 bg-white"
                          }`}>
                            {checked && <IconCheck size={11} />}
                          </div>
                          <span className={`text-sm font-medium ${checked ? "text-[#0f2d5e]" : "text-slate-700"}`}>
                            {cat}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <FieldError msg={errors.categories} />
                </FormSection>

                {/* ── 4. Hồ sơ đính kèm ── */}
                <FormSection title="Hồ sơ đính kèm">
                  <p className="text-xs text-slate-400 mb-4">
                    Tải lên hồ sơ để đội mua sắm xem xét. Định dạng chấp nhận: PDF, DOCX, JPG – tối đa 5MB/file.
                  </p>
                  <div className="grid gap-3">
                    {ATTACH_DOCS.map((doc) => (
                      <div key={doc.key}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-sm font-medium text-slate-700">{doc.label}</span>
                          {doc.required
                            ? <span className="text-red-500 text-sm">*</span>
                            : <span className="text-xs text-slate-400">(không bắt buộc)</span>}
                        </div>
                        <div className="border-2 border-dashed border-slate-200 rounded-lg px-5 py-6 flex flex-col items-center text-center hover:border-[#0f2d5e]/30 hover:bg-slate-50 transition-colors cursor-pointer group">
                          <div className="text-slate-300 group-hover:text-[#0f2d5e]/40 transition-colors mb-2">
                            <IconUpload />
                          </div>
                          <p className="text-sm text-slate-500">
                            Kéo thả hoặc{" "}
                            <span className="text-[#0f2d5e] font-medium group-hover:underline">chọn file</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{doc.hint}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                    <IconInfo />
                    Tính năng tải file sẽ được kích hoạt sau khi tích hợp backend.
                  </p>
                </FormSection>

                {/* ── 5. Cam kết ── */}
                <FormSection title="Cam kết">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div
                      onClick={() => set("agreed", !form.agreed)}
                      className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        form.agreed ? "bg-[#0f2d5e] border-[#0f2d5e]"
                          : errors.agreed ? "border-red-400 bg-white"
                          : "border-slate-300 bg-white group-hover:border-slate-400"
                      }`}
                    >
                      {form.agreed && <IconCheck size={11} />}
                    </div>
                    <span className="text-sm text-slate-600 leading-relaxed">
                      Tôi cam kết thông tin cung cấp là chính xác và đồng ý với{" "}
                      <span className="text-[#0f2d5e] font-medium hover:underline cursor-pointer">quy định tham gia hệ thống nhà cung cấp</span>{" "}
                      của Bia Hạ Long.
                      <span className="text-red-500 ml-1">*</span>
                    </span>
                  </label>
                  <FieldError msg={errors.agreed} />
                </FormSection>

                {/* ── Buttons ── */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button type="submit"
                    className="flex-1 sm:flex-none sm:min-w-[200px] bg-[#c9a227] text-[#0f2d5e] font-semibold text-sm py-3 px-6 rounded-xl hover:bg-[#b8960c] transition-colors shadow-sm">
                    Gửi hồ sơ đăng ký
                  </button>
                  <Link href="/"
                    className="flex-1 sm:flex-none sm:min-w-[160px] flex items-center justify-center gap-2 border border-slate-300 text-slate-600 font-medium text-sm py-3 px-6 rounded-xl hover:bg-slate-50 transition-colors">
                    <IconArrowLeft />
                    Quay lại trang chủ
                  </Link>
                </div>

              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="mt-6 lg:mt-0 lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <GuideSidebar />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
