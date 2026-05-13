"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getAdminUsers,
  saveAdminUser,
  generateUserId,
  getInternalSession,
  MOCK_ADMIN,
} from "@/services/authStorage";
import {
  getAccounts,
  updateAccount,
  normalizePhone,
} from "@/services/supplierAccountStorage";
import type { InternalUser } from "@/types/internalUser";
import type { SupplierAccount } from "@/types/supplierAccount";

// ── permissions ───────────────────────────────────────────────────────────

function canManageUsers(role: string) {
  return role === "Admin";
}

// ── shared helpers ────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("vi-VN"); } catch { return iso; }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const inputCls = (err?: string) =>
  `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e] bg-white transition-colors ${err ? "border-red-300" : "border-slate-200"}`;
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

// ── Internal tab constants ────────────────────────────────────────────────

const INT_ROLES = ["Admin", "Trưởng phòng vật tư", "Kế hoạch vật tư", "Ban giám đốc", "Chỉ xem"] as const;
const INT_STATUSES = ["Hoạt động", "Tạm khóa"] as const;

const ROLE_BADGE: Record<string, string> = {
  "Admin":               "bg-[#0f2d5e] text-white",
  "Trưởng phòng vật tư": "bg-indigo-100 text-indigo-700",
  "Kế hoạch vật tư":     "bg-blue-100 text-blue-700",
  "Ban giám đốc":        "bg-purple-100 text-purple-700",
  "Chỉ xem":             "bg-slate-100 text-slate-600",
};

const INT_STATUS_BADGE: Record<string, string> = {
  "Hoạt động": "bg-green-100 text-green-700",
  "Tạm khóa":  "bg-red-100 text-red-600",
};

// ── NCC tab constants ─────────────────────────────────────────────────────

const NCC_STATUS_BADGE: Record<string, string> = {
  "Đã duyệt":          "bg-green-100 text-green-700",
  "Chờ xét duyệt":     "bg-blue-100 text-blue-700",
  "Yêu cầu bổ sung":   "bg-amber-100 text-amber-700",
  "Từ chối":           "bg-red-100 text-red-700",
  "Tạm khóa":          "bg-orange-100 text-orange-700",
  "Chưa hoàn thiện":   "bg-slate-100 text-slate-500",
};

// ── Internal user modal ───────────────────────────────────────────────────

interface UserForm {
  fullName: string;
  email: string;
  password: string;
  department: string;
  role: string;
  status: string;
}

const EMPTY_USER_FORM: UserForm = {
  fullName: "", email: "", password: "", department: "", role: "Kế hoạch vật tư", status: "Hoạt động",
};

