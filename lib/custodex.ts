// -----------------------------------------------------------------------------
// Custodex crypto-payment API client.
//
// Docs: https://docs.custodex.sv
// Base URL: https://my.custodex.sv (production only, no sandbox as of now).
//
// Auth: three headers on every request:
//   ApiPublic — public key from Custodex dashboard
//   Timestamp — UNIX seconds
//   Signature — HMAC-SHA512 over (timestamp + JSON body), key = SecretKey
//
// Custodex support answers (Aug 2026):
//   - EUR IS supported as fiat_currency (just undocumented in the OpenAPI
//     enum). Safe to send "EUR" alongside USD / RUB.
//   - No sandbox exists — first live tests run on prod with tiny amounts in
//     TRX (Tron) to keep fees near-zero. See TICKET_CURRENCY / TICKET_PRICE
//     env vars for how we override at test time.
//   - Webhooks carry ONLY tracker_id (no signature). We MUST NOT trust the
//     callback body. Every webhook triggers a re-fetch via
//     /api/crypto/invoice/get?tracker_id={id} and we act on THAT response's
//     status only.
//   - Default date_expire is 12 hours (not 30 minutes). Can be configured
//     per-invoice via API if needed.
//   - Partial payments: order enters a "partial" status; subsequent payments
//     to the same wallet within date_expire are auto-credited to the same
//     order. No action needed on our side beyond notifying the organizer.
//
// Env vars consumed:
//   CUSTODEX_BASE_URL      (optional, defaults to https://my.custodex.sv)
//   CUSTODEX_API_PUBLIC    (required for real calls)
//   CUSTODEX_API_SECRET    (required for real calls)
//   CUSTODEX_MERCHANT_UUID (optional — Custodex support confirmed this
//                           parameter is not required for our single-merchant
//                           account. Left as an escape hatch if we ever need
//                           to disambiguate across merchants.)
//
// While the keys are not yet supplied, callers should first check
// `isCustodexConfigured()`; the API-route wrapper uses that to short-circuit
// into a mock payment_url so the front-end flow can be exercised end-to-end
// without hitting a real merchant.
// -----------------------------------------------------------------------------

import { createHmac } from "node:crypto";

const DEFAULT_BASE_URL = "https://my.custodex.sv";

export function isCustodexConfigured(): boolean {
  return Boolean(
    process.env.CUSTODEX_API_PUBLIC && process.env.CUSTODEX_API_SECRET
  );
}

export interface CreateInvoiceParams {
  /** Cryptocurrency token to charge in (e.g. "USDTTRC", "USDTERC", "BTC"). */
  token: string;
  /** Amount in `fiat_currency` (if provided) or in `token` (if fiat is unset). */
  amount: number;
  /** Fiat currency the `amount` is denominated in. Custodex converts to token. */
  fiat_currency?: "USD" | "RUB" | "EUR";
  /** Our unique reference for this order — echoed back in webhooks. */
  client_transaction_id: string;
  /** Where to send the user after payment completion. */
  redirect_url: string;
  /** Where Custodex should POST webhook notifications. */
  call_back_url: string;
  /** Optional acceptable underpayment ratio (0..1, default 1 = strict). */
  payment_delta?: number;
}

export interface CreateInvoiceResponse {
  /** Custodex-side unique tracker id, arrives in webhooks. Store it. */
  tracker_id: string;
  /** URL of the hosted Custodex payment page — redirect the user here. */
  payment_url: string;
}

export interface InvoiceStatusResponse {
  tracker_id: string;
  client_transaction_id?: string;
  status: string; // "PENDING" | "PAYMENT" | "PAID" | "EXPIRED" | "UNDERPAID" | ...
  amount?: number;
  token?: string;
  fiat_currency?: string;
  [k: string]: unknown;
}

function sign(body: string, timestamp: string, secret: string): string {
  return createHmac("sha512", secret).update(timestamp + body).digest("hex");
}

async function custodexFetch<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  if (!isCustodexConfigured()) {
    throw new Error("Custodex is not configured: missing CUSTODEX_API_PUBLIC / _SECRET");
  }
  const base = process.env.CUSTODEX_BASE_URL ?? DEFAULT_BASE_URL;
  const publicKey = process.env.CUSTODEX_API_PUBLIC!;
  const secret = process.env.CUSTODEX_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyStr = body ? JSON.stringify(body) : "";
  const signature = sign(bodyStr, timestamp, secret);

  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ApiPublic: publicKey,
      Timestamp: timestamp,
      Signature: signature,
    },
    body: method === "POST" ? bodyStr : undefined,
    // Vercel Functions default cache is disabled for POST, but be explicit.
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Custodex ${method} ${path} failed: HTTP ${res.status} — ${text.slice(0, 500)}`);
  }
  return (await res.json()) as T;
}

/**
 * Create a payform invoice. Returns a hosted payment URL to redirect the user to.
 *
 * `strict_currency: false` — при `payform: true` пользователь на самой странице
 * Custodex сможет переключить токен из выбранного дефолта (`params.token`) на
 * любой другой поддерживаемый (BTC / ETH / USDT ERC / USDT BEP / etc). Так
 * договорились с Custodex support — дать полный выбор, дефолт — просто
 * подсказка.
 */
export async function createInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResponse> {
  const body: Record<string, unknown> = {
    token: params.token,
    amount: params.amount,
    fiat_currency: params.fiat_currency,
    client_transaction_id: params.client_transaction_id,
    payform: true,
    strict_currency: false,
    redirect_url: params.redirect_url,
    auto_redirect: true,
    call_back_url: params.call_back_url,
    payment_delta: params.payment_delta,
  };
  // merchant_uuid отправляем ТОЛЬКО если задан в env — по подтверждению
  // Custodex support параметр опционален для single-merchant аккаунтов.
  if (process.env.CUSTODEX_MERCHANT_UUID) {
    body.merchant_uuid = process.env.CUSTODEX_MERCHANT_UUID;
  }
  return custodexFetch<CreateInvoiceResponse>("/api/crypto/invoice/create", "POST", body);
}

/**
 * Fetch order status by tracker_id. Called from webhook handler to verify
 * the true status server-side (the callback body should be treated as a
 * "hint that something changed", not a trusted source of truth).
 */
export async function getInvoice(trackerId: string): Promise<InvoiceStatusResponse> {
  return custodexFetch<InvoiceStatusResponse>(
    `/api/crypto/invoice/get?tracker_id=${encodeURIComponent(trackerId)}`,
    "GET"
  );
}
