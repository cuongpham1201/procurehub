"use client";

import Link from "next/link";
import { useState } from "react";
import {
  saveAccount,
  isEmailExists,
  isTaxCodeExists,
  isPhoneExists,
} from "@/services/supplierAccountStorage";
import type { SupplierAccount } from "@/types/supplierAccount";
import PublicHeader from "@/components/shared/PublicHeader";

// ── icons ──────────────────────────────────────────────────────────────────
function IconCheck() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
    </svg>
  );
}

// ── types ──────────────────────────────────────────────────────────────────
interface FormData {
  companyName: string;
  taxCode: string;
  contactName: string;
  email: string;
  phone: string;
  agreed: boolean;
}
type FormErrors = Partial<Record<keyof FormData, string>>;

const EMPTY: FormData = {
  companyName: "",
  taxCode: "",
  contactName: "",
  email: "",
  phone: "",
  agreed: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f: FormData): FormErrors {
  const e: FormErrors = {};
  if (!f.companyName.trim()) e.companyName = "Vui lòng nhập tên công ty.";
  if (!f.taxCode.trim()) e.taxCode = "Vui lòng nhập mã số thuế.";
  if (!f.contactName.trim()) e.contactName = "Vui lòng nhập họ và tên người liên hệ.";
  if (!f.email.trim()) e.email = "Vui lòng nhập địa chỉ email.";
  else if (!EMAIL_RE.test(f.email)) e.email = "Địa chỉ email không hợp lệ.";
  if (!f.phone.trim()) e.phone = "Vui lòng nhập số điện thoại.";
  if (!f.agreed) e.agreed = "Vui lòng đồng ý với điều khoản sử dụng.";
  return e;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1.5">{msg}</p>;
}

function inputCls(err?: string) {
  return [
    "w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors",
    "focus:ring-2 focus:ring-[#0f2d5e]/20",
    err
      ? "border-red-400 bg-red-50 focus:border-red-400"
      : "border-slate-200 bg-white focus:border-[#0f2d5e]",
  ].join(" ");
}

