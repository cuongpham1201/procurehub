import Image from "next/image";

interface DashboardHeroProps {
  openTenders:        number;
  pendingSuppliers:   number;
  totalTenderValue:   string;
  loading?:           boolean;
}

function today(): string {
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

export function DashboardHero({
  openTenders,
  pendingSuppliers,
  totalTenderValue,
  loading = false,
}: DashboardHeroProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "var(--brand-primary)", minHeight: 136 }}
    >
      {/* ── Factory image — very subtle left wash ──────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <Image
          src="/images/nha may.jpg"
          alt=""
          fill
          className="object-cover object-center"
          style={{ opacity: 0.07 }}
          priority
        />
      </div>

      {/* ── Product bottle — right side accent ────────────────────── */}
      <div
        className="absolute right-0 top-0 bottom-0 pointer-events-none select-none"
        style={{ width: 220 }}
      >
        <Image
          src="/images/legend.png"
          alt=""
          fill
          className="object-contain object-right-bottom"
          style={{ opacity: 0.13 }}
          priority
        />
      </div>

      {/* ── Gradient: brand solid left → transparent right ─────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, var(--brand-primary) 40%, rgba(15,45,94,0.85) 70%, transparent 100%)",
        }}
      />

      {/* ── Gold accent line top ───────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "var(--brand-accent)", opacity: 0.7 }}
      />

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between gap-4 px-7 py-5">

        {/* Left: Identity */}
        <div className="min-w-0">
          <div
            className="text-[11px] font-semibold uppercase tracking-widest mb-1.5"
            style={{ color: "var(--brand-accent)", opacity: 0.85 }}
          >
            Procurement & Tender Management
          </div>
          <div className="text-white text-[19px] font-bold leading-tight">
            Cổng quản trị mua sắm
          </div>
          <div className="text-white/50 text-[12.5px] mt-1 capitalize">{today()}</div>
        </div>

        {/* Right: Key metrics */}
        <div className="hidden sm:flex items-center gap-0 shrink-0">
          <Metric
            value={loading ? "–" : String(openTenders)}
            label="Gói thầu mở"
          />
          <div className="w-px h-10 bg-white/10 mx-5" />
          <Metric
            value={loading ? "–" : String(pendingSuppliers)}
            label="Chờ xét duyệt"
          />
          <div className="w-px h-10 bg-white/10 mx-5" />
          <Metric
            value={loading ? "–" : totalTenderValue}
            label="Tổng giá trị"
            compact
          />
        </div>
      </div>
    </div>
  );
}

function Metric({
  value,
  label,
  compact = false,
}: {
  value: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`font-bold tabular-nums leading-none ${compact ? "text-[17px]" : "text-[22px]"}`}
        style={{ color: "var(--brand-accent)" }}
      >
        {value}
      </div>
      <div className="text-white/50 text-[11px] mt-1">{label}</div>
    </div>
  );
}
