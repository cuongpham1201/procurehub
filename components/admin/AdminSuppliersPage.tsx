"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccounts } from "@/services/supplierAccountStorage";
import type { SupplierAccount } from "@/types/supplierAccount";

// ── helpers ───────────────────────────────────────────────────────────────

const STATUS_LIST = [
  "Tất cả",
  "Chưa hoàn thiện",
  "Chờ xét duyệt",
  "Yêu cầu bổ sung",
  "Đã duyệt",
  "Từ chối",
  "Tạm khóa",
];

function statusBadge(status: string) {
  switch (status) {
    case "Đã duyệt":
      return "bg-green-100 text-green-700";
    case "Chờ xét duyệt":
      return "bg-blue-100 text-blue-700";
    case "Yêu cầu bổ sung":
      return "bg-amber-100 text-amber-700";
    case "Từ chối":
      return "bg-red-100 text-red-700";
    case "Tạm khóa":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("vi-VN");
  } catch {
    return iso;
  }
}

function shortId(id: string) {
  return "NCC-" + id.slice(-6).toUpperCase();
}

// ── main component ────────────────────────────────────────────────────────

export default function AdminSuppliersPage() {
  const [accounts, setAccounts] = useState<SupplierAccount[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAccounts(getAccounts());
    setLoaded(true);
  }, []);

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.companyName.toLowerCase().includes(q) ||
      a.taxCode.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "Tất cả" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // summary counts
  const total = accounts.length;
  const pending = accounts.filter((a) => a.status === "Chờ xét duyệt").length;
  const approved = accounts.filter((a) => a.status === "Đã duyệt").length;
  const other = accounts.filter(
    (a) => a.status === "Yêu cầu bổ sung" || a.status === "Từ chối"
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Quản lý nhà cung cấp</h2>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi, xét duyệt và quản lý hồ sơ nhà cung cấp tham gia hệ thống đấu thầu.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng NCC", value: total, color: "text-[#0f2d5e]", bg: "bg-blue-50" },
          { label: "Chờ xét duyệt", value: pending, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Đã duyệt", value: approved, color: "text-green-600", bg: "bg-green-50" },
          { label: "Từ chối / Yêu cầu bổ sung", value: other, color: "text-red-500", bg: "bg-red-50" },
        ].map((c) => (
          <div key={c.label} className={`${c.bg} rounded-xl p-4 border border-white`}>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm tên công ty, mã số thuế, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e] bg-white"
        >
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {!loaded ? (
          <div className="py-16 text-center text-sm text-slate-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <svg
              className="w-10 h-10 text-slate-200 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-sm text-slate-500">
              {accounts.length === 0
                ? "Chưa có nhà cung cấp nào đăng ký."
                : "Không tìm thấy nhà cung cấp phù hợp với bộ lọc."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Mã NCC</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Tên công ty</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap hidden md:table-cell">Mã số thuế</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap hidden lg:table-cell">Người liên hệ</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap hidden lg:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap hidden sm:table-cell">Hồ sơ</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap hidden md:table-cell">Ngày đăng ký</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {shortId(a.id)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 leading-tight">{a.companyName}</div>
                      <div className="text-xs text-slate-400 mt-0.5 md:hidden">{a.taxCode}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell whitespace-nowrap">
                      {a.taxCode}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell whitespace-nowrap">
                      {a.contactName}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell whitespace-nowrap">
                      {a.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell whitespace-nowrap">
                      {a.profileCompleted ? (
                        <span className="text-xs text-green-600 font-medium">Hoàn thiện</span>
                      ) : (
                        <span className="text-xs text-slate-400">Chưa hoàn thiện</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell whitespace-nowrap text-xs">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/admin/suppliers/${a.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors"
                      >
                        Xem hồ sơ
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          Hiển thị {filtered.length} / {accounts.length} nhà cung cấp
        </p>
      )}
    </div>
  );
}
