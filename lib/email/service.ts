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
  bidSubmittedEmail,
  clarificationRequestedEmail,
  clarificationRespondedEmail,
  supplierActivationEmail,
  supplierApprovedEmail,
  supplierDeactivatedEmail,
  supplierForgotPasswordEmail,
  supplierNeedMoreInfoEmail,
  supplierRejectedEmail,
  tenderPublishedInternalEmail,
  tenderPublishedSuppliersEmail,
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

/** Supplier: forgot-password email with new temp password */
export async function emailSupplierForgotPassword(
  email: string,
  supplierName: string,
  tempPassword: string,
  loginUrl: string,
): Promise<void> {
  const { subject, html } = supplierForgotPasswordEmail(supplierName, tempPassword, loginUrl);
  await sendEmailSafe(email, subject, html);
}

/** Supplier: activation email with temp password and verification link */
export async function emailSupplierActivation(
  email: string,
  supplierName: string,
  tempPassword: string,
  verifyUrl: string,
): Promise<void> {
  const { subject, html } = supplierActivationEmail(supplierName, tempPassword, verifyUrl);
  await sendEmailSafe(email, subject, html);
}

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

/** Supplier: account approved */
export async function emailSupplierApproved(email: string | undefined, name: string): Promise<void> {
  if (!email) return;
  const { subject, html } = supplierApprovedEmail(name);
  await sendEmailSafe(email, subject, html);
}

/** Supplier: account rejected */
export async function emailSupplierRejected(email: string | undefined, name: string): Promise<void> {
  if (!email) return;
  const { subject, html } = supplierRejectedEmail(name);
  await sendEmailSafe(email, subject, html);
}

/** Supplier: needs to submit more info */
export async function emailSupplierNeedMoreInfo(email: string | undefined, name: string): Promise<void> {
  if (!email) return;
  const { subject, html } = supplierNeedMoreInfoEmail(name);
  await sendEmailSafe(email, subject, html);
}

/** Supplier: account deactivated */
export async function emailSupplierDeactivated(email: string | undefined, name: string): Promise<void> {
  if (!email) return;
  const { subject, html } = supplierDeactivatedEmail(name);
  await sendEmailSafe(email, subject, html);
}

/** All active suppliers: a tender has been published, inviting bids */
export async function emailTenderPublishedSuppliers(
  supplierEmails: string[],
  tenderTitle: string,
  tenderCode: string,
  deadline: string,
  tenderLink: string,
): Promise<void> {
  if (!supplierEmails.length) return;
  const { subject, html } = tenderPublishedSuppliersEmail(tenderTitle, tenderCode, deadline, tenderLink);
  await sendEmailSafe(supplierEmails, subject, html);
}

/** Internal: a supplier has submitted a new bid */
export async function emailBidSubmitted(
  internalEmails: string[],
  supplierName: string,
  bidCode: string,
  tenderTitle: string,
  adminLink: string,
): Promise<void> {
  if (!internalEmails.length) return;
  const { subject, html } = bidSubmittedEmail(supplierName, bidCode, tenderTitle, adminLink);
  await sendEmailSafe(internalEmails, subject, html);
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
