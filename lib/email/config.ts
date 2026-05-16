/**
 * lib/email/config.ts
 *
 * SMTP configuration from environment variables.
 *
 * .env / .env.local:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_SECURE=false
 *   SMTP_USER=procurement@biahalong.com
 *   SMTP_PASS=your-app-password
 *   SMTP_FROM="Bia Hạ Long Procurement <procurement@biahalong.com>"
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
