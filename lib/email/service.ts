/**
 * lib/email/service.ts
 *
 * Fire-and-forget email notifications for procurement workflow events.
 * All exported functions are safe — they never throw; errors are only logged.
 *
 * If SMTP_HOST is not configured, all sends are silently skipped.
 */
import nodemailer from "nodemailer";
import { emailEnabled, smtpConfig } from "./config";
import {
  awardFinalizedSupplierEmail,
  awardProposedEmail,
  clarificationRequestedEmail,
  clarificationRespondedEmail,
  tenderPublishedInternalEmail,
} from "./templates";

// ── Core ──────────────────────────────────────────────────────────────────────

async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
): Promise<void> {
  if (!emailEnabled) return;
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) return;

  const transport = nodemailer.createTransport({
    host:   smtpConfig.host,
    port:   smtpConfig.port,
    secure: smtpConfig.secure,
    auth:   smtpConfig.auth,
  });

  await transport.sendMail({
    from: smtpConfig.from,
    to: recipients.join(", "),
    subject,
    html,
  });
}

/** Fire-and-forget — mirrors createNotificationSafe pattern */
export async function sendEmailSafe(
  to: string | string[],
  subject: string,
  html: string,
): Promise<void> {
  try {
    await sendEmail(to, subject, html);
  } catch (e) {
    console.error("[email] send failed:", subject, e instanceof Error ? e.message : e);
  }
}

// ── Typed helpers ─────────────────────────────────────────────────────────────

/** Supplier: a clarification has been requested on their bid */
export async function emailClarificationRequested(
  supplierEmail: string | undefined,
  supplierName: string,
  bidCode: string,
  tenderTitle: string,
  requestNote: string,
): Promise<void> {
  if (!supplierEmail) return;
  const { subject, html } = clarificationRequestedEmail(
    supplierName, bidCode, tenderTitle, requestNote,
  );
  await sendEmailSafe(supplierEmail, subject, html);
}

/** Internal: supplier has responded to a clarification */
export async function emailClarificationResponded(
  internalEmails: string[],
  bidCode: string,
  supplierName: string,
  tenderTitle: string,
  responseNote: string,
  adminBidLink: string,
): Promise<void> {
  if (!internalEmails.length) return;
  const { subject, html } = clarificationRespondedEmail(
    bidCode, supplierName, tenderTitle, responseNote, adminBidLink,
  );
  await sendEmailSafe(internalEmails, subject, html);
}

/** Approval roles: KHVT has proposed award results */
export async function emailAwardProposed(
  approverEmails: string[],
  tenderTitle: string,
  tenderCode: string,
  proposedByName: string,
  tenderLink: string,
): Promise<void> {
  if (!approverEmails.length) return;
  const { subject, html } = awardProposedEmail(
    tenderTitle, tenderCode, proposedByName, tenderLink,
  );
  await sendEmailSafe(approverEmails, subject, html);
}

/** Supplier: award has been finalized (selected or not) */
export async function emailAwardFinalized(
  supplierEmail: string | undefined,
  supplierName: string,
  bidCode: string,
  tenderTitle: string,
  selected: boolean,
): Promise<void> {
  if (!supplierEmail) return;
  const { subject, html } = awardFinalizedSupplierEmail(
    supplierName, bidCode, tenderTitle, selected,
  );
  await sendEmailSafe(supplierEmail, subject, html);
}

/** Internal: a tender has been published and is open for bids */
export async function emailTenderPublishedInternal(
  internalEmails: string[],
  tenderTitle: string,
  tenderCode: string,
  tenderLink: string,
): Promise<void> {
  if (!internalEmails.length) return;
  const { subject, html } = tenderPublishedInternalEmail(
    tenderTitle, tenderCode, tenderLink,
  );
  await sendEmailSafe(internalEmails, subject, html);
}
