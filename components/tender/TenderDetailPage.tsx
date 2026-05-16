import Link from "next/link";
import type { Tender } from "@/types/tender";
import PublicHeader from "@/components/shared/PublicHeader";
import BidCTA from "@/components/tender/BidCTA";
import TenderBidSection from "@/components/tender/TenderBidSection";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCheck({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<string, string> = {
  "Đang nhận báo giá": "bg-green-100 text-green-700 border-green-200",
  "Đã đóng": "bg-slate-100 text-slate-500 border-slate-200",
  "Đã có kết quả": "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const fileTypeBadge: Record<string, string> = {
  PDF: "bg-red-50 text-red-600 border-red-100",
  DOCX: "bg-blue-50 text-blue-600 border-blue-100",
  XLSX: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Not found state ──────────────────────────────────────────────────────────

function NotFoundState() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5 text-slate-300">
          <IconFile />
        </div>
        <h1 className="text-xl font-bold text-slate-700 mb-2">Không tìm thấy gói thầu</h1>
        <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto">
          Gói thầu bạn tìm kiếm không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Link
          href="/tenders"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0f2d5e] rounded-lg hover:bg-[#0a1e3d] transition-colors"
        >
          <IconArrowLeft />
          Quay lại danh sách gói thầu
        </Link>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TenderDetailPage({ tender }: { tender: Tender | undefined }) {
  if (!tender) return <NotFoundState />;

  const statusCls = statusConfig[tender.status] ?? statusConfig["Đã đóng"];

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      {/* Breadcrumb + title bar */}
      <div className="bg-white border-b border-slate-100 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <Link href="/" className="hover:text-slate-600 transition-colors">Trang chủ</Link>
            <span>›</span>
            <Link href="/tenders" className="hover:text-slate-600 transition-colors">Gói thầu</Link>
            <span>›</span>
            <span className="text-slate-600 font-medium">Chi tiết gói thầu</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-xs font-mono text-slate-400">{tender.code}</span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusCls}`}>
                  {tender.status}
                </span>
              </div>
              <h1 className="text-xl font-bold text-[#0f2d5e] leading-snug max-w-3xl">{tender.name}</h1>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 text-sm text-slate-500">
              <IconCalendar />
              <span>Hạn nộp: <span className="font-semibold text-slate-700">{tender.deadline}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="lg:grid lg:grid-cols-3 lg:gap-7">

          {/* ── Left: main content ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Thông tin chung */}
            <Section title="Thông tin chung">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                {[
                  { label: "Nhóm hàng", value: tender.category },
                  { label: "Bên mời thầu", value: tender.inviter },
                  { label: "Hạn nộp hồ sơ", value: tender.deadline },
                  { label: "Giá trị dự kiến", value: tender.value, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-400 mb-1">{label}</div>
                    <div className={`text-sm font-semibold ${highlight ? "text-[#0f2d5e]" : "text-slate-700"}`}>{value}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-2">Mô tả gói thầu</div>
                <p className="text-sm text-slate-600 leading-relaxed">{tender.description}</p>
              </div>
            </Section>

            {/* Danh sách vật tư / hàng hóa */}
            <Section title="Danh sách vật tư / hàng hóa">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-medium text-slate-400 pb-2.5 pr-3 w-8">STT</th>
                      <th className="text-left text-xs font-medium text-slate-400 pb-2.5 pr-3">Tên hàng</th>
                      <th className="text-left text-xs font-medium text-slate-400 pb-2.5 pr-3">Quy cách / Thông số</th>
                      <th className="text-right text-xs font-medium text-slate-400 pb-2.5 pr-3 whitespace-nowrap">Số lượng</th>
                      <th className="text-left text-xs font-medium text-slate-400 pb-2.5 pr-3">Đơn vị</th>
                      <th className="text-left text-xs font-medium text-slate-400 pb-2.5">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tender.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sm text-slate-400">
                          Chưa có danh sách vật tư.
                        </td>
                      </tr>
                    ) : (
                      tender.items.map((item, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          <td className="py-3 pr-3 text-xs text-slate-400">{i + 1}</td>
                          <td className="py-3 pr-3">
                            {item.materialCode && <div className="font-mono text-[11px] text-slate-400 mb-0.5">{item.materialCode}</div>}
                            <div className="font-medium text-slate-800">{item.name}</div>
                          </td>
                          <td className="py-3 pr-3 text-slate-500 text-xs leading-relaxed max-w-xs">{item.spec}</td>
                          <td className="py-3 pr-3 text-right font-semibold text-slate-700 whitespace-nowrap">{item.quantity.toLocaleString("vi-VN")}</td>
                          <td className="py-3 pr-3 text-slate-500 text-xs whitespace-nowrap">{item.unit}</td>
                          <td className="py-3 text-slate-400 text-xs leading-relaxed">{item.note ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Điều kiện thương mại */}
            <Section title="Điều kiện thương mại">
              <div className="grid gap-4">
                {[
                  { label: "Địa điểm giao hàng", value: tender.commercialTerms.deliveryLocation },
                  { label: "Thời gian giao hàng dự kiến", value: tender.commercialTerms.deliveryTime },
                  { label: "Điều kiện thanh toán", value: tender.commercialTerms.paymentTerms },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col sm:flex-row sm:gap-4">
                    <div className="sm:w-52 text-xs font-medium text-slate-500 mb-0.5 sm:mb-0 sm:pt-0.5 flex-shrink-0">{label}</div>
                    <div className="text-sm text-slate-700 flex-1">{value}</div>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row sm:gap-4">
                  <div className="sm:w-52 text-xs font-medium text-slate-500 mb-2 sm:mb-0 sm:pt-0.5 flex-shrink-0">Yêu cầu hồ sơ báo giá</div>
                  <ul className="flex-1 space-y-1.5">
                    {tender.commercialTerms.quotationRequirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-0.5 flex-shrink-0 w-4 h-4 bg-[#0f2d5e]/10 rounded-full flex items-center justify-center text-[#0f2d5e]">
                          <IconCheck size={10} />
                        </span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>

            {/* Tài liệu mời thầu */}
            <Section title="Tài liệu mời thầu">
              <div className="space-y-2.5">
                {tender.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors group">
                    <div className="flex-shrink-0 w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
                      <IconFile />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 truncate">{doc.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{doc.size}</div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${fileTypeBadge[doc.fileType] ?? fileTypeBadge.PDF}`}>
                      {doc.fileType}
                    </span>
                    <button
                      type="button"
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0f2d5e] transition-colors px-2.5 py-1.5 rounded-md hover:bg-[#0f2d5e]/5"
                    >
                      <IconDownload />
                      Tải xuống
                    </button>
                  </div>
                ))}
              </div>
            </Section>

            {/* Bid section (visible to internal/supplier only) */}
            <TenderBidSection tenderId={tender.id} />

            {/* Timeline */}
            <Section title="Tiến độ gói thầu">
              <div className="relative">
                {tender.timeline.map((event, i) => (
                  <div key={i} className="flex gap-4 pb-7 last:pb-0 relative">
                    {/* Vertical connector */}
                    {i < tender.timeline.length - 1 && (
                      <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${event.completed ? "bg-[#0f2d5e]/30" : "bg-slate-200"}`} />
                    )}
                    {/* Step circle */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${
                      event.completed
                        ? "bg-[#0f2d5e] border-[#0f2d5e] text-white"
                        : "bg-white border-slate-300 text-slate-400"
                    }`}>
                      {event.completed
                        ? <IconCheck size={13} />
                        : <span className="text-xs font-medium">{i + 1}</span>
                      }
                    </div>
                    {/* Content */}
                    <div className="pt-0.5">
                      <div className={`text-sm font-medium ${event.completed ? "text-slate-800" : "text-slate-400"}`}>
                        {event.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{event.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

          </div>

          {/* ── Right: sidebar ────────────────────────────────────────────── */}
          <div className="mt-5 lg:mt-0 lg:col-span-1">
            <div className="lg:sticky lg:top-24 flex flex-col gap-4">

              {/* Summary card */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Tóm tắt gói thầu</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Trạng thái</div>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCls}`}>
                      {tender.status}
                    </span>
                  </div>
                  {[
                    { label: "Mã gói thầu", value: tender.code },
                    { label: "Nhóm hàng", value: tender.category },
                    { label: "Bên mời thầu", value: tender.inviter },
                    { label: "Hạn nộp hồ sơ", value: tender.deadline },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-xs text-slate-400 mb-0.5">{label}</div>
                      <div className="text-sm font-medium text-slate-700">{value}</div>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-slate-100">
                    <div className="text-xs text-slate-400 mb-0.5">Giá trị dự kiến</div>
                    <div className="text-base font-bold text-[#0f2d5e]">{tender.value}</div>
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              <BidCTA tenderId={tender.id} tenderCode={tender.code} tenderStatus={tender.status} />

              <Link
                href="/tenders"
                className="w-full flex items-center justify-center gap-2 border border-slate-300 text-slate-600 font-medium text-sm py-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <IconArrowLeft />
                Quay lại danh sách
              </Link>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
