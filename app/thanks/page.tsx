// -----------------------------------------------------------------------------
// /thanks — landing after a successful Custodex payment (redirect_url target).
//
// The URL will contain ?ct=<encoded-client-transaction-id> from checkout, and
// optionally ?mock=1 while Custodex keys aren't provisioned.
//
// This page is intentionally static — everything meaningful happens
// server-side in the webhook handler (email dispatch). The page's job is to
// tell the buyer "we've got it, check your inbox".
// -----------------------------------------------------------------------------

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment received — BWiGA Adriatic Edition",
  description: "Your ticket to the Balkan Web3 & iGaming Awards is on its way.",
  robots: { index: false, follow: false },
};

export default function ThanksPage({
  searchParams,
}: {
  searchParams?: { mock?: string };
}) {
  const isMock = searchParams?.mock === "1";

  return (
    <main
      style={{
        minHeight: "100svh",
        background: "var(--ink-0)",
        color: "var(--paper-0)",
        display: "grid",
        placeItems: "center",
        padding: "clamp(32px, 6vw, 96px)",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "620px" }}>
        {/* Check-circle SVG — inline so no request. */}
        <svg
          width="72"
          height="72"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--bwiga-blue-bright)"
          strokeWidth="1.5"
          style={{ margin: "0 auto 32px", display: "block" }}
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <h1
          style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontWeight: 300,
            fontSize: "clamp(32px, 5vw, 56px)",
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            margin: "0 0 20px",
          }}
        >
          Payment received
        </h1>

        <p
          style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "18px",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.78)",
            margin: "0 0 12px",
          }}
        >
          Your ticket to <strong>BWiGA Adriatic Edition</strong> — September 30, 2026,
          Avala Resort &amp; Villas — has been booked.
        </p>

        <p
          style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "16px",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.62)",
            margin: "0 0 40px",
          }}
        >
          A confirmation email is on its way to your inbox. Give your name at the
          reception desk on arrival to collect your badge.
        </p>

        {isMock && (
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: "12px",
              color: "#f5b642",
              background: "rgba(245, 182, 66, 0.08)",
              border: "1px solid rgba(245, 182, 66, 0.3)",
              borderRadius: "6px",
              padding: "10px 14px",
              marginBottom: "32px",
              letterSpacing: "0.04em",
            }}
          >
            DEV MOCK — no real payment or email dispatched. Set Custodex + Resend
            env vars to go live.
          </div>
        )}

        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "14px 28px",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--paper-0)",
            background:
              "linear-gradient(180deg, var(--bwiga-blue-bright) 0%, var(--bwiga-blue-deep) 100%)",
            borderRadius: "4px",
            textDecoration: "none",
          }}
        >
          Back to the site
        </Link>
      </div>
    </main>
  );
}
