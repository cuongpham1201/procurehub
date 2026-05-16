"use client";

/**
 * FileUploadZone — click-to-browse upload area.
 * POSTs multipart/form-data to /api/uploads.
 * Client-side validates MIME type and size before sending.
 */
import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import type { Upload, UploadEntityType, UploadPurpose } from "@/types/upload";

const DEFAULT_ACCEPT = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "application/zip",
  "application/x-zip-compressed",
];

const MIME_LABEL: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "application/zip": "ZIP",
  "application/x-zip-compressed": "ZIP",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileUploadZoneProps {
  entityType: UploadEntityType;
  entityId: string;
  purpose: UploadPurpose;
  label?: string;
  accept?: string[];   // MIME types allowed
  maxSizeMb?: number;  // default 25
  onUploaded?: (upload: Upload) => void;
  disabled?: boolean;
}

type UploadState = "idle" | "dragging" | "uploading" | "error";

export function FileUploadZone({
  entityType,
  entityId,
  purpose,
  label = "Kéo thả tệp vào đây hoặc nhấn để chọn",
  accept = DEFAULT_ACCEPT,
  maxSizeMb = 25,
  onUploaded,
  disabled = false,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastUploaded, setLastUploaded] = useState<string | null>(null);

  const maxBytes = maxSizeMb * 1024 * 1024;
  const acceptString = accept.join(",");

  function validate(file: File): string | null {
    if (!accept.includes(file.type)) {
      const labels = accept.map((m) => MIME_LABEL[m] ?? m).join(", ");
      return `Định dạng không hỗ trợ. Chỉ chấp nhận: ${labels}`;
    }
    if (file.size > maxBytes) {
      return `Tệp quá lớn (${formatBytes(file.size)}). Giới hạn: ${maxSizeMb} MB`;
    }
    return null;
  }

  async function upload(file: File) {
    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      setState("error");
      return;
    }

    setState("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId);
      formData.append("purpose", purpose);

      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const json = await res.json() as { data?: Upload; error?: string };

      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "Tải lên thất bại");
      }

      setLastUploaded(json.data.filename);
      setState("idle");
      onUploaded?.(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tải lên thất bại");
      setState("error");
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    void upload(files[0]);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (!disabled) setState("dragging");
  }

  function onDragLeave() {
    setState((s) => (s === "dragging" ? "idle" : s));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    // Reset so same file can be re-selected after error
    e.target.value = "";
  }

  const isDragging = state === "dragging";
  const isUploading = state === "uploading";
  const isError = state === "error";

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors select-none",
          disabled
            ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
            : isDragging
            ? "border-blue-400 bg-blue-50 cursor-copy"
            : isUploading
            ? "border-slate-300 bg-slate-50 cursor-wait"
            : isError
            ? "border-red-300 bg-red-50 cursor-pointer"
            : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50 cursor-pointer",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={acceptString}
          onChange={onChange}
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <>
            <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-slate-500">Đang tải lên…</span>
          </>
        ) : (
          <>
            <svg
              className={`w-7 h-7 ${isError ? "text-red-400" : isDragging ? "text-blue-500" : "text-slate-400"}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className={`text-sm font-medium ${isError ? "text-red-600" : "text-slate-600"}`}>
              {isError ? "Thử lại — " : ""}{label}
            </span>
            <span className="text-xs text-slate-400">
              {accept.map((m) => MIME_LABEL[m] ?? m).join(" · ")} · tối đa {maxSizeMb} MB
            </span>
          </>
        )}
      </div>

      {isError && error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {!isError && lastUploaded && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Đã tải lên: {lastUploaded}
        </p>
      )}
    </div>
  );
}
