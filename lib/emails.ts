// -----------------------------------------------------------------------------
// Transactional email — Gmail SMTP via nodemailer + templates for the ticket flow.
//
// Two email types:
//   1. attendeeTicket   — sent to the buyer after successful payment
//   2. adminNotification — mirror-notification to organizer + ops mailboxes
//
// Why Gmail SMTP and not a transactional service (Resend / SendGrid):
//   - Requires no domain DNS setup (SPF/DKIM). Gmail owns gmail.com and
//     handles deliverability records for us.
//   - Free within Gmail's ~500 msg/day limit (well above BWiGA's ~1000/month peak)
//   - `Reply-To` messages arrive back into the same inbox → organizer can
//     answer attendees manually from Gmail UI
//   - Trade-off: sender is a personal-looking `bwiga2026@gmail.com` rather
//     than `tickets@adriaticawards.com`. Organizer confirmed this is fine.
//
// Env vars:
//   SMTP_USER       — Gmail address that sends (e.g. bwiga2026@gmail.com)
//   SMTP_PASSWORD   — Gmail App Password (16 chars, no spaces preferred).
//                     NOT the regular Gmail login password — generate at
//                     myaccount.google.com/apppasswords with 2FA on.
//   FROM_EMAIL      — Optional friendly From header, e.g.
//                     "BWiGA Tickets <bwiga2026@gmail.com>". Falls back to SMTP_USER.
//   NOTIFY_EMAILS   — Comma-separated internal recipients for admin notifications
//   SITE_URL        — Used in email body links; defaults to production URL
//
// Fallback: if SMTP_USER or SMTP_PASSWORD is missing, sends are no-ops that
// log the email body to the console. Lets the API routes still work in dev
// without secrets.
// -----------------------------------------------------------------------------

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

const SITE_URL_DEFAULT = "https://www.adriaticawards.com";
const NOTIFY_DEFAULT = "mail@lead-volume.com,maxkysh@gmail.com";

// Module-level cached transporter — reused across requests (Vercel serverless
// re-uses warm invocations, so a single SMTP connection stays alive between
// calls when possible).
let cachedTransporter: Transporter | null = null;

function transporter(): Transporter | null {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!user || !password) return null;
  if (cachedTransporter) return cachedTransporter;
  // Google App Passwords are shown with spaces (`abcd efgh ijkl mnop`); strip
  // them defensively so the env var value works either way.
  const cleanPassword = password.replace(/\s+/g, "");
  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: cleanPassword },
  });
  return cachedTransporter;
}

function fromHeader(): string {
  const explicit = process.env.FROM_EMAIL;
  if (explicit) return explicit;
  const user = process.env.SMTP_USER;
  if (user) return `BWiGA Tickets <${user}>`;
  return "BWiGA Tickets <noreply@example.com>"; // never actually used when no SMTP is configured
}

function siteUrl(): string {
  return process.env.SITE_URL || SITE_URL_DEFAULT;
}

function notifyRecipients(): string[] {
  const raw = process.env.NOTIFY_EMAILS || NOTIFY_DEFAULT;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface TicketDetails {
  name: string;
  email: string;
  trackerId: string;
  clientTransactionId: string;
  amount: number;
  currency: string; // "EUR" / "USD" — fiat displayed
  paidAt: string; // ISO timestamp
}

// ---- Attendee welcome / ticket confirmation --------------------------------
export async function sendAttendeeTicket(t: TicketDetails): Promise<void> {
  const tx = transporter();
  const subject = `Your BWiGA Adriatic Edition ticket · September 30, 2026`;
  const text = `Hi ${t.name},

Thank you for joining the Balkan Web3 & iGaming Awards — Adriatic Edition.
Your ticket payment has been received.

═══════════════════════════════════════
  YOUR TICKET
═══════════════════════════════════════
  Name:    ${t.name}
  Email:   ${t.email}
  Amount:  ${t.currency} ${t.amount}
  Ref:     ${t.clientTransactionId}
═══════════════════════════════════════

WHEN
  September 30, 2026 · 10:00 — 23:00

WHERE
  Avala Resort & Villas
  2 Mediteranska, Budva 85310, Montenegro
  https://maps.app.goo.gl/vDoDwSyXhSaZR6ky5

ENTRY
  Give your name and surname at the reception desk on arrival
  to collect your badge. No printed ticket required.

QUESTIONS
  Reply to this email, or reach us at ${notifyRecipients()[0] ?? "mail@lead-volume.com"}.

See you in Budva.
The BWiGA team
${siteUrl()}
`;

  if (!tx) {
    // eslint-disable-next-line no-console
    console.info("[emails] SMTP not configured — attendee ticket NOT sent. Body:\n", text);
    return;
  }

  await tx.sendMail({
    from: fromHeader(),
    to: t.email,
    replyTo: notifyRecipients()[0],
    subject,
    text,
  });
}

// ---- Internal notification for organizer + ops -----------------------------
export type AdminEventKind = "paid" | "underpaid" | "expired" | "failed";

export async function sendAdminNotification(
  kind: AdminEventKind,
  t: TicketDetails,
  extra?: string
): Promise<void> {
  const tx = transporter();
  const recipients = notifyRecipients();
  if (recipients.length === 0) return;

  const kindLabel: Record<AdminEventKind, string> = {
    paid: "✅ PAID",
    underpaid: "⚠️ UNDERPAID",
    expired: "⌛ EXPIRED",
    failed: "❌ FAILED",
  };

  const subject = `[BWiGA] ${kindLabel[kind]} — ${t.name} · ${t.currency} ${t.amount}`;
  const text = `Ticket event: ${kindLabel[kind]}

Attendee
  Name:      ${t.name}
  Email:     ${t.email}

Payment
  Amount:    ${t.currency} ${t.amount}
  Custodex:  ${t.trackerId}
  Client ID: ${t.clientTransactionId}
  Paid at:   ${t.paidAt}
${extra ? `\nExtra\n  ${extra}\n` : ""}
`;

  if (!tx) {
    // eslint-disable-next-line no-console
    console.info(`[emails] SMTP not configured — admin ${kind} notification NOT sent. Body:\n`, text);
    return;
  }

  await tx.sendMail({
    from: fromHeader(),
    to: recipients,
    subject,
    text,
  });
}
