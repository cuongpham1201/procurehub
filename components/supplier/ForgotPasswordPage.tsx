"use client";

import Link from "next/link";
import { useState } from "react";
import PublicHeader from "@/components/shared/PublicHeader";

function inputCls(err?: string) {
  return [
    "w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors",
    "focus:ring-2 focus:ring-[#0f2d5e]/20",
    err
      ? "border-red-400 bg-red-50 focus:border-red-400"
      : "border-slate-200 bg-white focus:border-[#0f2d5e]",
  ].join(" ");
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSubmitted(true);
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            {submitted ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-[#0f2d5e] mb-2">Kiểm tra hòm thư</h1>
                <p className="text-sm text-slate-500 mb-6">
                  Nếu địa chỉ <strong>{email}</strong> đã được đăng ký, chúng tôi sẽ gửi mật khẩu tạm thời đến email của bạn trong vài phút.
                </p>
                <Link
                  href="/login"
                  className="inline-block w-full text-center bg-[#0f2d5e] hover:bg-[#0a2050] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-[#0f2d5e] mb-1">Quên mật khẩu</h1>
                <p className="text-sm text-slate-500 mb-8">
                  Nhập email đã đăng ký. Chúng tôi sẽ gửi mật khẩu tạm thời về hòm thư của bạn.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="email@congty.vn"
                      className={inputCls(error)}
                      autoComplete="email"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#c9a227] hover:bg-[#b8960c] disabled:opacity-60 text-white font-semibold py-3 rounded-lg text-sm transition-colors mt-2"
                  >
                    {loading ? "Đang gửi..." : "Gửi mật khẩu mới"}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="text-sm text-[#0f2d5e] hover:underline font-medium">
                    ← Quay lại đăng nhập
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
