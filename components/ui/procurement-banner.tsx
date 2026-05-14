import Image from "next/image";
import Link from "next/link";

interface ProcurementBannerProps {
  title:      string;
  subtitle?:  string;
  action?:    { label: string; href: string };
  /** Background image src. Defaults to factory photo. */
  imageSrc?:  string;
  /** Right-side accent image (product bottle etc.) */
  accentSrc?: string;
  className?: string;
  /** Height of the banner. Default: 160px */
  height?:    number;
}

/**
 * Reusable brand banner for supplier portal, onboarding, tender sections.
 * Always uses the factory image as a dark overlay background.
 */
export function ProcurementBanner({
  title,
  subtitle,
  action,
  imageSrc  = "/images/nha may.jpg",
  accentSrc,
  className = "",
  height    = 160,
}: ProcurementBannerProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ background: "var(--brand-primary-dark)", minHeight: height }}
    >
      {/* ── Factory background image ───────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover object-center"
          style={{ opacity: 0.18 }}
        />
      </div>

      {/* ── Accent product image (right side, optional) ───────────── */}
      {accentSrc && (
        <div
          className="absolute right-0 top-0 bottom-0 pointer-events-none select-none"
          style={{ width: 180 }}
        >
          <Image
            src={accentSrc}
            alt=""
            fill
            className="object-contain object-right-bottom"
            style={{ opacity: 0.15 }}
          />
        </div>
      )}

      {/* ── Gradient overlay — left solid, right transparent ─────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(8,25,58,0.97) 0%, rgba(8,25,58,0.88) 50%, rgba(8,25,58,0.55) 100%)",
        }}
      />

      {/* ── Gold accent line top-left ─────────────────────────────── */}
      <div
        className="absolute top-0 left-0 w-16 h-[2px] rounded-r-full"
        style={{ background: "var(--brand-accent)" }}
      />

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="relative z-10 px-7 py-6 max-w-2xl">
        <h2
          className="text-white text-[17px] font-bold leading-snug"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-white/60 text-sm mt-2 leading-relaxed">{subtitle}</p>
        )}
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ background: "var(--brand-accent)", color: "var(--brand-primary)" }}
          >
            {action.label}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Compact variant: just a branded info strip ───────────────────────── */

export function ProcurementStrip({
  text,
  className = "",
}: {
  text:       string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl flex items-center gap-4 px-5 py-3 ${className}`}
      style={{ background: "var(--brand-primary)" }}
    >
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ background: "var(--brand-accent)" }}
      />
      <p className="text-white/80 text-[13px]">{text}</p>
    </div>
  );
}
