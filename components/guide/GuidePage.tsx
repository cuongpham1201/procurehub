"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PublicHeader from "@/components/shared/PublicHeader";

type RoleKey = "supplier" | "admin" | "khvt" | "viewer";

type GuideSection = {
  title: string;
  overview: string;
  features: string[];
  steps: { title: string; items: string[] }[];
  notes: string[];
  illustration: string;
};

const ROLE_TABS: { key: RoleKey; label: string; shortLabel: string }[] = [
  { key: "supplier", label: "Nhà cung cấp", shortLabel: "NCC" },
  { key: "admin", label: "Admin", shortLabel: "Admin" },
  { key: "khvt", label: "Kế hoạch vật tư", shortLabel: "KHVT" },
  { key: "viewer", label: "Chỉ xem", shortLabel: "Chỉ xem" },
];

const GUIDE_DATA: Record<RoleKey, GuideSection> = {
  supplier: {
    title: "Dành cho Nhà cung cấp",
    overview:
      "Nhà cung cấp dùng ProcureHub để đăng ký tài khoản, hoàn thiện hồ sơ năng lực, xem gói thầu đang mở, nộp báo giá và theo dõi kết quả.",
    features: [
      "Đăng ký tài khoản nhà cung cấp",
      "Hoàn thiện và gửi hồ sơ năng lực",
      "Theo dõi trạng thái hồ sơ",
      "Xem gói thầu đang mở hoặc sắp đóng",
      "Nộp báo giá theo từng dòng vật tư",
      "Xem báo giá đã nộp và kết quả lựa chọn",
    ],
    steps: [
      {
        title: "1. Đăng ký tài khoản nhà cung cấp",
        items: [
          "Vào /supplier/register-account.",
          "Nhập tên công ty, email, mật khẩu, người liên hệ và số điện thoại.",
          "Sau khi đăng ký, dùng email và mật khẩu để đăng nhập.",
        ],
      },
      {
        title: "2. Hoàn thiện hồ sơ năng lực",
        items: [
          "Vào /supplier/profile.",
          "Bổ sung MST, địa chỉ, tỉnh/thành, giới thiệu doanh nghiệp và nhóm hàng cung cấp.",
          "Theo dõi trạng thái: Chưa hoàn thiện, Chờ xét duyệt, Yêu cầu bổ sung, Đã duyệt hoặc Từ chối.",
        ],
      },
      {
        title: "3. Điều kiện được nộp báo giá",
        items: [
          "Chỉ nhà cung cấp có trạng thái Đã duyệt mới được nộp báo giá.",
          "Nhà cung cấp chưa duyệt vẫn xem được gói thầu đang mở nhưng không gửi báo giá.",
        ],
      },
      {
        title: "4. Xem và tìm gói thầu",
        items: [
          "Vào /tenders.",
          "Tìm kiếm theo mã, tên gói thầu hoặc nhóm hàng.",
          "Nhà cung cấp chỉ thấy gói đang mở hoặc sắp đóng. Gói đã đóng chỉ xem được nếu đã từng nộp báo giá.",
        ],
      },
      {
        title: "5. Nộp báo giá",
        items: [
          "Mở chi tiết gói thầu và bấm Nộp báo giá.",
          "Nhập đơn giá theo từng dòng vật tư, kiểm tra tổng giá trị và gửi báo giá.",
          "MVP hiện tại chưa cho nộp trùng một gói thầu.",
        ],
      },
      {
        title: "6. Xem báo giá và kết quả",
        items: [
          "Vào /supplier/bids để xem các báo giá đã nộp.",
          "Theo dõi trạng thái: Đã nộp, Đang đánh giá, Cần làm rõ, Được chọn hoặc Không được chọn.",
          "Nếu báo giá được chọn, hệ thống hiển thị badge Được chọn.",
        ],
      },
    ],
    notes: [
      "Thông tin báo giá của nhà cung cấp chỉ hiển thị cho chính nhà cung cấp đó và người dùng nội bộ có quyền.",
      "Nếu hồ sơ bị yêu cầu bổ sung, cần cập nhật lại hồ sơ trước khi được xét duyệt tiếp.",
    ],
    illustration: "Minh họa: Form nộp báo giá theo từng mặt hàng",
  },
  admin: {
    title: "Dành cho Admin",
    overview:
      "Admin quản trị toàn hệ thống: gói thầu, danh mục mua sắm, nhà cung cấp, báo giá, so sánh báo giá, chọn nhà cung cấp trúng thầu và người dùng.",
    features: [
      "Xem dashboard tổng quan và hoạt động gần đây",
      "Tạo, sửa, phát hành và cập nhật trạng thái gói thầu",
      "Quản lý nhóm mua sắm và mã vật tư",
      "Duyệt, yêu cầu bổ sung hoặc từ chối hồ sơ nhà cung cấp",
      "Xem, lọc, so sánh báo giá và chọn nhà cung cấp trúng thầu",
      "Quản lý tài khoản nội bộ và tài khoản nhà cung cấp",
    ],
    steps: [
      {
        title: "1. Quản lý dashboard",
        items: [
          "Vào /admin để xem KPI tổng quan, hoạt động gần đây và việc cần xử lý.",
          "Các số liệu lấy từ dữ liệu localStorage hiện tại của MVP.",
        ],
      },
      {
        title: "2. Quản lý gói thầu",
        items: [
          "Vào /admin/tenders để xem danh sách gói thầu.",
          "Tạo gói thầu, chọn nhóm mua sắm, thêm danh sách vật tư và điều kiện thương mại.",
          "Có thể chọn mã vật tư có sẵn hoặc tạo nhanh mã vật tư mới ngay trong form.",
          "Cập nhật trạng thái gói thầu khi quy trình thay đổi.",
        ],
      },
      {
        title: "3. Vòng đời gói thầu",
        items: [
          "Nháp: chưa public cho nhà cung cấp.",
          "Đang nhận báo giá: nhà cung cấp đã duyệt được nộp báo giá.",
          "Đã đóng: gói đang mở còn không quá 3 ngày đến hạn nộp.",
          "Đã đóng: dừng nhận báo giá.",
          "Đang đánh giá: admin so sánh báo giá.",
          "Đã có kết quả: đã chọn nhà cung cấp.",
          "Đã hủy: ngừng xử lý.",
        ],
      },
      {
        title: "4. Tự động đóng thầu và sắp đóng",
        items: [
          "Nếu hạn nộp nhỏ hơn hôm nay, gói đang mở hoặc sắp đóng tự chuyển sang Đã đóng.",
          "Nếu hạn nộp còn từ 0 đến 3 ngày, gói tự chuyển sang Đã đóng.",
          "Admin có thể mở lại gói đã đóng bằng hạn nộp mới nếu cần.",
        ],
      },
      {
        title: "5. Quản lý nhóm mua sắm và mã vật tư",
        items: [
          "Vào /admin/categories.",
          "Thêm, sửa hoặc khóa nhóm mua sắm.",
          "Quản lý mã vật tư theo từng nhóm. Mã vật tư được dùng để tự fill dòng hàng trong gói thầu.",
        ],
      },
      {
        title: "6. Quản lý nhà cung cấp và báo giá",
        items: [
          "Vào /admin/suppliers để xem hồ sơ, duyệt, yêu cầu bổ sung hoặc từ chối.",
          "Vào /admin/bids để xem toàn bộ báo giá, search, filter, sort và xem chi tiết.",
          "Có thể xóa báo giá test nếu cần trong phạm vi dữ liệu localStorage.",
        ],
      },
      {
        title: "7. So sánh báo giá và chọn nhà cung cấp",
        items: [
          "Vào /admin/bid-comparison.",
          "Chỉ so sánh gói đang ở trạng thái Đang đánh giá.",
          "So sánh tổng giá trị và từng dòng vật tư.",
          "Khi chọn nhà cung cấp: bid được chọn thành Được chọn, bid khác thành Không được chọn, tender thành Đã có kết quả.",
        ],
      },
      {
        title: "8. Quản lý người dùng",
        items: [
          "Vào /admin/users để quản lý tài khoản nội bộ và tài khoản nhà cung cấp.",
          "Có thể khóa, mở khóa hoặc reset mật khẩu mock theo quyền Admin.",
        ],
      },
    ],
    notes: [
      "Các thao tác quản trị nhạy cảm như quản lý danh mục, mở thầu lại, xóa dữ liệu test và quản lý user chỉ dành cho Admin.",
      "Hệ thống hiện là MVP localStorage-first, chưa có backend thật.",
    ],
    illustration: "Minh họa: Dashboard admin và bảng so sánh báo giá",
  },
  khvt: {
    title: "Dành cho Kế hoạch vật tư",
    overview:
      "Kế hoạch vật tư theo dõi tiến độ gói thầu, xem báo giá, hỗ trợ cập nhật gói thầu nếu được phân quyền và theo dõi so sánh báo giá.",
    features: [
      "Xem dashboard và danh sách gói thầu",
      "Theo dõi trạng thái gói thầu",
      "Tạo hoặc cập nhật gói thầu nếu role hiện tại cho phép",
      "Xem báo giá nhà cung cấp đã nộp",
      "Theo dõi trang so sánh báo giá nếu được phân quyền",
    ],
    steps: [
      {
        title: "1. Xem tổng quan",
        items: [
          "Vào /admin để theo dõi dashboard, hoạt động gần đây và việc cần xử lý.",
          "Theo dõi gói sắp đóng, gói chưa có báo giá hoặc báo giá cần xem xét.",
        ],
      },
      {
        title: "2. Theo dõi gói thầu",
        items: [
          "Vào /admin/tenders.",
          "Tìm kiếm, lọc theo nhóm hàng và trạng thái.",
          "Mở chi tiết để xem vật tư, điều kiện thương mại và báo giá liên quan.",
        ],
      },
      {
        title: "3. Xem báo giá và so sánh",
        items: [
          "Vào /admin/bids để xem báo giá đã nộp.",
          "Vào /admin/bid-comparison để xem bảng so sánh nếu được phân quyền.",
          "Không xóa dữ liệu hoặc chọn nhà cung cấp nếu role không cho phép.",
        ],
      },
    ],
    notes: [
      "Không nhất thiết có toàn quyền Admin.",
      "Các thao tác nhạy cảm như xóa gói thầu, mở thầu lại, quản lý danh mục và quản lý user chỉ dành cho Admin theo rule hiện tại.",
    ],
    illustration: "Minh họa: Danh sách gói thầu và báo giá",
  },
  viewer: {
    title: "Dành cho người dùng Chỉ xem",
    overview:
      "Role Chỉ xem dùng để theo dõi tình trạng mua sắm và dữ liệu đã được phân quyền mà không thay đổi dữ liệu.",
    features: [
      "Xem dữ liệu được phân quyền",
      "Theo dõi gói thầu, nhà cung cấp và báo giá",
      "Không tạo, sửa, xóa hoặc chọn nhà cung cấp",
      "Không khóa, mở tài khoản hoặc quản lý danh mục",
    ],
    steps: [
      {
        title: "1. Xem dữ liệu nội bộ",
        items: [
          "Đăng nhập tài khoản nội bộ.",
          "Vào khu vực admin để theo dõi các màn được phép xem.",
          "Dùng search, filter và sort để tra cứu dữ liệu.",
        ],
      },
      {
        title: "2. Theo dõi tình trạng mua sắm",
        items: [
          "Xem trạng thái gói thầu và hạn nộp.",
          "Xem báo giá đã nộp theo quyền hiển thị.",
          "Theo dõi kết quả chọn nhà cung cấp khi tender đã có kết quả.",
        ],
      },
    ],
    notes: [
      "Role Chỉ xem không tạo mới, không sửa, không xóa và không chọn nhà cung cấp.",
      "Nếu cần thao tác nghiệp vụ, liên hệ Admin hoặc phòng kế hoạch vật tư.",
    ],
    illustration: "Minh họa: Màn hình theo dõi nội bộ",
  },
};

