"use client";

/**
 * FileList — renders a list of uploaded files with download and optional delete.
 * Download opens the file in a new tab via /api/uploads/[id].
 * Delete calls DELETE /api/uploads/[id] and invokes onDeleted callback.
 */
import { useState } from "react";
import type { Upload } from "@/types/upload";

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function mimeIcon(mimeType?: string): string {
  if (!mimeType) return "📄";
  if (mimeType === "application/pdf") return "📕";
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  if (mimeType.includes("zip")) return "🗜️";
  return "📄";
}

interface FileListProps {
  uploads: Upload[];
  canDelete?: boolean;
  onDeleted?: (id: string) => void;
  emptyText?: string;
}

export function FileList({
  uploads,
  canDelete = false,
  onDeleted,
  emptyText = "Chưa có tài liệu nào",
}: FileListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string, filename: string) {
    if (!confirm(`Xóa tệp "${filename}"?`)) return;
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/uploads/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? "Xóa thất bại");
      }
      onDeleted?.(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xóa thất bại");
    } finally {
      setDeleting(null);
    }
  }

  if (uploads.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-4 text-center">{emptyText}</p>
    );
  }

  return (
    <div className="space-y-1">
      {error && (
        <p className="text-xs text-red-600 mb-2">{error}</p>
      )}
      {uploads.map((u) => (
        <div
          key={u.id}
          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:border-slate-300 transition-colors group"
        >
          {/* Icon */}
          <span className="text-xl leading-none flex-shrink-0" aria-hidden>
            {mimeIcon(u.mimeType)}
          </span>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{u.filename}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {[formatBytes(u.sizeBytes), formatDate(u.createdAt)].filter(Boolean).join(" · ")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Download / view */}
            <a
              href={`/api/uploads/${u.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              title="Tải xuống"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Tải xuống
            </a>

            {/* Delete */}
            {canDelete && (
              <button
                onClick={() => void handleDelete(u.id, u.filename)}
                disabled={deleting === u.id}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                title="Xóa"
              >
                {deleting === u.id ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                Xóa
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
