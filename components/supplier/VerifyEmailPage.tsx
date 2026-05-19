"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PublicHeader from "@/components/shared/PublicHeader";

function IconCheck() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function VerifyEmailContent() {
  const params = useSearchParams();
  const success = params.get("success") === "1";
  const error = params.get("error");

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 text-green-600">
          <IconCheck />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Email xác thực thành công!</h2>
        <p className="text-sm text-slate-500 mb-6">
          Tài khoản của quý công ty đã được kích hoạt. Vui lòng đăng nhập bằng mật khẩu tạm thời trong email và đổi mật khẩu ngay.
        </p>
        <Link
          href="/login"
          className="inline-block bg-[#0f2d5e] hover:bg-[#0f2d5e]/90 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  if (error) {
    const msg =
      error === "missing_token"
        ? "Link xác thực không hợp lệ."
        : "Link xác thực đã hết hạn hoặc đã được sử dụng. Vui lòng liên hệ hỗ trợ để được cấp lại link mới.";
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5 text-red-600">
          <IconAlert />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Xác thực thất bại</h2>
        <p className="text-sm text-slate-500 mb-6">{msg}</p>
        <p className="text-sm text-slate-500">
          Liên hệ hỗ trợ:{" "}
          <a href="mailto:ncc@biahalong.vn" className="text-[#0f2d5e] font-medium hover:underline">
            ncc@biahalong.vn
          </a>
        </p>
      </div>
    );
  }

  // Default: informational page shown when no query params (direct navigation)
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-5 text-blue-600">
        <IconMail />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Kiểm tra hộp thư của bạn</h2>
      <p className="text-sm text-slate-500 mb-4">
        Chúng tôi đã gửi email kích hoạt tới địa chỉ bạn đăng ký. Vui lòng mở email và click vào nút xác thực.
      </p>
      <p className="text-xs text-slate-400">
        Không nhận được email? Kiểm tra thư mục spam hoặc liên hệ{" "}
        <a href="mailto:ncc@biahalong.vn" className="text-[#0f2d5e] hover:underline">
          ncc@biahalong.vn
        </a>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <div className="flex items-center justify-center px-4 py-20">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full">
          <Suspense>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