const FAQS = [
  {
    question: "NCC chưa được duyệt có nộp báo giá được không?",
    answer: "Không. Chỉ nhà cung cấp có trạng thái Đã duyệt mới được nộp báo giá.",
  },
  {
    question: "Gói thầu đã đóng có xem được không?",
    answer: "Nhà cung cấp chỉ xem được nếu đã từng nộp báo giá cho gói đó. Admin xem được tất cả.",
  },
  {
    question: "Có nộp lại báo giá lần hai được không?",
    answer: "MVP hiện tại chưa cho nộp trùng một gói thầu.",
  },
  {
    question: "Khi nào biết báo giá được chọn?",
    answer: "Vào /supplier/bids để theo dõi trạng thái báo giá.",
  },
  {
    question: "Admin chọn NCC ở đâu?",
    answer: "Tại trang So sánh báo giá.",
  },
];

function CheckIcon() {
  return (
    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0f2d5e]/10 text-[#0f2d5e]">
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
  tone = "white",
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  tone?: "white" | "gold";
}) {
  return (
    <section
      className={[
        "rounded-xl border p-5 shadow-sm",
        tone === "gold"
          ? "border-amber-200 bg-amber-50/70"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#c9a227]">
          {eyebrow}
        </p>
      )}
      <h2 className="mb-3 text-lg font-bold text-[#0f2d5e]">{title}</h2>
      {children}
    </section>
  );
}

