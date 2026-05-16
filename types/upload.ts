export type UploadEntityType = "supplier" | "bid" | "tender" | "clarification";

export type UploadPurpose =
  | "capability_doc"
  | "bid_attachment"
  | "tender_spec"
  | "clarification_attachment";

export interface Upload {
  id: string;
  entityType: UploadEntityType;
  entityId: string;
  uploadedBy?: string;
  uploadedByKind?: "internal" | "supplier";
  /** Original filename shown to users */
  filename: string;
  /** UUID-based name stored on disk — never guessable */
  storedName: string;
  mimeType?: string;
  sizeBytes?: number;
  purpose?: UploadPurpose;
  createdAt: string;
}

export type UploadInput = Omit<Upload, "id" | "createdAt">;
