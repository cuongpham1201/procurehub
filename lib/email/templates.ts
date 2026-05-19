/**
 * lib/email/templates.ts
 *
 * HTML email templates for procurement workflow events.
 * All functions return a { subject, html } tuple.
 */

const BRAND_COLOR = "#0f2d5e";
const ACCENT_COLOR = "#c9a227";
const APP_NAME = "Bia Hạ Long Procurement";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://dauthau.zlab.io.vn";

function wrap(title: string, body: string): { subject: string; html: string } {
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:${BRAND_COLOR};padding:24px 32px;">
            <span style="color:#ffffff;font-size:18px;font-weight:bold;">${APP_NAME}</span>
            <span style="color:${ACCENT_COLOR};font-size:18px;font-weight:bold;"> ·</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;color:#1e293b;font-size:14px;line-height:1.7;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
            Email này được gửi tự động từ hệ thống ${APP_NAME}. Vui lòng không trả lời email này.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject: title, html };
}

function btn(label: string, url: string): string {
  return `<p style="margin:24px 0 0;">
    <a href="${url}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;">${label}</a>
  </p>`;
}

function highlight(text: string): string {
  return `<strong style="color:${BRAND_COLOR};">${text}</strong>`;
}

function noteBox(text: string, color = "#fef3c7", borderColor = "#f59e0b"): string {
  return `<div style="background:${color};border-left:4px solid ${borderColor};border-radius:4px;padding:12px 16px;margin:16px 0;font-size:13px;white-space:pre-wrap;">${text}</div>`;
}

// ── Supplier account activation ───────────────────────────────────────────────

export function supplierActivationEmail(
  supplierName: string,
  tempPassword: string,
  verifyUrl: string,
): ReturnType<typeof wrap> {
  const subject = `[Kích hoạt tài khoản] Nhà cung cấp ${APP_NAME}`;
  const body = `
    <p>Kính gửi ${highlight(supplierName)},</p>
    <p>Cảm ơn quý công ty đã đăng ký tài khoản nhà cung cấp trên hệ thống <strong>${APP_NAME}</strong>.</p>
    <p>Để kích hoạt tài khoản, vui lòng click vào nút bên dưới:</p>
    ${btn("Xác thực email & kích hoạt tài khoản", verifyUrl)}
    <p style="margin-top:24px;">Sau khi xác thực, hệ thống sẽ yêu cầu quý công ty đặt mật khẩu mới. Mật khẩu tạm thời để đăng nhập lần đầu là:</p>
    ${noteBox(`Mật khẩu tạm thời: ${tempPassword}\n\nLưu ý: Quý vị sẽ được yêu cầu đổi mật khẩu ngay sau khi đăng nhập.`, "#f0fdf4", "#16a34a")}
    <p style="margin-top:16px;font-size:12px;color:#94a3b8;">Link xác thực có hiệu lực trong 24 giờ. Nếu quý vị không thực hiện đăng ký này, vui lòng bỏ qua email.</p>
  `;
  return wrap(subject, body);
}

// ── Clarification requested → supplier ────────────────────────────────────────

export function clarificationRequestedEmail(
  supplierName: string,
  bidCode: string,
  tenderTitle: string,
  requestNote: string,
): ReturnType<typeof wrap> {
  const subject = `[Yêu cầu làm rõ] Báo giá ${bidCode}`;
  const body = `
    <p>Kính gửi ${highlight(supplierName)},</p>
    <p>Ban mua sắm có yêu cầu làm rõ đối với báo giá ${highlight(bidCode)} cho gói thầu:</p>
    <p style="margin:0 0 8px;"><strong>${tenderTitle}</strong></p>
    <p><strong>Nội dung yêu cầu:</strong></p>
    ${noteBox(requestNote, "#fff7ed", "#f97316")}
    <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết và gửi phản hồi.</p>
    ${btn("Xem yêu cầu và phản hồi", `${APP_URL}/supplier/bids`)}
  `;
  return wrap(subject, body);
}

// ── Clarification responded → internal ────────────────────────────────────────