function MockMetric({ label, value, tone = "navy" }: { label: string; value: string; tone?: "navy" | "gold" | "green" }) {
  const toneClass = {
    navy: "bg-[#0f2d5e]/10 text-[#0f2d5e]",
    gold: "bg-[#c9a227]/20 text-[#8a6b0b]",
    green: "bg-emerald-50 text-emerald-700",
  }[tone];
  return (
    <div className={`rounded-lg px-3 py-2 ${toneClass}`}>
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[11px] opacity-80">{label}</div>
    </div>
  );
}

function BrowserMockup({ title, role }: { title: string; role: RoleKey }) {
  const rowsByRole: Record<RoleKey, string[]> = {
    supplier: ["GT-2026-001", "Đã nộp", "Đang đánh giá"],
    admin: ["GT-2026-004", "Đã đóng", "3 báo giá"],
    khvt: ["GT-2026-006", "Đang đánh giá", "So sánh"],
    viewer: ["GT-2026-011", "Đã có kết quả", "Chỉ xem"],
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
        <span className="ml-3 truncate text-xs font-semibold text-slate-500">{title}</span>
      </div>
      <div className="bg-slate-50/70 p-5">
        <div className="mb-4 grid grid-cols-3 gap-3">
          <MockMetric label={role === "supplier" ? "Hồ sơ" : "Gói thầu"} value={role === "supplier" ? "Đã duyệt" : "12"} tone="navy" />
          <MockMetric label={role === "admin" ? "Đã đóng" : "Báo giá"} value={role === "admin" ? "3" : "5"} tone="gold" />
          <MockMetric label={role === "viewer" ? "Theo dõi" : "Kết quả"} value={role === "viewer" ? "Read" : "2"} tone="green" />
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="h-3 w-28 rounded bg-slate-200" />
              <div className="mt-2 h-2 w-44 rounded bg-slate-100" />
            </div>
            <div className="h-8 w-24 rounded-lg bg-[#0f2d5e]" />
          </div>
          <div className="space-y-2.5">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="grid grid-cols-12 items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                <div className="col-span-4 h-2.5 rounded bg-slate-300" />
                <div className="col-span-3 text-[11px] font-semibold text-[#0f2d5e]">
                  {rowsByRole[role][idx]}
                </div>
                <div className="col-span-3 h-2.5 rounded bg-slate-200" />
                <div className="col-span-2 h-6 rounded bg-[#c9a227]/25" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepList({ steps }: { steps: GuideSection["steps"] }) {
  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const title = step.title.replace(/^\d+\.\s*/, "");
        return (
        <div key={step.title} className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f2d5e] text-sm font-bold text-white ring-4 ring-[#c9a227]/20">
              {idx + 1}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-3 font-semibold text-slate-900">{title}</h3>
              <ul className="space-y-2">
            {step.items.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a227]" />
                <span>{item}</span>
              </li>
            ))}
              </ul>
            </div>
          </div>
        </div>
      )})}
    </div>
  );
}

