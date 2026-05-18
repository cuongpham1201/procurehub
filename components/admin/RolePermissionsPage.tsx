"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { ShieldCheck, Save, RotateCcw, Lock, Info } from "lucide-react";
import {
  ALL_PERMISSIONS,
  MANAGEABLE_ROLES,
  PERMISSION_GROUPS,
  PERMISSION_META,
  type Permission,
  type InternalRole,
} from "@/lib/auth/rbac";

// ── types ─────────────────────────────────────────────────────────────────────

type PermMatrix = Record<string, Permission[]>;

// ── helpers ───────────────────────────────────────────────────────────────────

const ROLE_SHORT: Record<string, string> = {
  Admin:                 "Admin",
  "Trưởng phòng vật tư": "Trưởng phòng",
  "Kế hoạch vật tư":     "Kế hoạch VT",
  "Ban giám đốc":        "Ban GĐ",
  "Chỉ xem":            "Chỉ xem",
};

function matrixHasPerm(matrix: PermMatrix, role: string, perm: Permission): boolean {
  return (matrix[role] ?? []).includes(perm);
}

function togglePerm(matrix: PermMatrix, role: string, perm: Permission): PermMatrix {
  const current = matrix[role] ?? [];
  const has = current.includes(perm);
  const next = has ? current.filter((p) => p !== perm) : [...current, perm];
  return { ...matrix, [role]: next };
}

