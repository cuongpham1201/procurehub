-- Phase 3: Lifecycle status renames
-- Tender: "Đang mở" → "Đang nhận báo giá", "Sắp đóng" → "Đã đóng"
-- Bid:    "Chờ xem xét" → "Đang xem xét", "Cần bổ sung" → "Cần làm rõ", "Đã bổ sung" → "Đã phản hồi"
-- Thêm tender status: "Chờ phê duyệt"
-- Thêm bid status:    "Đề xuất chọn"
-- (Không cần ALTER TABLE — status là TEXT column, chỉ cần UPDATE rows)

UPDATE tenders SET status = 'Đang nhận báo giá' WHERE status = 'Đang mở';
UPDATE tenders SET status = 'Đã đóng'           WHERE status = 'Sắp đóng';

UPDATE bids SET status = 'Đang xem xét' WHERE status = 'Chờ xem xét';
UPDATE bids SET status = 'Cần làm rõ'   WHERE status = 'Cần bổ sung';
UPDATE bids SET status = 'Đã phản hồi'  WHERE status = 'Đã bổ sung';
