"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { getActivityLogs } from "@/services/activityStorage";
import type {
  ActivityAction,
  ActivityEntityType,
  ActivityLog,
  ActivityLogFilters,
} from "@/types/activityLog";
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ACTIONS,
  ACTIVITY_ENTITY_LABELS,
  ACTIVITY_ENTITY_TYPES,
} from "@/types/activityLog";

const PAGE_SIZE_OPTIONS = [50, 100] as const;

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
}

function actionBadgeClass(action: ActivityAction): string {
  if (action === "created" || action === "submitted") return "bg-green-100 text-green-700";
  if (action === "updated" || action === "evaluated") return "bg-blue-100 text-blue-700";
  if (action === "published" || action === "approved" || action === "awarded") return "bg-indigo-100 text-indigo-700";
  if (action === "cancelled" || action === "rejected" || action === "deactivated" || action === "withdrawn" || action === "locked") {
    return "bg-red-100 text-red-600";
  }
  return "bg-slate-100 text-slate-600";
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 px-4 py-3 text-xs text-slate-100">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default function AdminActivityLogsPage() {
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState<ActivityEntityType | "">("");
  const [action, setAction] = useState<ActivityAction | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [limit, setLimit] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(50);
  const [offset, setOffset] = useState(0);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters = useMemo<ActivityLogFilters>(
    () => ({
      search: search.trim(),
      entityType,
      action,
      fromDate,
      toDate,
      limit,
      offset,
    }),
    [action, entityType, fromDate, limit, offset, search, toDate],
  );

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const response = await getActivityLogs(filters);
        setLogs(response.items);
        setTotal(response.total);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [filters]);

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function handleFilterChange(reset?: Partial<ActivityLogFilters>) {
    if (reset?.search !== undefined) setSearch(reset.search);
    if (reset?.entityType !== undefined) setEntityType(reset.entityType as ActivityEntityType | "");
    if (reset?.action !== undefined) setAction(reset.action as ActivityAction | "");
    if (reset?.fromDate !== undefined) setFromDate(reset.fromDate);
    if (reset?.toDate !== undefined) setToDate(reset.toDate);
    setOffset(0);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Activity Log</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Theo dõi toàn bộ thay đổi nghiệp vụ quan trọng trong hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-bold text-[#0f2d5e]">{total}</div>
          <div className="text-xs text-slate-500 mt-0.5">Tổng log theo bộ lọc</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-bold text-green-600">
            {logs.filter((item) => item.action === "created" || item.action === "submitted").length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Tạo mới / nộp trong trang hiện tại</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-bold text-indigo-600">
            {logs.filter((item) => item.action === "published" || item.action === "awarded").length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Phát hành / trao thầu</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-bold text-red-500">
            {logs.filter((item) => item.action === "cancelled" || item.action === "rejected" || item.action === "deactivated").length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Hủy / từ chối / vô hiệu hóa</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] gap-3">
          <input
            value={search}
            onChange={(event) => handleFilterChange({ search: event.target.value })}
            placeholder="Tìm theo actor, mô tả, entity..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e] bg-white"
          />
          <select
            value={entityType}
            onChange={(event) => handleFilterChange({ entityType: event.target.value as ActivityEntityType | "" })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Tất cả entity</option>
            {ACTIVITY_ENTITY_TYPES.map((item) => (
              <option key={item} value={item}>
                {ACTIVITY_ENTITY_LABELS[item]}
              </option>
            ))}
          </select>
          <select
            value={action}
            onChange={(event) => handleFilterChange({ action: event.target.value as ActivityAction | "" })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Tất cả action</option>
            {ACTIVITY_ACTIONS.map((item) => (
              <option key={item} value={item}>
                {ACTIVITY_ACTION_LABELS[item]}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => handleFilterChange({ fromDate: event.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
          />
          <input
            type="date"
            value={toDate}
            onChange={(event) => handleFilterChange({ toDate: event.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
          />
          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value) as (typeof PAGE_SIZE_OPTIONS)[number]);
              setOffset(0);
            }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
          >
            {PAGE_SIZE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item} dòng / trang
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Đang tải activity log...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">Không có activity log phù hợp.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Thời gian</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Actor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Mô tả</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => {
                  const expanded = expandedId === log.id;
                  return (
                    <Fragment key={log.id}>
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{log.actorName || "Hệ thống"}</div>
                          <div className="text-xs text-slate-400">{log.actorEmail || "Không có email"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${actionBadgeClass(log.action)}`}>
                            {ACTIVITY_ACTION_LABELS[log.action]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{ACTIVITY_ENTITY_LABELS[log.entityType]}</div>
                          <div className="text-xs text-slate-400">
                            {log.entityName || log.entityId}
                            {log.entityName && <span className="ml-1">· {log.entityId}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{log.description}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : log.id)}
                            className="text-xs font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors"
                          >
                            {expanded ? "Ẩn JSON" : "Xem JSON"}
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="grid gap-4 lg:grid-cols-3">
                              <JsonBlock title="Metadata" value={log.metadata} />
                              <JsonBlock title="Old Values" value={log.oldValues} />
                              <JsonBlock title="New Values" value={log.newValues} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-slate-400">
          Trang {currentPage} / {totalPages} · Hiển thị {logs.length} / {total} bản ghi
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trang trước
          </button>
          <button
            type="button"
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trang sau
          </button>
        </div>
      </div>
    </div>
  );
}
