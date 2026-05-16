/**
 * lib/storage/files.ts
 *
 * Local-disk file storage helpers.
 * Files are stored at UPLOAD_DIR/{entityType}/{entityId}/{storedName}
 * where storedName is a UUID-based name — never guessable from the original filename.
 *
 * Configure via environment:
 *   UPLOAD_DIR=./uploads   (absolute path recommended in production)
 */
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync, createReadStream } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { ReadStream } from "fs";

// ── Config ────────────────────────────────────────────────────────────────────

export const UPLOAD_DIR: string =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "application/zip",
  "application/x-zip-compressed",
]);

// ── Path helpers ──────────────────────────────────────────────────────────────

export function getEntityDir(entityType: string, entityId: string): string {
  return path.join(UPLOAD_DIR, entityType, entityId);
}

export function getFilePath(
  entityType: string,
  entityId: string,
  storedName: string,
): string {
  return path.join(getEntityDir(entityType, entityId), storedName);
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Save buffer to disk under {UPLOAD_DIR}/{entityType}/{entityId}/{uuid.ext}
 * Returns the stored filename (uuid.ext) — store this in the DB.
 */
export async function saveFile(
  entityType: string,
  entityId: string,
  originalName: string,
  buffer: Buffer,
): Promise<string> {
  const dir = getEntityDir(entityType, entityId);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(originalName).toLowerCase() || "";
  const storedName = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, storedName), buffer);
  return storedName;
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Returns a ReadStream for streaming the file to a Response.
 * Throws if the file does not exist on disk.
 */
export function openFileStream(
  entityType: string,
  entityId: string,
  storedName: string,
): ReadStream {
  const fp = getFilePath(entityType, entityId, storedName);
  if (!existsSync(fp)) {
    throw new Error(`File not found on disk: ${storedName}`);
  }
  return createReadStream(fp);
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete the physical file. Silently ignores if already gone.
 */
export async function deleteFile(
  entityType: string,
  entityId: string,
  storedName: string,
): Promise<void> {
  const fp = getFilePath(entityType, entityId, storedName);
  if (existsSync(fp)) await unlink(fp);
}

// ── Validation helpers ────────────────────────────────────────────────────────

export function isMimeAllowed(mime: string): boolean {
  return ALLOWED_MIME_TYPES.has(mime);
}

export function isSizeAllowed(bytes: number): boolean {
  return bytes > 0 && bytes <= MAX_FILE_SIZE;
}

/** Human-readable file size string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Extension → MIME for serving (fallback when DB mime_type missing) */
export function extToMime(storedName: string): string {
  const ext = path.extname(storedName).toLowerCase();
  const map: Record<string, string> = {
    ".pdf":  "application/pdf",
    ".doc":  "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls":  "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png":  "image/png",
    ".zip":  "application/zip",
  };
  return map[ext] ?? "application/octet-stream";
}
