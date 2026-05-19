"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PublicHeader from "@/components/shared/PublicHeader";

function IconAlert() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
    </svg>
  );
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, kind: "supplier" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Đăng nhập thất bại.");
        return;
      }
      router.push("/supplier/dashboard");
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
            <h1 className="text-2xl font-bold text-[#0f2d5e] mb-1">Đăng nhập</h1>
            <p className="text-sm text-slate-500 mb-8">
              Đăng nhập vào cổng nhà cung cấp Bia Hạ Long.
            </p>

            {error && (
              <div className="flex gap-3 items-start bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
                <IconAlert />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="email@congty.vn"
                  className={inputCls(error ? error : undefined)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Nhập mật khẩu"
                  className={inputCls(error ? error : undefined)}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#c9a227] hover:bg-[#b8960c] disabled:opacity-60 text-white font-semibold py-3 rounded-lg text-sm transition-colors mt-2"
              >
                {loading ? "Đang xác thực..." : "Đăng nhập"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-2">
              <p className="text-sm text-slate-500">
                <Link
                  href="/supplier/forgot-password"
                  className="text-[#0f2d5e] font-medium hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </p>
              <p className="text-sm text-slate-500">
                Chưa có tài khoản?{" "}
                <Link
                  href="/supplier/register-account"
                  className="text-[#0f2d5e] font-medium hover:underline"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>

          {/* Demo hint */}
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
            <span className="font-semibold">Demo:</span> Đăng ký tài khoản tại{" "}
            <Link href="/supplier/register-account" className="underline">
              /supplier/register-account
            </Link>{" "}
            rồi đăng nhập bằng email và mật khẩu vừa tạo.
          </div>
        </div>
      </div>
    </div>
  );
}
