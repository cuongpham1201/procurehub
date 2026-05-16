import { fail, ok, unauthorized, forbidden } from "@/lib/api";
import {
  actorFromSession,
  getActorFromRequest,
  logActivitySafe,
  withActorFallback,
} from "@/lib/activity-log";
import { getServerSession } from "@/lib/auth/server";
import {
  deleteUploadRecord,
  getBid,
  getUpload,
} from "@/lib/repositories/procurehub";
import { deleteFile, openFileStream, extToMime } from "@/lib/storage/files";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

// ── Auth guard ────────────────────────────────────────────────────────────────

async function canAccess(
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>,
  upload: NonNullable<Awaited<ReturnType<typeof getUpload>>>,
): Promise<boolean> {
  if (session.kind === "internal") return true;
  // Supplier can access files they own or files belonging to their entities
  if (upload.uploadedByKind === "supplier" && upload.uploadedBy === session.sub)
    return true;
  if (upload.entityType === "supplier" && upload.entityId === session.sub)
    return true;
  if (upload.entityType === "bid") {
    const bid = await getBid(upload.entityId);
    return bid?.supplierId === session.sub;
  }
  return false;
}

// ── GET /api/uploads/[id] — serve file ───────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorized();

    const { id } = await params;
    const upload = await getUpload(id);
    if (!upload) return fail(new Error("File không tồn tại"), 404);

    if (!(await canAccess(session, upload))) return forbidden();

    // Stream file from disk
    const stream = openFileStream(upload.entityType, upload.entityId, upload.storedName);
    const mimeType = upload.mimeType || extToMime(upload.storedName);

    // Convert Node.js Readable to Web ReadableStream
    const webStream = Readable.toWeb(stream) as ReadableStream;

    return new Response(webStream, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(upload.filename)}"`,
        "Cache-Control": "private, max-age=3600",
        ...(upload.sizeBytes ? { "Content-Length": String(upload.sizeBytes) } : {}),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("File not found")) {
      return fail(new Error("File không còn trên server"), 404);
    }
    return fail(error);
  }
}

// ── DELETE /api/uploads/[id] ──────────────────────────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorized();

    const { id } = await params;
    const upload = await getUpload(id);
    if (!upload) return fail(new Error("File không tồn tại"), 404);

    // Only the uploader or internal users can delete
    const isOwner = upload.uploadedBy === session.sub;
    const isInternal = session.kind === "internal";
    if (!isOwner && !isInternal) return forbidden("Chỉ người upload hoặc admin mới có thể xóa file");

    await deleteFile(upload.entityType, upload.entityId, upload.storedName);
    await deleteUploadRecord(id);

    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), actorFromSession(session)),
      entityType: upload.entityType as "supplier" | "bid" | "tender",
      entityId: upload.entityId,
      action: "file_deleted",
      description: `Xóa tài liệu: ${upload.filename}`,
      metadata: {
        uploadId: id,
        filename: upload.filename,
        purpose: upload.purpose,
      },
      oldValues: null,
      newValues: null,
    });

    return ok(true);
  } catch (error) {
    return fail(error);
  }
}
