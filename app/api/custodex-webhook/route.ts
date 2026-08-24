// -----------------------------------------------------------------------------
// POST /api/custodex-webhook
//
// Custodex hits this URL whenever an order's status changes. Custodex
// support confirmed:
//   - Webhook body carries ONLY `tracker_id` (no status, no amount, no signature)
//   - No cryptographic signature to validate authenticity
//   - MUST re-fetch order state via /api/crypto/invoice/get?tracker_id={id}
//     and trust ONLY that response, never the callback body itself
//   - Partial payments: order enters a "partial" state; subsequent payments
//     to the same wallet within date_expire (12h default) auto-credit to
//     the same order — no action needed on our side beyond notifying
//
// Flow:
//   1. Extract tracker_id from callback
//   2. GET /invoice/get?tracker_id → canonical status + client_transaction_id
//   3. Decode {name, email} from client_transaction_id (uuid|b64name|b64email)
//   4. Dispatch email(s) based on status:
//        PAID / SUCCESS       → attendee ticket + admin notification
//        UNDERPAID / PARTIAL  → admin notification only
//        EXPIRED / CANCELLED  → admin notification only
//        other (transitional) → log + return 200
//
// Always return 200 (Custodex retries on non-2xx would compound the mess).
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { getInvoice, isCustodexConfigured } from "@/lib/custodex";
import { sendAttendeeTicket, sendAdminNotification, type TicketDetails } from "@/lib/emails";

// Status names live in Custodex — the docs list them ambiguously ("PAYMENT"
// is used both as an in-progress and static-order status). Treat these as
// the canonical set for our decisions:
const PAID_STATUSES = new Set(["PAID", "SUCCESS", "COMPLETED", "COMPLETE"]);
const UNDERPAID_STATUSES = new Set(["UNDERPAID", "PARTIAL"]);
const EXPIRED_STATUSES = new Set(["EXPIRED", "CANCELLED", "CANCELED", "FAILED"]);

interface WebhookBody {
  tracker_id?: string;
  status?: string;
  client_transaction_id?: string;
  [k: string]: unknown;
}

function decodeAttendee(encodedClientId: string): { name: string; email: string } {
  const parts = encodedClientId.split("|");
  if (parts.length < 3) return { name: "", email: "" };
  try {
    return {
      name: Buffer.from(parts[1], "base64url").toString("utf8"),
      email: Buffer.from(parts[2], "base64url").toString("utf8"),
    };
  } catch {
    return { name: "", email: "" };
  }
}

export async function POST(req: Request) {
  let body: WebhookBody = {};
  try {
    body = (await req.json()) as WebhookBody;
  } catch {
    // Some webhook systems POST form-encoded. Try text as fallback for logging.
    try {
      const t = await req.text();
      // eslint-disable-next-line no-console
      console.warn("[webhook] non-JSON body:", t.slice(0, 500));
    } catch {
      /* noop */
    }
    return NextResponse.json({ ok: true, note: "malformed body ignored" });
  }

  const trackerId = body.tracker_id;
  if (!trackerId) {
    // eslint-disable-next-line no-console
    console.warn("[webhook] missing tracker_id in body:", body);
    return NextResponse.json({ ok: true, note: "no tracker_id" });
  }

  // Refetch canonical state from Custodex. If keys aren't configured yet, we
  // fall back to trusting the webhook body (dev mode / mock).
  let status: string;
  let clientTransactionId: string;
  let amount = Number(process.env.TICKET_PRICE || "200");
  let currency = process.env.TICKET_CURRENCY || "EUR";

  if (isCustodexConfigured()) {
    try {
      const invoice = await getInvoice(trackerId);
      status = String(invoice.status || "").toUpperCase();
      clientTransactionId = String(invoice.client_transaction_id || body.client_transaction_id || "");
      if (invoice.amount) amount = Number(invoice.amount);
      if (invoice.fiat_currency) currency = String(invoice.fiat_currency);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[webhook] getInvoice failed for tracker_id", trackerId, err);
      // Return 200 anyway — retries won't help if Custodex's own API is down.
      return NextResponse.json({ ok: true, note: "getInvoice failed, will not retry" });
    }
  } else {
    status = String(body.status || "").toUpperCase();
    clientTransactionId = String(body.client_transaction_id || "");
  }

  const { name, email } = decodeAttendee(clientTransactionId);
  const paidAt = new Date().toISOString();
  const ticket: TicketDetails = {
    name,
    email,
    trackerId,
    clientTransactionId,
    amount,
    currency,
    paidAt,
  };

  try {
    if (PAID_STATUSES.has(status)) {
      if (email) await sendAttendeeTicket(ticket);
      await sendAdminNotification("paid", ticket);
    } else if (UNDERPAID_STATUSES.has(status)) {
      await sendAdminNotification("underpaid", ticket, `Custodex status = ${status}`);
    } else if (EXPIRED_STATUSES.has(status)) {
      await sendAdminNotification("expired", ticket, `Custodex status = ${status}`);
    } else {
      // Unknown / transitional status ("PENDING", "PAYMENT" for static orders,
      // etc). Nothing to do — Custodex will send another callback when it
      // moves to a terminal state.
      // eslint-disable-next-line no-console
      console.info("[webhook] transitional status ignored:", status, "for tracker", trackerId);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[webhook] email send failed:", err);
    // Still 200 — Custodex retries won't fix our SMTP.
  }

  return NextResponse.json({ ok: true });
}

// Some payment gateways probe the endpoint with GET first — respond 200 so
// they mark the URL as reachable.
export async function GET() {
  return NextResponse.json({ ok: true, service: "custodex-webhook" });
}