interface UserModalProps {
  mode: "create" | "edit";
  editingUser: InternalUser | null;
  currentUserId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

function UserModal({ mode, editingUser, currentUserId, onClose, onSaved }: UserModalProps) {
  const [form, setForm] = useState<UserForm>(() =>
    mode === "edit" && editingUser
      ? { fullName: editingUser.fullName, email: editingUser.email, password: "", department: editingUser.department, role: editingUser.role, status: editingUser.status }
      : { ...EMPTY_USER_FORM }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isSelf = mode === "edit" && editingUser?.id === currentUserId;
  const isBuiltin = editingUser?.id === MOCK_ADMIN.id;

  function set<K extends keyof UserForm>(key: K, val: UserForm[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Họ tên không được rỗng.";
    if (!form.email.trim()) errs.email = "Email không được rỗng.";
    else if (!isValidEmail(form.email.trim())) errs.email = "Email không đúng định dạng.";
    else {
      const dup = getAdminUsers().find(
        (u) => u.email.trim().toLowerCase() === form.email.trim().toLowerCase() && u.id !== editingUser?.id
      );
      if (dup) errs.email = "Email đã được sử dụng bởi người dùng khác.";
      if (editingUser?.id !== MOCK_ADMIN.id && form.email.trim().toLowerCase() === MOCK_ADMIN.email)
        errs.email = "Email đã được sử dụng bởi người dùng khác.";
    }
    if (mode === "create" && form.password.length < 6) errs.password = "Mật khẩu tối thiểu 6 ký tự.";
    if (mode === "edit" && form.password && form.password.length < 6) errs.password = "Mật khẩu mới tối thiểu 6 ký tự.";
    if (!form.department.trim()) errs.department = "Bộ phận không được rỗng.";
    if (!form.role) errs.role = "Vai trò không được rỗng.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      if (mode === "create") {
        saveAdminUser({
          id: generateUserId(),
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          department: form.department.trim(),
          role: form.role,
          status: form.status,
          createdAt: new Date().toISOString(),
        });
      } else if (editingUser) {
        saveAdminUser({
          ...editingUser,
          fullName: form.fullName.trim(),
          email: isBuiltin ? editingUser.email : form.email.trim().toLowerCase(),
          department: form.department.trim(),
          role: isSelf ? editingUser.role : form.role,
          status: isSelf ? editingUser.status : form.status,
          password: form.password ? form.password : editingUser.password,
        });
      }
      setSaving(false);
      onSaved();
    }, 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 text-base">
              {mode === "create" ? "Tạo tài khoản nội bộ" : "Chỉnh sửa người dùng"}
            </h2>
            {isSelf && <p className="text-xs text-amber-600 mt-0.5">Đang chỉnh sửa tài khoản của chính bạn — vai trò và trạng thái không thể thay đổi.</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className={labelCls}>Họ tên <span className="text-red-500">*</span></label>
              <input className={inputCls(errors.fullName)} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Nguyễn Văn A" />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className={labelCls}>Email <span className="text-red-500">*</span></label>
              <input className={inputCls(errors.email)} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ten@biahalong.vn" disabled={isBuiltin} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className={labelCls}>
                {mode === "create" ? "Mật khẩu" : "Mật khẩu mới"}
                {mode === "create" && <span className="text-red-500"> *</span>}
                {mode === "edit" && <span className="text-slate-400 font-normal"> (để trống nếu không đổi)</span>}
              </label>
              <input className={inputCls(errors.password)} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder={mode === "create" ? "Ít nhất 6 ký tự" : "••••••"} />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className={labelCls}>Bộ phận <span className="text-red-500">*</span></label>
              <input className={inputCls(errors.department)} value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="Phòng kế hoạch vật tư" />
              {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Vai trò <span className="text-red-500">*</span></label>
                <select className={inputCls(errors.role)} value={form.role} onChange={(e) => set("role", e.target.value)} disabled={isSelf || isBuiltin}>
                  {INT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
              </div>
              <div>
                <label className={labelCls}>Trạng thái</label>
                <select className={inputCls()} value={form.status} onChange={(e) => set("status", e.target.value)} disabled={isSelf || isBuiltin}>
                  {INT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Hủy</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium bg-[#0f2d5e] text-white rounded-lg hover:bg-[#0d2550] disabled:opacity-60 transition-colors">
              {saving ? "Đang lưu..." : mode === "create" ? "Tạo tài khoản" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── NCC edit modal ────────────────────────────────────────────────────────

interface NccEditForm {
  contactName: string;
  email: string;
  phone: string;
}

interface NccEditModalProps {
  account: SupplierAccount;
  onClose: () => void;
  onSaved: () => void;
}

function NccEditModal({ account, onClose, onSaved }: NccEditModalProps) {
  const [form, setForm] = useState<NccEditForm>({
    contactName: account.contactName,
    email: account.email,
    phone: account.phone,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof NccEditForm>(key: K, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.email.trim()) errs.email = "Email không được rỗng.";
    else if (!isValidEmail(form.email.trim())) errs.email = "Email không đúng định dạng.";
    else {
      const dup = getAccounts().find(
        (a) => a.id !== account.id && a.email.trim().toLowerCase() === form.email.trim().toLowerCase()
      );
      if (dup) errs.email = "Email đã được đăng ký bởi nhà cung cấp khác.";
    }
    if (!form.phone.trim()) errs.phone = "Số điện thoại không được rỗng.";
    else {
      const normPhone = normalizePhone(form.phone.trim());
      const dup = getAccounts().find(
        (a) => a.id !== account.id && normalizePhone(a.phone.trim()) === normPhone
      );
      if (dup) errs.phone = "Số điện thoại đã đăng ký bởi nhà cung cấp khác.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      updateAccount({
        ...account,
        contactName: form.contactName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      });
      setSaving(false);
      onSaved();
    }, 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Sửa thông tin liên hệ NCC</h2>
            <p className="text-xs text-slate-400 mt-0.5">{account.companyName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>Người liên hệ</label>
              <input className={inputCls()} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className={labelCls}>Email đăng nhập <span className="text-red-500">*</span></label>
              <input className={inputCls(errors.email)} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className={labelCls}>Số điện thoại <span className="text-red-500">*</span></label>
              <input className={inputCls(errors.phone)} type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Hủy</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium bg-[#0f2d5e] text-white rounded-lg hover:bg-[#0d2550] disabled:opacity-60 transition-colors">
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── NCC reset password modal ──────────────────────────────────────────────

interface NccResetModalProps {
  account: SupplierAccount;
  onClose: () => void;
  onReset: () => void;
}

const DEFAULT_PASSWORD = "123456";

function NccResetModal({ account, onClose, onReset }: NccResetModalProps) {
  const [done, setDone] = useState(false);

  function handleReset() {
    updateAccount({ ...account, password: DEFAULT_PASSWORD });
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base">Reset mật khẩu nhà cung cấp</h2>
        </div>
        <div className="px-6 py-5">
          {done ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-sm font-medium text-slate-800">Đã reset mật khẩu thành công.</p>
              <p className="text-sm text-slate-500">
                Mật khẩu mới của <strong>{account.companyName}</strong>:
              </p>
              <code className="block bg-slate-100 text-slate-800 font-mono text-sm px-4 py-2 rounded-lg">{DEFAULT_PASSWORD}</code>
              <p className="text-xs text-slate-400">Thông báo mật khẩu mới cho nhà cung cấp để đăng nhập lại.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Mật khẩu của <strong>{account.companyName}</strong> sẽ được đặt lại về{" "}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">{DEFAULT_PASSWORD}</code>.
              </p>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Nhà cung cấp cần được thông báo mật khẩu mới để đăng nhập lại.
              </p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          {done ? (
            <button onClick={onReset} className="px-4 py-2 text-sm font-medium bg-[#0f2d5e] text-white rounded-lg hover:bg-[#0d2550] transition-colors">Đóng</button>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Hủy</button>
              <button onClick={handleReset} className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">Xác nhận reset</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────

type ActiveTab = "internal" | "supplier";
type NccModal =
  | { type: "edit"; account: SupplierAccount }
  | { type: "reset"; account: SupplierAccount };

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("internal");
  const [canManage, setCanManage] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ── Internal tab state ─────────────────────────────────────────────────
  const [allUsers, setAllUsers] = useState<InternalUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [intSearch, setIntSearch] = useState("");
  const [intRoleFilter, setIntRoleFilter] = useState("");
  const [intStatusFilter, setIntStatusFilter] = useState("");
  const [userModal, setUserModal] = useState<{ mode: "create" | "edit"; user?: InternalUser } | null>(null);

  // ── Supplier tab state ─────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<SupplierAccount[]>([]);
  const [nccSearch, setNccSearch] = useState("");
  const [nccStatusFilter, setNccStatusFilter] = useState("");
  const [nccModal, setNccModal] = useState<NccModal | null>(null);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  function loadInternalUsers() {
    const local = getAdminUsers();
    const hasFallback = local.some((u) => u.email.trim().toLowerCase() === MOCK_ADMIN.email);
    setAllUsers(hasFallback ? local : [{ ...MOCK_ADMIN, password: "" }, ...local]);
  }

  function loadSuppliers() {
    setSuppliers(getAccounts());
  }

  useEffect(() => {
    const session = getInternalSession();
    setCanManage(canManageUsers(session?.role || "Chỉ xem"));
    setCurrentUserId(session?.id ?? null);
    loadInternalUsers();
    loadSuppliers();
  }, []);

  // ── Internal tab computed ──────────────────────────────────────────────
  const filteredUsers = allUsers.filter((u) => {
    const q = intSearch.toLowerCase();
    return (
      (!q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q)) &&
      (!intRoleFilter || u.role === intRoleFilter) &&
      (!intStatusFilter || u.status === intStatusFilter)
    );
  });

  const intTotal   = allUsers.length;
  const intActive  = allUsers.filter((u) => u.status === "Hoạt động").length;
  const intLocked  = allUsers.filter((u) => u.status === "Tạm khóa").length;
  const intAdmins  = allUsers.filter((u) => u.role === "Admin").length;

  function handleIntToggleLock(u: InternalUser) {
    if (u.id === currentUserId) return;
    const updated = { ...u, status: u.status === "Hoạt động" ? "Tạm khóa" : "Hoạt động" };
    saveAdminUser(updated);
    loadInternalUsers();
    showSuccess(updated.status === "Tạm khóa" ? `Đã khóa tài khoản ${u.fullName}.` : `Đã mở khóa ${u.fullName}.`);
  }

  function handleUserModalSaved() {
    setUserModal(null);
    loadInternalUsers();
    showSuccess(userModal?.mode === "create" ? "Đã tạo tài khoản nội bộ mới." : "Đã cập nhật thông tin người dùng.");
  }

  const isBuiltin = (u: InternalUser) => u.id === MOCK_ADMIN.id;

  // ── NCC tab computed ───────────────────────────────────────────────────
  const filteredSuppliers = suppliers.filter((a) => {
    const q = nccSearch.toLowerCase();
    return (
      (!q ||
        a.companyName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.contactName.toLowerCase().includes(q) ||
        a.phone.includes(q)) &&
      (!nccStatusFilter || a.status === nccStatusFilter)
    );
  });

  const nccTotal   = suppliers.length;
  const nccApproved = suppliers.filter((a) => a.status === "Đã duyệt").length;
  const nccLocked  = suppliers.filter((a) => a.status === "Tạm khóa").length;
  const nccPending = suppliers.filter((a) => a.status === "Chờ xét duyệt" || (!a.profileCompleted && !a.status)).length;

  function handleNccToggleLock(a: SupplierAccount) {
    const updated = { ...a, status: a.status === "Tạm khóa" ? "Đã duyệt" : "Tạm khóa" };
    updateAccount(updated);
    loadSuppliers();
    showSuccess(updated.status === "Tạm khóa" ? `Đã khóa tài khoản ${a.companyName}.` : `Đã mở khóa ${a.companyName}.`);
  }

  function handleNccEditSaved() {
    setNccModal(null);
    loadSuppliers();
    showSuccess("Đã cập nhật thông tin liên hệ nhà cung cấp.");
  }

  function handleNccResetDone() {
    setNccModal(null);
    loadSuppliers();
    showSuccess("Đã reset mật khẩu nhà cung cấp.");
  }

  // ── NCC unique statuses for filter ────────────────────────────────────
  const nccStatuses = Array.from(new Set(suppliers.map((a) => a.status).filter(Boolean)));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Quản lý người dùng</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tài khoản nội bộ và tài khoản đăng nhập nhà cung cấp.
        </p>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex border-b border-slate-200">
        {(["internal", "supplier"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              "px-5 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab
                ? "border-[#0f2d5e] text-[#0f2d5e]"
                : "border-transparent text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            {tab === "internal" ? "Nội bộ" : "Nhà cung cấp"}
          </button>
        ))}
      </div>

      {/* ══ TAB: INTERNAL ══════════════════════════════════════════════════ */}
      {activeTab === "internal" && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Tổng người dùng", value: intTotal,   color: "text-[#0f2d5e]" },
              { label: "Đang hoạt động",  value: intActive,  color: "text-green-600" },
              { label: "Tạm khóa",        value: intLocked,  color: "text-red-500" },
              { label: "Admin",           value: intAdmins,  color: "text-[#c9a227]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={intSearch} onChange={(e) => setIntSearch(e.target.value)} placeholder="Tìm theo tên, email, bộ phận..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e] bg-white" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select value={intRoleFilter} onChange={(e) => setIntRoleFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none bg-white">
                <option value="">Tất cả vai trò</option>
                {INT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={intStatusFilter} onChange={(e) => setIntStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none bg-white">
                <option value="">Tất cả trạng thái</option>
                {INT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {canManage && (
                <button onClick={() => setUserModal({ mode: "create" })} className="px-4 py-2 text-sm font-medium bg-[#0f2d5e] text-white rounded-lg hover:bg-[#0d2550] transition-colors whitespace-nowrap">
                  + Tạo tài khoản nội bộ
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="py-14 text-center text-sm text-slate-400">Không tìm thấy người dùng phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Họ tên</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden md:table-cell">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden lg:table-cell">Bộ phận</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Vai trò</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Trạng thái</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden sm:table-cell">Ngày tạo</th>
                      {canManage && <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map((u) => {
                      const isCurrent = u.id === currentUserId;
                      const builtin = isBuiltin(u);
                      return (
                        <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${isCurrent ? "bg-blue-50/40" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">
                              {u.fullName}
                              {isCurrent && <span className="ml-1.5 text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-medium">Bạn</span>}
                              {builtin && <span className="ml-1.5 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">Hệ thống</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{u.email}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{u.department}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[u.role] ?? "bg-slate-100 text-slate-600"}`}>{u.role}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INT_STATUS_BADGE[u.status] ?? "bg-slate-100 text-slate-500"}`}>{u.status}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs hidden sm:table-cell">{formatDate(u.createdAt)}</td>
                          {canManage && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button onClick={() => setUserModal({ mode: "edit", user: u })} className="text-xs font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors">Sửa</button>
                                {!builtin && !isCurrent && (
                                  <button
                                    onClick={() => handleIntToggleLock(u)}
                                    className={`text-xs font-medium transition-colors ${u.status === "Hoạt động" ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-800"}`}
                                  >
                                    {u.status === "Hoạt động" ? "Khóa" : "Mở khóa"}
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {!canManage && <p className="text-xs text-slate-400 text-center">Bạn chỉ có quyền xem danh sách người dùng.</p>}
        </>
      )}

      {/* ══ TAB: SUPPLIER ══════════════════════════════════════════════════ */}
      {activeTab === "supplier" && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Tổng tài khoản NCC", value: nccTotal,   color: "text-[#0f2d5e]" },
              { label: "Đã duyệt",           value: nccApproved, color: "text-green-600" },
              { label: "Tạm khóa",           value: nccLocked,  color: "text-red-500" },
              { label: "Chờ xét duyệt",      value: nccPending, color: "text-amber-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={nccSearch} onChange={(e) => setNccSearch(e.target.value)} placeholder="Tên công ty, email, người liên hệ, SĐT..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e] bg-white" />
            </div>
            <select value={nccStatusFilter} onChange={(e) => setNccStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none bg-white">
              <option value="">Tất cả trạng thái</option>
              {nccStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {filteredSuppliers.length === 0 ? (
              <div className="py-14 text-center text-sm text-slate-400">
                {suppliers.length === 0 ? "Chưa có tài khoản nhà cung cấp nào." : "Không tìm thấy tài khoản phù hợp."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Tên công ty</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden md:table-cell">Người liên hệ</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden lg:table-cell">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden lg:table-cell">SĐT</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Trạng thái</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden sm:table-cell">Ngày đăng ký</th>
                      {canManage && <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredSuppliers.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 text-sm leading-tight">{a.companyName}</div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">MST: {a.taxCode}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm hidden md:table-cell">{a.contactName}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{a.email}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{a.phone}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NCC_STATUS_BADGE[a.status] ?? "bg-slate-100 text-slate-500"}`}>
                            {a.status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs hidden sm:table-cell">{formatDate(a.createdAt)}</td>
                        {canManage && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/admin/suppliers/${a.id}`} className="text-xs font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors">Xem</Link>
                              <button onClick={() => setNccModal({ type: "edit", account: a })} className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">Sửa</button>
                              <button onClick={() => setNccModal({ type: "reset", account: a })} className="text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors">Reset MK</button>
                              <button
                                onClick={() => handleNccToggleLock(a)}
                                className={`text-xs font-medium transition-colors ${a.status === "Tạm khóa" ? "text-green-600 hover:text-green-800" : "text-red-500 hover:text-red-700"}`}
                              >
                                {a.status === "Tạm khóa" ? "Mở khóa" : "Khóa"}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {!canManage && <p className="text-xs text-slate-400 text-center">Bạn chỉ có quyền xem danh sách tài khoản nhà cung cấp.</p>}
        </>
      )}

      {/* Modals */}
      {userModal && (
        <UserModal
          mode={userModal.mode}
          editingUser={userModal.user ?? null}
          currentUserId={currentUserId}
          onClose={() => setUserModal(null)}
          onSaved={handleUserModalSaved}
        />
      )}
      {nccModal?.type === "edit" && (
        <NccEditModal account={nccModal.account} onClose={() => setNccModal(null)} onSaved={handleNccEditSaved} />
      )}
      {nccModal?.type === "reset" && (
        <NccResetModal account={nccModal.account} onClose={() => setNccModal(null)} onReset={handleNccResetDone} />
      )}
    </div>
  );
}