export function clarificationRespondedEmail(
  bidCode: string,
  supplierName: string,
  tenderTitle: string,
  responseNote: string,
  adminLink: string,
): ReturnType<typeof wrap> {
  const subject = `[Phản hồi làm rõ] ${supplierName} — ${bidCode}`;
  const body = `
    <p>Nhà cung cấp ${highlight(supplierName)} đã phản hồi yêu cầu làm rõ cho báo giá ${highlight(bidCode)}.</p>
    <p><strong>Gói thầu:</strong> ${tenderTitle}</p>
    <p><strong>Nội dung phản hồi:</strong></p>
    ${noteBox(responseNote, "#f0fdf4", "#22c55e")}
    ${btn("Xem báo giá", `${APP_URL}${adminLink}`)}
  `;
  return wrap(subject, body);
}

// ── Award proposed → approval roles ───────────────────────────────────────────

export function awardProposedEmail(
  tenderTitle: string,
  tenderCode: string,
  proposedByName: string,
  adminLink: string,
): ReturnType<typeof wrap> {
  const subject = `[Chờ phê duyệt] Đề xuất kết quả: ${tenderCode}`;
  const body = `
    <p>${highlight(proposedByName)} đã đề xuất kết quả chọn nhà cung cấp cho gói thầu:</p>
    <p style="margin:0 0 16px;"><strong>${tenderTitle}</strong> (${tenderCode})</p>
    <p>Vui lòng xem xét bảng so sánh báo giá và chốt kết quả chính thức.</p>
    ${btn("Xem và phê duyệt", `${APP_URL}${adminLink}`)}
  `;
  return wrap(subject, body);
}

// ── Award finalized → supplier ────────────────────────────────────────────────

export function awardFinalizedSupplierEmail(
  supplierName: string,
  bidCode: string,
  tenderTitle: string,
  selected: boolean,
): ReturnType<typeof wrap> {
  if (selected) {
    const subject = `[Chúc mừng] Báo giá ${bidCode} được chọn`;
    const body = `
      <p>Kính gửi ${highlight(supplierName)},</p>
      <p>Chúng tôi vui mừng thông báo báo giá ${highlight(bidCode)} của quý công ty cho gói thầu:</p>
      <p style="margin:0 0 16px;"><strong>${tenderTitle}</strong></p>
      <p>đã được <strong style="color:#16a34a;">chọn trúng thầu</strong>. Ban mua sắm sẽ liên hệ để tiến hành các bước tiếp theo.</p>
      ${btn("Xem chi tiết báo giá", `${APP_URL}/supplier/bids`)}
    `;
    return wrap(subject, body);
  } else {
    const subject = `[Thông báo kết quả] Báo giá ${bidCode}`;
    const body = `
      <p>Kính gửi ${highlight(supplierName)},</p>
      <p>Cảm ơn quý công ty đã tham gia báo giá ${highlight(bidCode)} cho gói thầu:</p>
      <p style="margin:0 0 16px;"><strong>${tenderTitle}</strong></p>
      <p>Rất tiếc, lần này báo giá của quý công ty chưa được chọn. Chúng tôi trân trọng sự tham gia và mong tiếp tục hợp tác trong các gói thầu tiếp theo.</p>
      ${btn("Xem gói thầu đang mở", `${APP_URL}/tenders`)}
    `;
    return wrap(subject, body);
  }
}

// ── Supplier status changed → supplier ───────────────────────────────────────

export function supplierApprovedEmail(supplierName: string): ReturnType<typeof wrap> {
  const subject = `[Chúc mừng] Hồ sơ nhà cung cấp đã được phê duyệt`;
  const body = `
    <p>Kính gửi ${highlight(supplierName)},</p>
    <p>Chúng tôi vui mừng thông báo hồ sơ đăng ký nhà cung cấp của quý công ty đã được <strong style="color:#16a34a;">phê duyệt thành công</strong>.</p>
    <p>Quý công ty có thể đăng nhập vào hệ thống để xem các gói thầu đang mở và tham gia báo giá.</p>
    ${btn("Xem gói thầu đang mở", `${APP_URL}/tenders`)}
  `;
  return wrap(subject, body);
}

