import { fail, ok, unauthorized, forbidden } from "@/lib/api";
import {
  actorFromSession,
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  withActorFallback,
} from "@/lib/activity-log";
import { getServerSession } from "@/lib/auth/server";
import {
  createUploadRecord,
  getBid,
  listUploads,
} from "@/lib/repositories/procurehub";
import {
  saveFile,
  isMimeAllowed,
  isSizeAllowed,
  MAX_FILE_SIZE,
} from "@/lib/storage/files";
import type { UploadEntityType, UploadPurpose } from "@/types/upload";

export const dynamic = "force-dynamic";

// ── Auth guard helper ─────────────────────────────────────────────────────────

/**
 * Verify that the current session is allowed to upload for the given entity.
 * - Internal users: always allowed
 * - Supplier: can only upload for their own supplier record or their own bid
 */
async function canUpload(
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>,
  entityType: UploadEntityType,
  entityId: string,
): Promise<boolean> {
  if (session.kind === "internal") return true;
  // Supplier
  if (entityType === "supplier") return entityId === session.sub;
  if (entityType === "bid") {
    const bid = await getBid(entityId);
    // Bid not yet created (pre-submission upload with pre-generated UUID) —
    // allow any authenticated supplier. UUID v4 collision risk is negligible.
    if (!bid) return session.kind === "supplier";
    return bid.supplierId === session.sub;
  }
  return false;
}

// ── POST /api/uploads — upload a file ────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Fast-reject oversized requests before reading body (Route Handler — next.config
    // serverActions.bodySizeLimit does NOT apply here, only to Server Actions).
    const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_FILE_SIZE + 4096) {
      return fail(new Error("File quá lớn. Tối đa 25 MB."), 413);
    }

    const session = await getServerSession();
    if (!session) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityType = (formData.get("entityType") as UploadEntityType | null);
    const entityId = formData.get("entityId") as string | null;
    const purpose = (formData.get("purpose") as UploadPurpose | null) ?? undefined;

    if (!file) return fail(new Error("Không tìm thấy file trong request"), 400);
    if (!entityType || !entityId)
      return fail(new Error("entityType và entityId là bắt buộc"), 400);

    // MIME validation
    const mimeType = file.type || "";
    if (!isMimeAllowed(mimeType))
      return fail(
        new Error(
          `Loại file không được phép: ${mimeType || "(unknown)"}. Chấp nhận: PDF, Word, Excel, JPEG, PNG, ZIP.`,
        ),
        400,
      );

    // Size validation
    if (!isSizeAllowed(file.size))
      return fail(
        new Error(`File quá lớn (${(file.size / 1024 / 1024).toFixed(1)} MB). Tối đa 25 MB.`),
        400,
      );

    // Permission check
    const allowed = await canUpload(session, entityType, entityId);
    if (!allowed) return forbidden("Bạn không có quyền upload cho đối tượng này");

    // Write to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const storedName = await saveFile(entityType, entityId, file.name, buffer);

    // Persist metadata
    const upload = await createUploadRecord({
      entityType,
      entityId,
      uploadedBy: session.sub,
      uploadedByKind: session.kind,
      filename: file.name,
      storedName,
      mimeType,
      sizeBytes: file.size,
      purpose,
    });

    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), actorFromSession(session)),
      entityType: entityType as "supplier" | "bid" | "tender",
      entityId,
      action: "file_uploaded",
      description: describeActivity(entityType as "supplier" | "bid" | "tender", "file_uploaded", file.name),
      metadata: {
        uploadId: upload.id,
        filename: file.name,
        storedName,
        sizeBytes: file.size,
        mimeType,
        purpose,
      },
      oldValues: null,
      newValues: null,
    });

    return ok(upload);
  } catch (error) {
    return fail(error);
  }
}

// ── GET /api/uploads?entityType=X&entityId=Y ─────────────────────────────────

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") as UploadEntityType | null;
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId)
      return fail(new Error("entityType và entityId là bắt buộc"), 400);

    // Permission check (same as upload)
    const allowed = await canUpload(session, entityType, entityId);
    if (!allowed) return forbidden();

    const uploads = await listUploads(entityType, entityId);
    return ok(uploads);
  } catch (error) {
    return fail(error);
  }
}
