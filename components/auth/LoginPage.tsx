"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  findByCredentials,
  setCurrentSession,
  clearSession,
} from "@/services/supplierAccountStorage";
import {
  findInternalByCredentials,
  setInternalSession,
  clearInternalSession,
} from "@/services/authStorage";

// ── icons ─────────────────────────────────────────────────────────────────

function IconAlert() {
  return (
    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
    </svg>
  );
}

// ── input style ───────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return [
    "w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors",
    "focus:ring-2 focus:ring-[#0f2d5e]/20",
    hasError
      ? "border-red-300 bg-red-50 focus:border-red-400"
      : "border-slate-200 bg-white focus:border-[#0f2d5e]",
  ].join(" ");
}

// ── tab type ──────────────────────────────────────────────────────────────

type Tab = "supplier" | "internal";

// ── main component ────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("supplier");
  const [email, setEmail] = useState("");

  // Auto-select "internal" tab when URL has ?type=internal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("type") === "internal") {
      setTab("internal");
    }
  }, []);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function clearForm() {
    setEmail("");
    setPassword("");
    setError("");
  }

  function switchTab(next: Tab) {
    setTab(next);
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (tab === "supplier") {
        const account = findByCredentials(email.trim(), password);
        if (!account) {
          setError("Email hoặc mật khẩu nhà cung cấp không đúng.");
          return;
        }
        if (account.status === "Tạm khóa") {
          setError("Tài khoản nhà cung cấp đang bị tạm khóa. Vui lòng liên hệ quản trị viên.");
          return;
        }
        // Clear internal session, set supplier session
        clearInternalSession();
        setCurrentSession(account);
        router.push(account.profileCompleted ? "/supplier/dashboard" : "/supplier/profile");
      } else {
        const user = findInternalByCredentials(email.trim(), password);
        if (!user) {
          setError("Email hoặc mật khẩu nội bộ không đúng.");
          return;
        }
        if (user.status === "Tạm khóa") {
          setError("Tài khoản nội bộ đang bị tạm khóa.");
          return;
        }
        // Clear supplier session, set internal session
        clearSession();
        setInternalSession(user);
        router.push("/admin");
      }
    }, 500);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Branding header */}
      <header className="bg-[#0f2d5e] px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="text-white font-bold text-base tracking-tight">
            Bia Hạ Long <span className="text-[#c9a227]">Procurement</span>
          </Link>
          <Link
            href="/"
            className="text-xs text-white/60 hover:text-white/90 transition-colors"
          >
            ← Về trang chủ
          </Link>
        </div>
      </header>

      {/* Form card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Tab switcher */}
            <div className="flex border-b border-slate-100">
              {(
                [
                  { key: "supplier" as Tab, label: "Nhà cung cấp" },
                  { key: "internal" as Tab, label: "Nội bộ Bia Hạ Long" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { switchTab(key); clearForm(); }}
                  className={[
                    "flex-1 py-3.5 text-sm font-medium transition-colors",
                    tab === key
                      ? "text-[#0f2d5e] border-b-2 border-[#0f2d5e] bg-white"
                      : "text-slate-400 hover:text-slate-600 bg-slate-50",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-8">
              <h1 className="text-xl font-bold text-slate-800 mb-1">
                {tab === "supplier" ? "Đăng nhập nhà cung cấp" : "Đăng nhập nội bộ"}
              </h1>
              <p className="text-sm text-slate-500 mb-6">
                {tab === "supplier"
                  ? "Truy cập cổng nhà cung cấp để xem và nộp báo giá."
                  : "Dành cho nhân viên phòng kế hoạch vật tư và quản trị."}
              </p>

              {/* Error */}
              {error && (
                <div className="flex gap-2.5 items-start bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
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
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder={tab === "supplier" ? "email@congty.vn" : "ten@biahalong.vn"}
                    className={inputCls(!!error)}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Nhập mật khẩu"
                    className={inputCls(!!error)}
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0f2d5e] hover:bg-[#0d2550] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  {loading ? "Đang xác thực..." : "Đăng nhập"}
                </button>
              </form>

              {/* Footer links */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-500">
                {tab === "supplier" ? (
                  <>
                    Chưa có tài khoản?{" "}
                    <Link
                      href="/supplier/register-account"
                      className="text-[#0f2d5e] font-medium hover:underline"
                    >
                      Đăng ký nhà cung cấp
                    </Link>
                  </>
                ) : (
                  <span className="text-slate-400 text-xs">
                    Liên hệ quản trị hệ thống để được cấp tài khoản nội bộ.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Demo hints */}
          {tab === "internal" && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 space-y-1">
              <p className="font-semibold">Tài khoản demo:</p>
              <p>Email: <span className="font-mono">admin@biahalong.vn</span></p>
              <p>Mật khẩu: <span className="font-mono">admin123</span></p>
            </div>
          )}
          {tab === "supplier" && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
              <span className="font-semibold">Hướng dẫn:</span> Đăng ký tài khoản tại{" "}
              <Link href="/supplier/register-account" className="underline">
                /supplier/register-account
              </Link>{" "}
              rồi đăng nhập bằng email và mật khẩu vừa tạo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
