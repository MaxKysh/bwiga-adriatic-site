"use client";

import { useEffect, useState } from "react";

// -----------------------------------------------------------------------------
// Announcement modal — the "we're moving to Belgrade" notice, delivered as a
// dismissible overlay on top of the regular site (rather than replacing it).
//
// Show/hide logic:
//   - Every page load → auto-open after a short delay (lets Preloader clear
//     first so the two overlays don't stack).
//   - User can close via ✕, backdrop click, or Esc — closes for this
//     session only (reload / next visit re-opens).
//   - Anywhere in the site, a link to `#announcement` re-opens the modal
//     (e.g. Hero's primary CTA — see Hero.tsx). Close clears the hash.
//
// If you ever need to hide the announcement completely, remove <Announcement />
// from app/page.tsx — the modal doesn't render any base-layer chrome, so
// removing it leaves the site untouched.
// -----------------------------------------------------------------------------

const HASH = "#announcement";
const OPEN_DELAY_MS = 900; // wait for Preloader fade-out

const CONTACT_EMAIL = "mail@lead-volume.com";

export default function Announcement() {
  const [open, setOpen] = useState(false);

  // Initial mount: auto-open every visit. If URL already has #announcement
  // (deep-link / re-open from Hero button), skip the delay and show now.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === HASH) {
      setOpen(true);
      return;
    }
    const t = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  // Re-open on hash change (Hero button, direct URL, back-forward).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHash = () => {
      if (window.location.hash === HASH) setOpen(true);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Esc-to-close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    // Lock body scroll while open.
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    // No persistence — модалка появится снова при следующем визите/reload'е.
    // Clear hash so #announcement можно триггернуть повторно в текущей сессии.
    if (typeof window !== "undefined" && window.location.hash === HASH) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  if (!open) return null;

  return (
    <div
      className="ann-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ann-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="ann">
        <button
          type="button"
          className="ann-close"
          aria-label="Close announcement"
          onClick={close}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <div className="ann-eyebrow">A message from the team</div>

        <h2 id="ann-title" className="ann-title">
          We&rsquo;re moving to Belgrade
          <br />
          <span className="accent">for Spring 2027</span>
        </h2>

        <div className="ann-body">
          <p>
            This was not an easy decision. After consulting with our partners,
            our team, for a number of reasons, decided to move all of our fall
            events from Montenegro to Serbia until spring 2027.
          </p>
          <p>
            Belgrade is a much more convenient meeting hub for our community,
            a fact confirmed after the first two events and preparations for
            the third. Therefore, the strategic decision to move to Belgrade
            for March next year is based on the needs of our audience and
            partners, for whom we want to create a more in-depth conference
            with targeted participants.
          </p>
          <p className="ann-signoff">
            See you in Serbia in the spring! Thank you for your understanding.
          </p>
        </div>

        <div className="ann-contact">
          <span className="ann-contact-label">Questions?</span>
          <a href={`mailto:${CONTACT_EMAIL}`} className="ann-contact-link">
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>

      <style jsx>{`
        .ann-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(3, 6, 12, 0.78);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: grid;
          place-items: center;
          padding: 20px;
          overflow-y: auto;
          animation: annFadeIn 260ms var(--ease-soft);
        }
        .ann {
          position: relative;
          width: 100%;
          max-width: 560px;
          background:
            radial-gradient(
              ellipse 80% 60% at 50% 0%,
              rgba(48, 131, 198, 0.16) 0%,
              rgba(10, 14, 26, 0) 65%
            ),
            linear-gradient(180deg, #14192a 0%, #0a0e1a 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 44px clamp(28px, 4vw, 44px) 36px;
          color: var(--paper-0);
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.7),
            0 0 0 1px rgba(79, 161, 220, 0.1) inset;
          animation: annRise 380ms var(--ease-spring);
          text-align: center;
        }
        @keyframes annFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes annRise {
          from { transform: translateY(18px); opacity: 0.6; }
          to { transform: translateY(0); opacity: 1; }
        }
        .ann-close {
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
        .ann-close:hover {
          background: rgba(255, 255, 255, 0.14);
          color: var(--paper-0);
        }

        .ann-eyebrow {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--bwiga-blue-bright);
          margin-bottom: 14px;
        }

        .ann-title {
          font-family: var(--font-inter);
          font-weight: 300;
          font-size: clamp(26px, 3.6vw, 40px);
          line-height: 1.1;
          letter-spacing: -0.01em;
          margin: 0 0 24px;
          text-wrap: balance;
        }
        .ann-title .accent {
          color: var(--bwiga-blue-bright);
          font-style: italic;
          font-weight: 300;
        }

        .ann-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
          text-align: left;
          font-family: var(--font-inter);
          font-size: 15px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.78);
          text-wrap: pretty;
        }
        .ann-body p { margin: 0; }
        .ann-signoff {
          margin-top: 6px !important;
          color: var(--paper-0);
          font-weight: 500;
        }

        .ann-contact {
          margin-top: 26px;
          display: inline-flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
          font-family: var(--font-inter);
        }
        .ann-contact-label {
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
        }
        .ann-contact-link {
          font-size: 15px;
          color: var(--paper-0);
          text-decoration: none;
          border-bottom: 1px solid rgba(79, 161, 220, 0.5);
          padding-bottom: 2px;
          transition: color 220ms var(--ease-soft), border-color 220ms var(--ease-soft);
        }
        .ann-contact-link:hover {
          color: var(--bwiga-blue-bright);
          border-color: var(--bwiga-blue-bright);
        }
      `}</style>
    </div>
  );
}
