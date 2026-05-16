/**
 * GET /api/export/tenders/[id]
 * Xuất báo cáo kết quả gói thầu ra file Excel (.xlsx).
 * Chỉ dành cho internal users; tender phải ở trạng thái "Đã có kết quả".
 */
import { fail, unauthorized } from "@/lib/api";
import { getServerSession } from "@/lib/auth/server";
import {
  getTender,
  getBidsByTender,
  listAwardItems,
} from "@/lib/repositories/procurehub";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

function fmt(n: number): string {
  return n.toLocaleString("vi-VN");
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("vi-VN"); } catch { return iso; }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();

    const { id } = await params;
    const [tender, bids, awardItems] = await Promise.all([
      getTender(id),
      getBidsByTender(id),
      listAwardItems(id),
    ]);

    if (!tender) return fail(new Error("Gói thầu không tồn tại"), 404);

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Thông tin gói thầu ──────────────────────────────────────────
    const infoRows = [
      ["BIÊN BẢN KẾT QUẢ XỬ LÝ BÁO GIÁ"],
      [],
      ["Mã gói thầu", tender.code],
      ["Tên gói thầu", tender.title],
      ["Nhóm hàng", tender.category],
      ["Hạn nộp hồ sơ", fmtDate(tender.deadline)],
      ["Giá trị dự kiến (₫)", tender.estimatedValue > 0 ? fmt(tender.estimatedValue) : "—"],
      ["Trạng thái", tender.status],
      [],
      ["Tổng số NCC tham gia", bids.length],
      ["NCC được chọn", bids.filter((b) => b.status === "Được chọn").length],
      ["Tổng giá trị trúng thầu (₫)", fmt(
        bids.filter((b) => b.status === "Được chọn").reduce((s, b) => s + (b.totalAmount ?? 0), 0),
      )],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(infoRows);
    wsInfo["!cols"] = [{ wch: 30 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, "Thông tin gói thầu");

    // ── Sheet 2: Kết quả chọn thầu ───────────────────────────────────────────
    const awardHeader = [
      "STT", "Tên mặt hàng", "Số lượng", "ĐVT",
      "NCC được chọn", "Đơn giá (₫)", "Thành tiền (₫)", "Ghi chú",
    ];
    const awardRows: (string | number)[][] = [awardHeader];

    const itemMap = new Map<string, { itemName: string; quantity: number; unit: string }>();
    for (const bid of bids) {
      for (const item of (bid.items ?? [])) {
        if (!itemMap.has(item.tenderItemId ?? item.id)) {
          itemMap.set(item.tenderItemId ?? item.id, {
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
          });
        }
      }
    }

    let stt = 1;
    for (const award of awardItems) {
      const tenderItem = itemMap.get(award.tenderItemId);
      awardRows.push([
        stt++,
        tenderItem?.itemName ?? "—",
        award.quantity,
        tenderItem?.unit ?? "—",
        award.supplierName ?? "—",
        award.unitPrice,
        award.amount,
        award.note ?? "",
      ]);
    }

    if (awardItems.length === 0) {
      awardRows.push(["Chưa có kết quả chọn thầu"]);
    }

    const wsAward = XLSX.utils.aoa_to_sheet(awardRows);
    wsAward["!cols"] = [
      { wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 8 },
      { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsAward, "Kết quả chọn thầu");

    // ── Sheet 3: Bảng so sánh báo giá ───────────────────────────────────────
    const wonBids   = bids.filter((b) => b.status === "Được chọn");
    const otherBids = bids.filter((b) => b.status !== "Được chọn");
    const allBids   = [...wonBids, ...otherBids];

    const compHeader: (string | number)[] = [
      "STT", "Tên mặt hàng", "SL", "ĐVT",
      ...allBids.map((b) => `${b.supplierName ?? b.bidCode} (${b.status === "Được chọn" ? "✓" : ""})`),
    ];
    const compRows: (string | number)[][] = [compHeader];

    for (const [idx, tenderItem] of (tender.items ?? []).entries()) {
      const row: (string | number)[] = [
        idx + 1,
        tenderItem.itemName,
        tenderItem.quantity,
        tenderItem.unit,
        ...allBids.map((bid) => {
          const bidItem = (bid.items ?? []).find(
            (it) => it.tenderItemId === tenderItem.id,
          );
          return bidItem?.unitPrice ?? 0;
        }),
      ];
      compRows.push(row);
    }

    // Dòng tổng
    compRows.push([
      "", "TỔNG GIÁ TRỊ BÁO GIÁ", "", "",
      ...allBids.map((b) => b.totalAmount ?? 0),
    ]);

    const wsComp = XLSX.utils.aoa_to_sheet(compRows);
    wsComp["!cols"] = [
      { wch: 5 }, { wch: 30 }, { wch: 8 }, { wch: 8 },
      ...allBids.map(() => ({ wch: 22 })),
    ];
    XLSX.utils.book_append_sheet(wb, wsComp, "So sánh báo giá");

    // ── Stream response ───────────────────────────────────────────────────────
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const filename = `ket-qua-goi-thau-${tender.code ?? id}.xlsx`;

    return new Response(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
