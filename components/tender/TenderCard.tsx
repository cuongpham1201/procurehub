import Link from "next/link";
import type { Tender } from "@/types/tender";

const statusConfig: Record<string, { className: string }> = {
  "Đang mở": { className: "bg-green-100 text-green-700" },
  "Sắp đóng": { className: "bg-orange-100 text-orange-700" },
  "Đã đóng": { className: "bg-slate-100 text-slate-500" },
  "Đã có kết quả": { className: "bg-indigo-100 text-indigo-700" },
};

export default function TenderCard({ tender }: { tender: Tender }) {
  const statusCfg = statusConfig[tender.status] ?? statusConfig["Đã đóng"];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col gap-3">
      {/* Mã gói thầu + badge trạng thái */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-mono text-slate-400 pt-0.5">
          {tender.code}
        </span>
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${statusCfg.className}`}
        >
          {tender.status}
        </span>
      </div>

      {/* Tên gói thầu */}
      <h3 className="text-sm font-semibold text-slate-800 leading-5">
        {tender.name}
      </h3>

      {/* Mô tả ngắn */}
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
        {tender.description}
      </p>

      {/* Thông tin chi tiết dạng 2 cột */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <div className="text-slate-400 mb-0.5">Nhóm hàng</div>
          <div className="text-slate-700 font-medium">{tender.category}</div>
        </div>
        <div>
          <div className="text-slate-400 mb-0.5">Bên mời thầu</div>
          <div className="text-slate-700 font-medium">{tender.inviter}</div>
        </div>
        <div>
          <div className="text-slate-400 mb-0.5">Hạn nộp hồ sơ</div>
          <div className="text-slate-700 font-medium">{tender.deadline}</div>
        </div>
        <div>
          <div className="text-slate-400 mb-0.5">Giá trị dự kiến</div>
          <div className="text-[#0f2d5e] font-semibold">{tender.value}</div>
        </div>
      </div>

      {/* Nút xem chi tiết */}
      <div className="pt-1 border-t border-slate-100">
        <Link
          href={`/tenders/${tender.id}`}
          className="block w-full text-center text-sm font-medium text-[#0f2d5e] py-2 rounded-lg border border-[#0f2d5e]/25 hover:bg-[#0f2d5e] hover:text-white hover:border-[#0f2d5e] transition-colors"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
}
