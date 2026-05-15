"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, ArrowLeft, Shield, Clock, Users, Lock } from "lucide-react";

type Tab = "supplier" | "internal";

function inputCls(hasError: boolean) {
  return [
    "w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all",
    "placeholder:text-slate-400",
    hasError
      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-slate-200 bg-white focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-blue-50",
  ].join(" ");
}

export default function LoginPage() {
  const router = useRouter();
  const [tab,       setTab]       = useState<Tab>("supplier");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "forbidden") {
      setForbidden(true);
      // Auto-switch to the correct tab for the destination
      const next = params.get("next") ?? "";
      setTab(next.startsWith("/admin") ? "internal" : "supplier");
    } else if (params.get("type") === "internal") {
      setTab("internal");
    }
  }, []);

  async function handleLogoutAndSwitch() {
    await fetch("/api/auth/logout", { method: "POST" });
    setForbidden(false);
    setError("");
    setEmail("");
    setPassword("");
  }

  function switchTab(next: Tab) {
    setTab(next);
    setError("");
    setEmail("");
    setPassword("");
  }

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
        body: JSON.stringify({ email: email.trim(), password, kind: tab === "internal" ? "internal" : "supplier" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Đăng nhập thất bại.");
        return;
      }

      const nextParam = new URLSearchParams(window.location.search).get("next");

      if (data.kind === "supplier") {
        router.push(nextParam ?? "/supplier/dashboard");
      } else {
        router.push(nextParam ?? "/admin");
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ═══════════════════════════════════════════════════════════════
          LEFT — Brand panel
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[46%] xl:w-[44%] relative flex-col justify-between overflow-hidden"
        style={{ background: "var(--brand-primary-dark)" }}
      >
        {/* ── Factory background image (next/image optimized) ──────── */}
        <div className="absolute inset-0">
          <Image
            src="/images/nha may 2.png"
            alt="Nhà máy Bia Hạ Long"
            fill
            className="object-cover object-center"
            style={{ opacity: 0.22 }}
            priority
          />
        </div>

        {/* ── Layered gradient overlay ─────────────────────────────── */}
        {/* Layer 1: overall dark */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,25,58,0.65) 0%, rgba(8,25,58,0.45) 45%, rgba(8,25,58,0.80) 100%)",
          }}
        />
        {/* Layer 2: left edge darkening for text contrast */}
        <div
          className="absolute inset-y-0 left-0 w-32"
          style={{
            background: "linear-gradient(to right, rgba(8,25,58,0.6), transparent)",
          }}
        />

        {/* ── Gold accent line — top ───────────────────────────────── */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: "linear-gradient(to right, var(--brand-accent), transparent 60%)" }}
        />

        {/* ════════════════════════════════════════════════════════════
            CONTENT
        ════════════════════════════════════════════════════════════ */}

        {/* TOP: Logo — white pill so brand colors render correctly on dark bg */}
        <div className="relative z-10 p-10 xl:p-12">
          <div
            className="inline-flex items-center px-4 py-2.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.96)", boxShadow: "0 2px 16px rgba(0,0,0,0.22)" }}
          >
            <div className="relative w-[130px] h-[36px]">
              <Image
                src="/images/logo_ngang_biahalong.png"
                alt="Bia Hạ Long"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </div>
          <div className="mt-3 text-white/40 text-[11px] font-medium tracking-wider uppercase">
            Procurement Portal
          </div>
        </div>

        {/* MIDDLE: Hero copy */}
        <div className="relative z-10 px-10 xl:px-12 space-y-6">
          <div>
            <div
              className="text-[11px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--brand-accent)", opacity: 0.9 }}
            >
              Procurement &amp; Tender Management
            </div>
            <h1 className="text-[30px] xl:text-[34px] font-bold text-white leading-tight">
              Nền tảng đấu thầu<br />
              <span style={{ color: "var(--brand-accent)" }}>nội bộ doanh nghiệp</span>
            </h1>
            <p className="mt-3.5 text-white/60 text-sm leading-relaxed max-w-xs">
              Hệ thống quản lý mua sắm và đấu thầu chuyên nghiệp của Công ty CP Bia Hạ Long — minh bạch, hiệu quả và chuẩn hóa.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-2.5">
            {[
              "Quản lý gói thầu tập trung, chuẩn hóa",
              "Đăng ký & xét duyệt nhà cung cấp online",
              "Nộp và so sánh báo giá minh bạch",
              "Theo dõi trạng thái và thông báo real-time",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] text-white/65">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 mt-[5px]"
                  style={{ background: "var(--brand-accent)" }}
                />
                {item}
              </li>
            ))}
          </ul>

          {/* Trust indicators */}
          <div
            className="grid grid-cols-3 gap-4 pt-2 border-t"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <TrustStat icon={<Shield className="w-4 h-4" />} value="100%" label="Bảo mật nội bộ" />
            <TrustStat icon={<Users className="w-4 h-4" />} value="50+" label="Nhà cung cấp" />
            <TrustStat icon={<Clock className="w-4 h-4" />} value="15+" label="Năm kinh nghiệm" />
          </div>
        </div>

        {/* BOTTOM: Brand note */}
        <div
          className="relative z-10 px-10 xl:px-12 pb-10 xl:pb-12 pt-6 border-t"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <p className="text-white/25 text-[11px] leading-relaxed">
            © {new Date().getFullYear()} Công ty CP Bia Hạ Long<br />
            Hệ thống mua sắm nội bộ — chỉ dành cho đối tác được duyệt
          </p>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════
          RIGHT — Login form
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col bg-[var(--surface-subtle)]">

        {/* Mobile header */}
        <div className="lg:hidden px-5 py-4 bg-white border-b border-[var(--border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-[110px] h-[32px]">
              <Image
                src="/images/logo_ngang_biahalong.png"
                alt="Bia Hạ Long"
                fill
                className="object-contain object-left"
              />
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Trang chủ
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-[420px]">

            {/* Back — desktop */}
            <Link
              href="/"
              className="hidden lg:inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Về trang chủ
            </Link>

            <h2 className="text-[22px] font-bold text-slate-900 mb-1">Đăng nhập</h2>
            <p className="text-sm text-slate-500 mb-6">
              Chọn loại tài khoản và nhập thông tin đăng nhập.
            </p>

            {/* Tab switcher */}
            <div className="flex bg-[var(--surface-muted)] rounded-xl p-1 mb-6 gap-1">
              {([
                { key: "supplier" as Tab, label: "Nhà cung cấp" },
                { key: "internal" as Tab, label: "Nội bộ" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => switchTab(key)}
                  className={[
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                    tab === key
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Forbidden banner — shown when logged in with wrong role */}
            {forbidden && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800 mb-0.5">Không có quyền truy cập</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Tài khoản hiện tại không có quyền truy cập trang này. Vui lòng đăng nhập bằng tài khoản{" "}
                      {tab === "internal" ? "nội bộ Bia Hạ Long" : "nhà cung cấp"} để tiếp tục.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutAndSwitch}
                  className="mt-3 w-full py-2 rounded-lg text-xs font-semibold border transition-colors"
                  style={{ borderColor: "var(--brand-accent)", color: "var(--brand-accent)", background: "transparent" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,162,39,0.07)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  Đăng xuất và đăng nhập tài khoản khác
                </button>
              </div>
            )}

            {/* Login card */}
            <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-sm p-7">

              {/* Role hint */}
              <p className="text-xs text-slate-500 mb-5 leading-relaxed bg-slate-50 rounded-lg px-3 py-2.5 border border-[var(--border-muted)]">
                {tab === "supplier"
                  ? "Dành cho nhà cung cấp — xem gói thầu, nộp và theo dõi báo giá."
                  : "Dành cho nhân viên phòng kế hoạch vật tư và quản trị hệ thống."}
              </p>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3.5 py-3 mb-5 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Email</label>
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
                  <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="Nhập mật khẩu"
                      className={inputCls(!!error) + " pr-10"}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "var(--brand-primary)" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                      </svg>
                      Đang xác thực...
                    </span>
                  ) : (
                    "Đăng nhập"
                  )}
                </button>
              </form>

              {tab === "supplier" && (
                <div className="mt-5 pt-4 border-t border-[var(--border-muted)] text-center text-sm text-slate-500">
                  Chưa có tài khoản?{" "}
                  <Link href="/supplier/register-account" className="font-semibold text-[var(--brand-primary)] hover:underline">
                    Đăng ký nhà cung cấp
                  </Link>
                </div>
              )}
              {tab === "internal" && (
                <p className="mt-5 pt-4 border-t border-[var(--border-muted)] text-center text-xs text-slate-400">
                  Liên hệ quản trị hệ thống để được cấp tài khoản nội bộ.
                </p>
              )}
            </div>

            {tab === "supplier" && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
                <span className="font-semibold">Hướng dẫn:</span>{" "}
                Đăng ký tài khoản tại{" "}
                <Link href="/supplier/register-account" className="underline font-medium">
                  trang đăng ký
                </Link>{" "}
                rồi đăng nhập bằng email và mật khẩu vừa tạo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Trust stat sub-component ──────────────────────────────────────────── */

function TrustStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="text-white/40">{icon}</div>
      <div className="text-white text-base font-bold leading-none">{value}</div>
      <div className="text-white/40 text-[10.5px] leading-tight">{label}</div>
    </div>
  );
}
