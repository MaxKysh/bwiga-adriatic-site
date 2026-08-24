"use client";

import { useEffect, useRef, useState } from "react";

// -----------------------------------------------------------------------------
// TicketCheckoutModal — inline modal that opens from Day.tsx's "Buy ticket"
// button. Takes {name, email}, POSTs to /api/checkout, follows the returned
// payment_url (redirect to Custodex hosted payment page).
//
// UX contract:
//   - Backdrop click / Esc / X button close the modal
//   - Submit disables inputs + shows spinner
//   - Server error (400 / 502) surfaces inline; no toast dependency
//   - On success we navigate away (window.location) so back-button behavior
//     is the browser's natural "back to site"
// -----------------------------------------------------------------------------

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TicketCheckoutModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Focus first input on open + lock background scroll.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 40);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        payment_url?: string;
        error?: string;
      };
      if (!res.ok || !data.payment_url) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      // Full-page navigation — Custodex hosted form takes over from here.
      window.location.href = data.payment_url;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="ticket-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="ticket-modal">
        <button
          type="button"
          className="ticket-modal-close"
          aria-label="Close checkout"
          onClick={onClose}
          disabled={submitting}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="ticket-modal-head">
          <div className="ticket-modal-eye">Standard ticket · €200</div>
          <h2 id="ticket-modal-title" className="ticket-modal-title">
            Buy your ticket
          </h2>
          <p className="ticket-modal-sub">
            Enter your name and email. On the next step you&rsquo;ll be redirected
            to our crypto payment page (USDT / BTC / ETH).
          </p>
        </div>

        <form className="ticket-modal-form" onSubmit={handleSubmit} noValidate>
          <label className="ticket-modal-field">
            <span>Full name</span>
            <input
              ref={firstFieldRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alexey Nasybullin"
              required
              minLength={2}
              maxLength={200}
              disabled={submitting}
              autoComplete="name"
            />
          </label>

          <label className="ticket-modal-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              maxLength={320}
              disabled={submitting}
              autoComplete="email"
            />
          </label>

          {error && (
            <div className="ticket-modal-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="ticket-modal-submit" disabled={submitting || !name || !email}>
            {submitting ? (
              <>
                <span className="ticket-modal-spinner" aria-hidden />
                Redirecting to payment…
              </>
            ) : (
              <>Continue to payment →</>
            )}
          </button>

          <p className="ticket-modal-legal">
            By continuing you agree that BWiGA will use your email to send your
            ticket confirmation and event logistics only.
          </p>
        </form>
      </div>

      <style jsx>{`
        .ticket-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(3, 6, 12, 0.72);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: grid;
          place-items: center;
          padding: 20px;
          overflow-y: auto;
          animation: modalFadeIn 220ms var(--ease-soft);
        }
        .ticket-modal {
          position: relative;
          width: 100%;
          max-width: 460px;
          background: linear-gradient(180deg, #14192a 0%, #0a0e1a 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 40px clamp(24px, 4vw, 36px) 32px;
          color: var(--paper-0);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(79, 161, 220, 0.08) inset;
          animation: modalRise 320ms var(--ease-spring);
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalRise {
          from { transform: translateY(16px); opacity: 0.6; }
          to { transform: translateY(0); opacity: 1; }
        }
        .ticket-modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 0;
          color: rgba(255, 255, 255, 0.75);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: background 180ms var(--ease-soft), color 180ms var(--ease-soft);
        }
        .ticket-modal-close:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
          color: var(--paper-0);
        }
        .ticket-modal-close:disabled { opacity: 0.4; cursor: not-allowed; }

        .ticket-modal-head { margin-bottom: 24px; }
        .ticket-modal-eye {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--bwiga-blue-bright);
          margin-bottom: 10px;
        }
        .ticket-modal-title {
          font-family: var(--font-inter);
          font-weight: 300;
          font-size: 28px;
          letter-spacing: -0.01em;
          line-height: 1.1;
          margin: 0 0 12px;
        }
        .ticket-modal-sub {
          font-family: var(--font-inter);
          font-size: 14px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.62);
          margin: 0;
        }

        .ticket-modal-form { display: flex; flex-direction: column; gap: 16px; }
        .ticket-modal-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ticket-modal-field span {
          font-family: var(--font-inter);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
        }
        .ticket-modal-field input {
          font-family: var(--font-inter);
          font-size: 16px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          color: var(--paper-0);
          transition: border-color 180ms var(--ease-soft), background 180ms var(--ease-soft);
          -webkit-appearance: none;
          appearance: none;
        }
        .ticket-modal-field input:focus {
          outline: none;
          border-color: var(--bwiga-blue-bright);
          background: rgba(48, 131, 198, 0.08);
        }
        .ticket-modal-field input:disabled { opacity: 0.5; }

        .ticket-modal-error {
          font-family: var(--font-inter);
          font-size: 13px;
          line-height: 1.4;
          color: #ff9a94;
          background: rgba(255, 100, 92, 0.1);
          border: 1px solid rgba(255, 100, 92, 0.3);
          border-radius: 6px;
          padding: 10px 12px;
        }

        .ticket-modal-submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 20px;
          font-family: var(--font-inter);
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--paper-0);
          background: linear-gradient(
            180deg,
            var(--bwiga-blue-bright) 0%,
            var(--bwiga-blue-deep) 100%
          );
          border: 0;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 8px;
          transition: transform 180ms var(--ease-soft), opacity 180ms var(--ease-soft);
        }
        .ticket-modal-submit:hover:not(:disabled) { transform: translateY(-1px); }
        .ticket-modal-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .ticket-modal-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 700ms linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .ticket-modal-legal {
          font-family: var(--font-inter);
          font-size: 11px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.42);
          margin: 4px 0 0;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