function countDirtyRoles(current: PermMatrix, original: PermMatrix): number {
  return MANAGEABLE_ROLES.filter((role) => {
    const curr = [...(current[role] ?? [])].sort().join(",");
    const orig = [...(original[role] ?? [])].sort().join(",");
    return curr !== orig;
  }).length;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function RolePermissionsPage() {
  const [matrix, setMatrix] = useState<PermMatrix>({});
  const [original, setOriginal] = useState<PermMatrix>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Load matrix from API
  useEffect(() => {
    fetch("/api/admin/role-permissions")
      .then((r) => r.json())
      .then((data) => {
        setMatrix(data.matrix ?? {});
        setOriginal(data.matrix ?? {});
      })
      .catch(() => showToast("Không tải được dữ liệu phân quyền", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const dirtyCount = countDirtyRoles(matrix, original);
  const hasDirty = dirtyCount > 0;

  const handleToggle = useCallback((role: string, perm: Permission) => {
    // admin:full trên Admin là khóa cứng
    if (role === "Admin" && perm === "admin:full") return;
    setMatrix((prev) => togglePerm(prev, role, perm));
  }, []);

  const handleReset = useCallback(() => {
    setMatrix(original);
  }, [original]);

  // Lưu tất cả roles có thay đổi
  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    try {
      const dirtyRoles = MANAGEABLE_ROLES.filter((role) => {
        const curr = [...(matrix[role] ?? [])].sort().join(",");
        const orig = [...(original[role] ?? [])].sort().join(",");
        return curr !== orig;
      });

      await Promise.all(
        dirtyRoles.map((role) =>
          fetch("/api/admin/role-permissions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role, permissions: matrix[role] ?? [] }),
          }).then(async (res) => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(`${role}: ${err.error ?? "Lỗi không xác định"}`);
            }
            return res.json();
          }),
        ),
      );

      setOriginal({ ...matrix });
      showToast(`Đã lưu phân quyền cho ${dirtyRoles.length} vai trò`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lỗi không xác định", "error");
    } finally {
      setSaving(false);
    }
  }, [matrix, original, showToast]);

  // Permissions grouped for display
  const grouped = PERMISSION_GROUPS.map((group) => ({
    group,
    permissions: ALL_PERMISSIONS.filter((p) => PERMISSION_META[p].group === group),
  }));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-[var(--brand-accent)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Phân quyền vai trò</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Tick chọn quyền cho từng vai trò, sau đó bấm <strong>Lưu thay đổi</strong> để áp dụng.
          </p>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-5 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded border-2 border-[var(--brand-primary)] bg-[var(--brand-primary)] inline-flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Có quyền
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded border-2 border-[var(--border)] bg-white inline-block" />
          Không có quyền
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-[var(--brand-accent)]" />
          Khóa cứng
        </span>
        {hasDirty && (
          <span className="flex items-center gap-1.5 text-amber-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            {dirtyCount} vai trò có thay đổi chưa lưu
          </span>
        )}
      </div>

      {loading ? (
        <div className="card p-10 text-center text-[var(--text-secondary)] text-sm animate-pulse">
          Đang tải dữ liệu phân quyền…
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 font-semibold text-[var(--text-primary)] w-64 min-w-[220px]">
                    Quyền
                  </th>
                  {MANAGEABLE_ROLES.map((role) => {
                    const isDirty = [...(matrix[role] ?? [])].sort().join(",") !== [...(original[role] ?? [])].sort().join(",");
                    return (
                      <th key={role} className="py-3 px-3 text-center min-w-[110px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold text-[var(--text-primary)] text-xs leading-tight">
                            {ROLE_SHORT[role] ?? role}
                          </span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">
                            {(matrix[role] ?? []).length} quyền
                          </span>
                          {isDirty && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="Có thay đổi chưa lưu" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {grouped.map(({ group, permissions: perms }) => (
                  <Fragment key={group}>
                    {/* Group header row */}
                    <tr className="bg-[var(--surface-subtle)]">
                      <td
                        colSpan={MANAGEABLE_ROLES.length + 1}
                        className="py-2 px-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]"
                      >
                        {group}
                      </td>
                    </tr>

                    {perms.map((perm) => {
                      const meta = PERMISSION_META[perm];
                      const isLocked = (role: InternalRole) => role === "Admin" && perm === "admin:full";
                      return (
                        <tr
                          key={perm}
                          className="border-b border-[var(--border)] hover:bg-[var(--surface-subtle)] transition-colors"
                        >
                          {/* Permission label */}
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-2">
                              <div>
                                <div className="font-medium text-[var(--text-primary)] leading-tight">
                                  {meta.label}
                                </div>
                                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-tight">
                                  {meta.description}
                                </div>
                              </div>
                              <button
                                onMouseEnter={() => setTooltip(perm)}
                                onMouseLeave={() => setTooltip(null)}
                                className="mt-0.5 shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors relative"
                                aria-label="Thông tin quyền"
                              >
                                <Info className="w-3.5 h-3.5" />
                                {tooltip === perm && (
                                  <div className="absolute left-5 top-0 z-10 bg-[var(--brand-primary)] text-white text-[11px] rounded-lg px-3 py-2 shadow-lg w-52 leading-relaxed whitespace-normal text-left font-normal pointer-events-none">
                                    <span className="font-mono text-[var(--brand-accent)]">{perm}</span>
                                    <br />
                                    {meta.description}
                                  </div>
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Checkboxes per role */}
                          {MANAGEABLE_ROLES.map((role) => {
                            const locked = isLocked(role);
                            const checked = matrixHasPerm(matrix, role, perm);
                            return (
                              <td key={role} className="py-3 px-3 text-center">
                                {locked ? (
                                  <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 rounded flex items-center justify-center bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/40">
                                      <Lock className="w-3 h-3 text-[var(--brand-accent)]" />
                                    </div>
                                  </div>
                                ) : (
                                  <label className="flex items-center justify-center cursor-pointer group">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => handleToggle(role, perm)}
                                      className="sr-only"
                                    />
                                    <div
                                      className={[
                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                        checked
                                          ? "bg-[var(--brand-primary)] border-[var(--brand-primary)]"
                                          : "border-[var(--border)] bg-white group-hover:border-[var(--brand-primary)]/50",
                                      ].join(" ")}
                                    >
                                      {checked && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                                          <path
                                            d="M2 6l3 3 5-5"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                  </label>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Action bar ── */}
          <div className="flex items-center justify-between gap-4 py-4 border-t border-[var(--border)] sticky bottom-0 bg-[var(--surface-subtle)] -mx-5 sm:-mx-6 px-5 sm:px-6">
            <div className="text-sm text-[var(--text-secondary)]">
              {hasDirty ? (
                <span className="text-amber-600 font-medium">
                  {dirtyCount} vai trò có thay đổi chưa được lưu
                </span>
              ) : (
                <span className="text-green-600 font-medium">Đang hiển thị phân quyền đang áp dụng</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {hasDirty && (
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-white transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Hoàn tác
                </button>
              )}
              <button
                onClick={handleSaveAll}
                disabled={!hasDirty || saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Save className="w-4 h-4" />
                {saving ? "Đang lưu…" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={[
            "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium",
            "flex items-center gap-2",
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white",
          ].join(" ")}
        >
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}

