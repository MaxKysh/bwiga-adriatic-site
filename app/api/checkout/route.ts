// -----------------------------------------------------------------------------
// POST /api/checkout
//
// Called by the TicketCheckoutModal on the front-end. Given { name, email },
// it creates a Custodex crypto invoice and returns a hosted payment_url the
// browser redirects to.
//
// While Custodex keys are not yet provisioned, this route falls back to a
// mock: it generates a fake payment_url that lands on /thanks?mock=1 so the
// full front-end flow (button → modal → redirect → thank-you page → email
// stub) can be exercised end-to-end without a real merchant.
//
// The `client_transaction_id` is a UUID we generate — becomes the correlation
// id for the webhook that eventually notifies us of payment status.
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createInvoice, isCustodexConfigured } from "@/lib/custodex";

// Payment defaults (will move to env once Custodex confirms EUR support).
const TICKET_PRICE = Number(process.env.TICKET_PRICE || "200");
const TICKET_CURRENCY = (process.env.TICKET_CURRENCY || "EUR") as "EUR" | "USD" | "RUB";
const DEFAULT_TOKEN = process.env.CUSTODEX_DEFAULT_TOKEN || "USDTTRC";

function siteUrl(): string {
  return process.env.SITE_URL || "https://www.adriaticawards.com";
}

interface CheckoutBody {
  name?: string;
  email?: string;
}

function validate(body: CheckoutBody): { ok: true; name: string; email: string } | { ok: false; error: string } {
  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  if (name.length < 2) return { ok: false, error: "Please provide your full name." };
  if (name.length > 200) return { ok: false, error: "Name is too long." };
  // Simple, permissive email check — real validation lives at deliverability time.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please provide a valid email address." };
  }
  if (email.length > 320) return { ok: false, error: "Email is too long." };
  return { ok: true, name, email };
}

export async function POST(req: Request) {
  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const v = validate(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  // Correlation id — reaches us back in the Custodex webhook.
  const clientTransactionId = randomUUID();

  // Persistence: v1 has no DB. We stash the {name, email} → id mapping in
  // the URL of the invoice's client_transaction_id itself (as a signed
  // token?) — but simpler: encode it via query string appended to
  // redirect_url and reconstruct in the webhook by refetching from
  // Custodex (which stores our client_transaction_id verbatim).
  //
  // For now we tuck attendee data into the client_transaction_id as
  // `<uuid>|<base64(name)>|<base64(email)>`. Custodex echoes this back in
  // /invoice/get responses. Length limit unknown — keep names reasonable.
  const encoded = `${clientTransactionId}|${Buffer.from(v.name).toString("base64url")}|${Buffer.from(v.email).toString("base64url")}`;

  // ----- Mock path: Custodex keys not yet configured -----
  if (!isCustodexConfigured()) {
    // eslint-disable-next-line no-console
    console.info("[checkout] Custodex not configured — returning mock payment_url for", { name: v.name, email: v.email });
    return NextResponse.json({
      payment_url: `${siteUrl()}/thanks?mock=1&ct=${encodeURIComponent(encoded)}`,
      tracker_id: `mock-${clientTransactionId}`,
      mock: true,
    });
  }

  // ----- Real path -----
  try {
    const invoice = await createInvoice({
      token: DEFAULT_TOKEN,
      amount: TICKET_PRICE,
      fiat_currency: TICKET_CURRENCY,
      client_transaction_id: encoded,
      redirect_url: `${siteUrl()}/thanks?ct=${encodeURIComponent(encoded)}`,
      call_back_url: `${siteUrl()}/api/custodex-webhook`,
    });
    return NextResponse.json({
      payment_url: invoice.payment_url,
      tracker_id: invoice.tracker_id,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[checkout] Custodex createInvoice failed:", err);
    return NextResponse.json(
      { error: "Payment gateway is temporarily unavailable. Please try again in a minute." },
      { status: 502 }
    );
  }
}
