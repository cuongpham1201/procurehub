export interface BidClarification {
  id: string;
  bidId: string;
  tenderId: string;
  // Request side (admin)
  requestedBy: string;
  requestedByName: string;
  requestNote: string;
  requestedAt: string;
  // Response side (supplier)
  respondedBy?: string;
  respondedByName?: string;
  responseNote?: string;
  respondedAt?: string;
  // Status
  status: "pending" | "responded";
  createdAt: string;
  updatedAt: string;
}