function RoleGuide({ guide, role }: { guide: GuideSection; role: RoleKey }) {
  return (
    <div id="role-guide" className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
      <aside className="space-y-5">
        <SectionCard eyebrow="Tổng quan vai trò" title={guide.title}>
          <p className="text-sm leading-7 text-slate-600">{guide.overview}</p>
        </SectionCard>

        <SectionCard title="Chức năng được dùng">
          <div className="space-y-3">
            {guide.features.map((feature) => (
              <div key={feature} className="flex gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-700">
                <CheckIcon />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Lưu ý nghiệp vụ" tone="gold">
          <ul className="space-y-3">
            {guide.notes.map((note) => (
              <li key={note} className="text-sm leading-6 text-slate-700">
                {note}
              </li>
            ))}
          </ul>
        </SectionCard>
      </aside>

      <div className="space-y-5">
        <SectionCard title="Quy trình thao tác">
          <StepList steps={guide.steps} />
        </SectionCard>
        <SectionCard title="Minh họa giao diện">
          <BrowserMockup title={guide.illustration} role={role} />
        </SectionCard>
      </div>
    </div>
  );
}

export default function GuidePage() {
  const [activeRole, setActiveRole] = useState<RoleKey>("supplier");
  const activeGuide = useMemo(() => GUIDE_DATA[activeRole], [activeRole]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <section className="bg-[#0a1e3d] bg-gradient-to-br from-[#07152a] via-[#0f2d5e] to-[#12396f] px-4 py-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-2 w-2 rounded-full bg-[#c9a227]" />
            MVP nội bộ
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white sm:text-5xl">
            Hướng dẫn sử dụng ProcureHub
          </h1>
          <p className="max-w-3xl text-base leading-7 text-white/75">
            Tài liệu thao tác cho nhà cung cấp và người dùng nội bộ Bia Hạ Long.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["Nhà cung cấp", "Quản trị nội bộ", "Theo dõi báo giá"].map((item) => (
              <span key={item} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="sticky top-16 z-20 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur">
          <div className="flex flex-wrap gap-2">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveRole(tab.key)}
                className={[
                  "min-w-0 flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-none",
                  activeRole === tab.key
                    ? "bg-[#0f2d5e] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#0f2d5e]",
                ].join(" ")}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
            <a
              href="#faq"
              className="hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-[#0f2d5e] transition-colors hover:bg-slate-50 md:block md:ml-auto"
            >
              Câu hỏi thường gặp
            </a>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {[
            { label: "Quy trình nhà cung cấp", role: "supplier" as RoleKey },
            { label: "Quản trị gói thầu", role: "admin" as RoleKey },
            { label: "So sánh báo giá", role: "admin" as RoleKey },
            { label: "FAQ", href: "#faq" },
          ].map((item) =>
            "href" in item ? (
              <a key={item.label} href={item.href} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:border-[#c9a227] hover:text-[#0f2d5e]">
                {item.label}
              </a>
            ) : (
              <button key={item.label} type="button" onClick={() => setActiveRole(item.role)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:border-[#c9a227] hover:text-[#0f2d5e]">
                {item.label}
              </button>
            ),
          )}
        </div>

        <RoleGuide guide={activeGuide} role={activeRole} />

        <section id="faq" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#c9a227] mb-2">
                FAQ
              </p>
              <h2 className="text-2xl font-bold text-[#0f2d5e]">Câu hỏi thường gặp</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/tenders" className="rounded-lg border border-[#0f2d5e]/20 px-4 py-2 text-sm font-semibold text-[#0f2d5e] hover:bg-[#0f2d5e] hover:text-white">
                Xem danh sách gói thầu
              </Link>
              <Link href="/supplier/register-account" className="rounded-lg bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#0f2d5e] hover:bg-[#b8960c]">
                Đăng ký nhà cung cấp
              </Link>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {FAQS.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-[#c9a227]/60 hover:bg-white">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-sm leading-6 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
