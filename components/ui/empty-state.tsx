import type { ReactNode } from "react";
import Image from "next/image";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: "py-8 px-4",
    md: "py-14 px-6",
    lg: "py-20 px-8",
  };

  const iconSize = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-16 h-16",
  };

  const titleSize = {
    sm: "text-sm font-semibold",
    md: "text-base font-semibold",
    lg: "text-lg font-semibold",
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}>
      {icon && (
        <div className={`${iconSize[size]} rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400`}>
          {icon}
        </div>
      )}
      <p className={`${titleSize[size]} text-slate-700 mb-1`}>{title}</p>
      {description && (
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Branded empty state with subtle product bottle ──────────────────────── */

const BOTTLE_IMAGES = ["/images/golden.png", "/images/idol.png", "/images/legend.png"];

interface BrandedEmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Which bottle to show. Cycles through golden/idol/legend. Default: "golden" */
  bottle?: "golden" | "idol" | "legend";
}

export function BrandedEmptyState({
  title,
  description,
  action,
  className = "",
  bottle = "golden",
}: BrandedEmptyStateProps) {
  const bottleMap = { golden: BOTTLE_IMAGES[0], idol: BOTTLE_IMAGES[1], legend: BOTTLE_IMAGES[2] };
  const bottleSrc = bottleMap[bottle];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl flex flex-col items-center justify-center text-center py-14 px-6 ${className}`}
      style={{ background: "var(--surface-subtle)", border: "1px dashed var(--border-default)" }}
    >
      {/* Floating bottle — right bottom, very subtle */}
      <div
        className="absolute right-4 bottom-0 pointer-events-none select-none"
        style={{ width: 100, height: 140 }}
      >
        <Image
          src={bottleSrc}
          alt=""
          fill
          className="object-contain object-bottom"
          style={{ opacity: 0.07 }}
        />
      </div>

      {/* Gold accent strip at top */}
      <div
        className="absolute top-0 left-0 w-12 h-[2px] rounded-r-full"
        style={{ background: "var(--brand-accent)" }}
      />

      <div className="relative z-10">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto"
          style={{ background: "var(--brand-accent-light)" }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: "var(--brand-accent)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-base font-semibold text-slate-700 mb-1">{title}</p>
        {description && (
          <p className="text-sm text-slate-500 max-w-xs leading-relaxed">{description}</p>
        )}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

export function EmptyTableState({
  title,
  description,
  action,
  colSpan,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  colSpan: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <EmptyState
          title={title}
          description={description}
          action={action}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
        />
      </td>
    </tr>
  );
}