// ── success state ──────────────────────────────────────────────────────────
function SuccessState({ email }: { email: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-5 text-blue-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Kiểm tra hộp thư của bạn!
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Chúng tôi đã gửi email kích hoạt tài khoản kèm mật khẩu tạm thời đến:
        </p>
        <p className="text-base font-semibold text-[#0f2d5e] mb-4">{email}</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left text-sm text-amber-800 space-y-1">
          <p className="font-semibold">Các bước tiếp theo:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Mở email và click nút <strong>Xác thực email</strong></li>
            <li>Đăng nhập bằng mật khẩu tạm thời trong email</li>
            <li>Đổi mật khẩu mới theo yêu cầu</li>
            <li>Hoàn thiện hồ sơ nhà cung cấp</li>
          </ol>
        </div>
        <p className="text-xs text-slate-400">
          Không nhận được email? Kiểm tra thư mục spam hoặc liên hệ{" "}
          <a href="mailto:ncc@biahalong.vn" className="text-[#0f2d5e] font-medium hover:underline">
            ncc@biahalong.vn
          </a>
        </p>
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export default function RegisterAccountPage() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [savedEmail, setSavedEmail] = useState("");

  if (savedEmail) return <SuccessState email={savedEmail} />;

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (key === "email" || key === "taxCode" || key === "phone") setGlobalError("");
  }

  // Realtime duplicate check khi blur khỏi field
  async function handleBlurEmail() {
    if (form.email && await isEmailExists(form.email)) {
      setErrors((prev) => ({ ...prev, email: "Email đã được sử dụng." }));
    }
  }
  async function handleBlurTaxCode() {
    if (form.taxCode && await isTaxCodeExists(form.taxCode)) {
      setErrors((prev) => ({ ...prev, taxCode: "Mã số thuế đã tồn tại trong hệ thống." }));
    }
  }
  async function handleBlurPhone() {
    if (form.phone && await isPhoneExists(form.phone)) {
      setErrors((prev) => ({ ...prev, phone: "Số điện thoại đã được đăng ký." }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (await isEmailExists(form.email)) {
      setErrors((prev) => ({ ...prev, email: "Email đã được sử dụng." }));
      setGlobalError("Email đã tồn tại trong hệ thống. Vui lòng dùng email khác hoặc đăng nhập.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (await isTaxCodeExists(form.taxCode)) {
      setErrors((prev) => ({ ...prev, taxCode: "Mã số thuế đã tồn tại trong hệ thống." }));
      setGlobalError("Mã số thuế đã tồn tại. Mỗi doanh nghiệp chỉ đăng ký một tài khoản.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (await isPhoneExists(form.phone)) {
      setErrors((prev) => ({ ...prev, phone: "Số điện thoại đã được đăng ký." }));
      setGlobalError("Số điện thoại đã tồn tại trong hệ thống. Vui lòng dùng số khác hoặc đăng nhập.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const id = `SUP-${Date.now().toString().slice(-5)}`;
    const normalizedEmail = form.email.trim().toLowerCase();
    const account: SupplierAccount = {
      id,
      companyName: form.companyName.trim(),
      taxCode: form.taxCode.trim(),
      contactName: form.contactName.trim(),
      email: normalizedEmail,
      phone: form.phone.trim(),
      password: "",
      profileCompleted: false,
      status: "Chưa hoàn thiện hồ sơ",
      createdAt: new Date().toISOString(),
    };
    await saveAccount(account);
    setSavedEmail(normalizedEmail);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h1 className="text-2xl font-bold text-[#0f2d5e] mb-1">
                Đăng ký tài khoản nhà cung cấp
              </h1>
              <p className="text-sm text-slate-500 mb-8">
                Tạo tài khoản nhanh để bắt đầu. Bổ sung hồ sơ năng lực sau khi đăng ký.
              </p>

              {/* Global error banner */}
              {globalError && (
                <div className="flex gap-3 items-start bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
                  <IconAlert />
                  <span>{globalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Company info */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Thông tin doanh nghiệp
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Tên công ty <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={(e) => set("companyName", e.target.value)}
                        placeholder="Công ty TNHH / Cổ phần..."
                        className={inputCls(errors.companyName)}
                      />
                      <FieldError msg={errors.companyName} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Mã số thuế <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.taxCode}
                        onChange={(e) => set("taxCode", e.target.value)}
                        onBlur={handleBlurTaxCode}
                        placeholder="VD: 0123456789"
                        className={inputCls(errors.taxCode)}
                      />
                      <FieldError msg={errors.taxCode} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Người liên hệ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.contactName}
                        onChange={(e) => set("contactName", e.target.value)}
                        placeholder="Họ và tên"
                        className={inputCls(errors.contactName)}
                      />
                      <FieldError msg={errors.contactName} />
                    </div>
                  </div>
                </div>

                {/* Contact & credentials */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Thông tin liên hệ
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        onBlur={handleBlurEmail}
                        placeholder="email@congty.vn"
                        className={inputCls(errors.email)}
                      />
                      <FieldError msg={errors.email} />
                      <p className="text-xs text-slate-400 mt-1">
                        Email này dùng để nhận link kích hoạt và đăng nhập.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        onBlur={handleBlurPhone}
                        placeholder="0901 234 567"
                        className={inputCls(errors.phone)}
                      />
                      <FieldError msg={errors.phone} />
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.agreed}
                      onChange={(e) => set("agreed", e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#0f2d5e]"
                    />
                    <span className="text-sm text-slate-600">
                      Tôi đã đọc và đồng ý với{" "}
                      <span className="text-[#0f2d5e] font-medium underline cursor-pointer">
                        Điều khoản sử dụng
                      </span>{" "}
                      và{" "}
                      <span className="text-[#0f2d5e] font-medium underline cursor-pointer">
                        Chính sách bảo mật
                      </span>{" "}
                      của Cổng đấu thầu Bia Hạ Long.
                    </span>
                  </label>
                  <FieldError msg={errors.agreed} />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#c9a227] hover:bg-[#b8960c] text-white font-semibold py-3 rounded-lg text-sm transition-colors mt-2"
                >
                  Tạo tài khoản
                </button>
              </form>

              <p className="text-sm text-center text-slate-500 mt-6">
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-[#0f2d5e] font-medium hover:underline">
                  Đăng nhập tại đây
                </Link>
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-[#0f2d5e] text-white rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-[#c9a227]">Quy trình tham gia</h3>
              <ol className="space-y-4">
                {[
                  ["1", "Đăng ký tài khoản", "Nhanh, chỉ 2 phút"],
                  ["2", "Xác thực email", "Click link trong email kích hoạt"],
                  ["3", "Đổi mật khẩu", "Đặt mật khẩu cá nhân ngay sau đăng nhập"],
                  ["4", "Hoàn thiện hồ sơ", "Thêm năng lực doanh nghiệp"],
                  ["5", "Xét duyệt & nhận RFQ", "Bia Hạ Long xác nhận trong 1-3 ngày"],
                ].map(([n, title, sub]) => (
                  <li key={n} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#c9a227] text-[#0a1e3d] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {n}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-white/60">{sub}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 mb-3 text-sm">Cần hỗ trợ?</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-medium">Hotline:</span>{" "}
                  <span className="text-[#0f2d5e]">1800 1234</span>
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  <span className="text-[#0f2d5e]">ncc@biahalong.vn</span>
                </p>
                <p className="text-xs text-slate-400 pt-1">
                  Thứ 2 – Thứ 6, 8:00–17:30
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