export function supplierRejectedEmail(supplierName: string): ReturnType<typeof wrap> {
  const subject = `[Thông báo] Hồ sơ nhà cung cấp chưa được phê duyệt`;
  const body = `
    <p>Kính gửi ${highlight(supplierName)},</p>
    <p>Sau khi xem xét, hồ sơ đăng ký nhà cung cấp của quý công ty <strong style="color:#dc2626;">chưa được phê duyệt</strong>.</p>
    <p>Vui lòng liên hệ bộ phận mua sắm qua email <a href="mailto:admin@biahalong.com" style="color:${BRAND_COLOR};">admin@biahalong.com</a> để được hỗ trợ thêm thông tin.</p>
  `;
  return wrap(subject, body);
}

export function supplierNeedMoreInfoEmail(supplierName: string): ReturnType<typeof wrap> {
  const subject = `[Yêu cầu bổ sung] Hồ sơ nhà cung cấp cần cập nhật`;
  const body = `
    <p>Kính gửi ${highlight(supplierName)},</p>
    <p>Phòng mua sắm yêu cầu quý công ty <strong>bổ sung thêm thông tin</strong> trước khi có thể phê duyệt hồ sơ.</p>
    <p>Vui lòng đăng nhập vào hệ thống, cập nhật hồ sơ và gửi lại để xét duyệt.</p>
    ${btn("Cập nhật hồ sơ", `${APP_URL}/supplier/profile`)}
  `;
  return wrap(subject, body);
}

export function supplierDeactivatedEmail(supplierName: string): ReturnType<typeof wrap> {
  const subject = `[Thông báo] Tài khoản nhà cung cấp bị tạm khóa`;
  const body = `
    <p>Kính gửi ${highlight(supplierName)},</p>
    <p>Tài khoản nhà cung cấp của quý công ty hiện đang bị <strong style="color:#dc2626;">tạm khóa</strong>.</p>
    <p>Vui lòng liên hệ bộ phận mua sắm qua email <a href="mailto:admin@biahalong.com" style="color:${BRAND_COLOR};">admin@biahalong.com</a> để được hỗ trợ.</p>
  `;
  return wrap(subject, body);
}

// ── Tender published → all active suppliers ────────────────────────────────────

export function tenderPublishedSuppliersEmail(
  tenderTitle: string,
  tenderCode: string,
  deadline: string,
  tenderLink: string,
): ReturnType<typeof wrap> {
  const subject = `[Gói thầu mới] ${tenderCode} — Mời báo giá`;
  const body = `
    <p>Kính gửi Quý nhà cung cấp,</p>
    <p>Bia Hạ Long trân trọng mời quý công ty tham gia báo giá cho gói thầu:</p>
    <p style="margin:0 0 8px;font-size:16px;"><strong>${tenderTitle}</strong></p>
    <p style="margin:0 0 16px;color:#64748b;">${tenderCode} · Hạn nộp: <strong>${deadline}</strong></p>
    <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết yêu cầu và nộp báo giá trước hạn.</p>
    ${btn("Xem gói thầu và báo giá", `${APP_URL}${tenderLink}`)}
  `;
  return wrap(subject, body);
}

// ── Bid submitted → internal ───────────────────────────────────────────────────

export function bidSubmittedEmail(
  supplierName: string,
  bidCode: string,
  tenderTitle: string,
  adminLink: string,
): ReturnType<typeof wrap> {
  const subject = `[Báo giá mới] ${bidCode} — ${supplierName}`;
  const body = `
    <p>${highlight(supplierName)} vừa nộp báo giá ${highlight(bidCode)} cho gói thầu:</p>
    <p style="margin:0 0 16px;"><strong>${tenderTitle}</strong></p>
    <p>Vui lòng đăng nhập vào hệ thống để xem và đánh giá báo giá.</p>
    ${btn("Xem báo giá", `${APP_URL}${adminLink}`)}
  `;
  return wrap(subject, body);
}

// ── Tender published → internal ───────────────────────────────────────────────

export function tenderPublishedInternalEmail(
  tenderTitle: string,
  tenderCode: string,
  adminLink: string,
): ReturnType<typeof wrap> {
  const subject = `[Gói thầu mới] ${tenderCode} đang nhận báo giá`;
  const body = `
    <p>Gói thầu sau đây đã được phát hành và đang mở nhận báo giá:</p>
    <p style="margin:0 0 16px;font-size:16px;"><strong>${tenderTitle}</strong> (${tenderCode})</p>
    ${btn("Xem gói thầu", `${APP_URL}${adminLink}`)}
  `;
  return wrap(subject, body);
}
