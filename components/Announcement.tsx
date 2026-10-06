"use client";

import { useEffect, useState } from "react";

// -----------------------------------------------------------------------------
// Announcement modal — "we held it online this year, here are the winners,
// see you in Belgrade 2027" message. Delivered as a dismissible overlay on top
// of the regular site (rather than replacing it).
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

// Winners of the 2026 online celebration. Order matches the editorial
// list we received from the organizers — do not re-sort alphabetically.
type Winner = { category: string; name: string; sub?: string };
const WINNERS: Winner[] = [
  { category: "iGaming Lady of the Year", name: "Abigail Welch", sub: "editor of iGaming News" },
  { category: "Best PR Agency", name: "IdolMe Agency" },
  { category: "Best Game Studio", name: "100HP Gaming" },
  { category: "iGaming Influencer of the Year", name: "Pavlo Krombet" },
  { category: "Industry Impact Award", name: "Inna Babich" },
  { category: "Crypto Lady of the Year", name: "Samuela Davidova" },
  { category: "Networker of the Year", name: "Marina Rioni" },
  { category: "Web Studio of the Year", name: "Chipsa" },
  { category: "Marketing Team of the Year", name: "2PMarketing" },
  { category: "AI Rising Star", name: "SXIOS Intelligence" },
];

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

        {/* Hero poster — the "BWiGA NFT Online Awards 2026" visual we ran
            for the online celebration. 1:1 square at ~900×900, served from
            public/img. Rendered contained so nothing crops. */}
        <div className="ann-hero">
          {/* Plain <img> вместо next/image: модалка рендерится по условию
              и один раз, оптимизация next/image тут не стоит сложности
              с явной width/height / layout. Файл уже уменьшен до 900×900. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/online-awards-2026.jpg"
            alt="BWiGA NFT Online Awards 2026 — poster"
            width={900}
            height={900}
            loading="eager"
          />
        </div>

        <div className="ann-eyebrow">BWiGA Online Awards · 2026</div>

        <h2 id="ann-title" className="ann-title">
          The community has picked
          <br />
          <span className="accent">its 2026 winners</span>
        </h2>

        <div className="ann-body">
          <p>
            We celebrated our nominees online instead of holding the traditional
            in-person event in Montenegro. The following industry leaders
            emerged as our community&rsquo;s favorites in the voting:
          </p>

          <ul className="ann-winners" aria-label="2026 online winners">
            {WINNERS.map((w) => (
              <li key={w.category}>
                <span className="cat">{w.category}</span>
                <span className="who">
                  {w.name}
                  {w.sub ? <span className="sub"> — {w.sub}</span> : null}
                </span>
              </li>
            ))}
          </ul>

          <p className="ann-cheers">Our congratulations <span aria-hidden>🥂</span></p>
          <p className="ann-signoff">
            See you next time in <strong>Belgrade, Spring 2027</strong> &mdash; on
            the red carpet, awarding the best of the best in person.
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
          place-items: start center;
          padding: 20px;
          overflow-y: auto;
          animation: annFadeIn 260ms var(--ease-soft);
        }
        .ann {
          position: relative;
          width: 100%;
          max-width: 620px;
          margin: auto 0;
          background:
            radial-gradient(
              ellipse 80% 60% at 50% 0%,
              rgba(48, 131, 198, 0.16) 0%,
              rgba(10, 14, 26, 0) 65%
            ),
            linear-gradient(180deg, #14192a 0%, #0a0e1a 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 32px clamp(28px, 4vw, 44px) 36px;
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
          background: rgba(255, 255, 255, 0.3);
          border: 0;
          color: #fff;
          cursor: pointer;
          display: grid;
          place-items: center;
          z-index: 2;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          transition: background 180ms var(--ease-soft), color 180ms var(--ease-soft);
        }
        .ann-close:hover {
          background: rgba(255, 255, 255, 0.55);
          color: var(--paper-0);
        }

        /* ---------- Hero poster ---------- */
        .ann-hero {
          /* Pull edge-to-edge within the padded modal so the poster has
             presence; keep rounded top corners aligned with modal radius. */
          margin: -32px calc(-1 * clamp(28px, 4vw, 44px)) 24px;
          border-top-left-radius: 14px;
          border-top-right-radius: 14px;
          overflow: hidden;
          background: #0a0e1a;
        }
        .ann-hero img {
          display: block;
          width: 100%;
          height: auto;
          /* Контейнерный max-height — чтобы на вертикальных экранах постер
             не съедал всю видимую высоту модалки до прокрутки. */
          max-height: 320px;
          object-fit: cover;
          object-position: center;
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
          gap: 20px;
          text-align: left;
          font-family: var(--font-inter);
          font-size: 15px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.78);
          text-wrap: pretty;
        }
        .ann-body p { margin: 0; }

        /* ---------- Winners list ----------
           Each row: eyebrow-styled category above the winner. Dividers
           hairline-faint so the list reads as credits, not a table. */
        .ann-winners {
          list-style: none;
          margin: 2px 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .ann-winners li {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .ann-winners .cat {
          font-size: var(--fs-micro);
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.48);
          line-height: 1.2;
        }
        .ann-winners .who {
          font-size: 16px;
          line-height: 1.35;
          color: var(--paper-0);
          font-weight: 500;
        }
        .ann-winners .who .sub {
          color: rgba(255, 255, 255, 0.6);
          font-weight: 400;
          font-size: 14px;
        }

        .ann-cheers {
          margin-top: 2px !important;
          color: var(--paper-0);
          font-weight: 500;
        }
        .ann-signoff {
          color: var(--paper-0);
          font-weight: 400;
        }
        .ann-signoff strong {
          color: var(--bwiga-blue-bright);
          font-weight: 600;
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

        @media (max-width: 520px) {
          .ann {
            padding: 24px 22px 28px;
          }
          .ann-hero {
            margin: -24px -22px 20px;
          }
          .ann-hero img {
            max-height: 260px;
          }
        }
      `}</style>
    </div>
  );
}
