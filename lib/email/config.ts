/**
 * lib/email/config.ts
 *
 * SMTP configuration from environment variables.
 *
 * Microsoft 365 (biahalong.com tenant):
 *   SMTP_HOST=smtp.office365.com
 *   SMTP_PORT=587
 *   SMTP_SECURE=false          # STARTTLS on port 587
 *   SMTP_USER=admin@biahalong.com
 *   SMTP_PASS=your-m365-password
 *   SMTP_FROM="Bia Hạ Long Procurement <admin@biahalong.com>"
 *
 * Prerequisite: enable SMTP AUTH for the mailbox in M365 Admin Center
 *   → Users → Active users → select mailbox → Mail → Manage email apps → SMTP ✓
 */

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
  from: string;
}

export const smtpConfig: SmtpConfig = {
  host:   process.env.SMTP_HOST ?? "",
  port:   parseInt(process.env.SMTP_PORT ?? "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
  },
  from: process.env.SMTP_FROM ?? "noreply@biahalong.com",
};

/** Email is disabled when SMTP_HOST is not set */
export const emailEnabled: boolean = !!process.env.SMTP_HOST;
