"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function inputCls(err?: string) {
  return [
    "w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors",
    "focus:ring-2 focus:ring-[#0f2d5e]/20",
    err
      ? "border-red-400 bg-red-50 focus:border-red-400"
      : "border-slate-200 bg-white focus:border-[#0f2d5e]",
  ].join(" ");
}

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [globalError, setGlobalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && (!user || user.kind !== "internal")) {
    router.replace("/admin");
    return null;
  }

  function validate() {
    const e: typeof errors = {};
    if (!current.trim()) e.current = "Vui lòng nhập mật khẩu hiện tại";
    if (!next || next.length < 8) e.next = "Mật khẩu mới tối thiểu 8 ký tự";
    if (!confirm) e.confirm = "Vui lòng xác nhận mật khẩu mới";
    else if (confirm !== next) e.confirm = "Mật khẩu xác nhận không khớp";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setGlobalError("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.error ?? "Đổi mật khẩu thất bại. Vui lòng thử lại.");
        return;
      }
      router.push("/admin");
    } catch {
      setGlobalError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-[#0f2d5e] mb-1">Đổi mật khẩu</h1>
        <p className="text-sm text-slate-500 mb-6">Thay đổi mật khẩu tài khoản nội bộ.</p>

        {globalError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={current}
              onChange={(e) => { setCurrent(e.target.value); setErrors((p) => ({ ...p, current: undefined })); }}
              placeholder="Mật khẩu hiện tại"
              className={inputCls(errors.current)}
            />
            {errors.current && <p className="text-xs text-red-500 mt-1.5">{errors.current}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={next}
              onChange={(e) => { setNext(e.target.value); setErrors((p) => ({ ...p, next: undefined })); }}
              placeholder="Tối thiểu 8 ký tự"
              className={inputCls(errors.next)}
            />
            {errors.next && <p className="text-xs text-red-500 mt-1.5">{errors.next}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })); }}
              placeholder="Nhập lại mật khẩu mới"
              className={inputCls(errors.confirm)}
            />
            {errors.confirm && <p className="text-xs text-red-500 mt-1.5">{errors.confirm}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#c9a227] hover:bg-[#b8960c] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2"
          >
            {submitting ? "Đang lưu…" : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
