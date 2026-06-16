"use client";

import content from "@/data/content.json";
import { mailto } from "@/lib/mailto";
import { PARTNER_BODY, PARTNER_SUBJECT } from "@/lib/mail-templates";

// -----------------------------------------------------------------------------
// Editorial chrome + the short bits that aren't in content.json (column
// eyebrows, brand tagline, quick-link labels).
// -----------------------------------------------------------------------------
const FOOTER_MARK = "08";
const FOOTER_EYEBROW = "Contacts";
const FOOTER_TAG = "Contacts";
const BRAND_TAGLINE = "Web3 & iGaming Awards. Adriatic Edition. September 30, 2026.";
const BRAND_COPY = "© 2026 Lead Volume";

export default function Footer() {
  const { email, telegram_handle, socials } = content.contacts;
  // "Become a partner" должен открывать mailto (как одноимённая кнопка в
  // секции Partners) — раньше вёл на #contacts, на десктопе это означает
  // прыжок в ту же секцию, где сама ссылка → визуально клик «не работает».
  // mailto хотя бы открывает почтовый клиент с предзаполненной формой.
  const QUICK_LINKS = [
    { label: "Apply nomination", href: "#awards" },
    { label: "Become a partner", href: mailto(email, PARTNER_SUBJECT, PARTNER_BODY) },
    { label: "Speak at BWiGA", href: "#people" },
  ];

  return (
    <section className="footer" id="contacts" aria-label="Contacts and footer">
      <div className="footer-inner">
        {/* ---- Section head ---- */}
        <div className="footer-head">
          <div className="left">
            <span className="nm">{FOOTER_MARK}</span>
            <span className="eye">{FOOTER_EYEBROW}</span>
          </div>
          <div className="tag">{FOOTER_TAG}</div>
        </div>

        {/* ---- 4-column grid: Brand | Contacts | Follow | Quick links ---- */}
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-col footer-brand">
            <a className="brand-mark" href="#hero" aria-label="BWiGA — Balkan Web3 & iGaming Awards home">
              <span className="brand-logo" role="img" aria-label="BWiGA" />
            </a>
            <p className="brand-tagline">{BRAND_TAGLINE}</p>
            <p className="brand-copy">{BRAND_COPY}</p>
          </div>

          {/* Contacts */}
          <div className="footer-col">
            <h4 className="col-eye">Contacts</h4>
            <ul className="col-list">
              <li>
                <a className="col-link" href={`mailto:${email}`}>
                  {email}
                </a>
              </li>
              <li>
                <a
                  className="col-link"
                  href={`https://t.me/${telegram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{telegram_handle}
                </a>
              </li>
            </ul>
          </div>

          {/* Follow */}
          <div className="footer-col">
            <h4 className="col-eye">Follow</h4>
            <ul className="social-row" role="list">
              <li>
                <a
                  className="social"
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="BWiGA on LinkedIn"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  className="social"
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="BWiGA on Instagram"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  className="social"
                  href={socials.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="BWiGA on Telegram"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21.5 4.5 2.5 11.5l5.5 2 2 6.5 3.5-4 5 4 3-15.5z" />
                    <path d="m8 13.5 7.5-5.5L10 14.5" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  className="social"
                  href={socials.x_twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="BWiGA on X"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 4l7.5 10L4.5 20H7l6-6.4L17.5 20H20l-7.8-10.4L19.5 4H17l-5.5 5.9L7 4z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div className="footer-col">
            <h4 className="col-eye">Quick links</h4>
            <ul className="col-list">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <a className="col-link" href={l.href}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom hairline — closes the page rhythm. */}
        <div className="footer-rule" aria-hidden />
      </div>

      <style jsx>{`
        .footer {
          position: relative;
          color: var(--paper-0);
          padding: clamp(56px, 6vw, 96px) 0 clamp(40px, 5vw, 72px);
          scroll-margin-top: 24px;
          isolation: isolate;
          /* Brand blue going darker — no bright highlight, no light-mode
             "ticket paper" feel. Starts at the brand hex and sinks into a
             deep blue-ink at the bottom-right. */
          background: radial-gradient(
              ellipse 90% 90% at 100% 100%,
              rgba(5, 15, 30, 0.55),
              transparent 70%
            ),
            linear-gradient(160deg, #3083c6 0%, #1e5f95 50%, #0f3d66 100%);
        }
        /* Paper grain — same dot recipe as the hero stats panel. */
        .footer::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(
              circle at 20% 30%,
              rgba(0, 0, 0, 0.05) 1px,
              transparent 2px
            ),
            radial-gradient(
              circle at 70% 60%,
              rgba(0, 0, 0, 0.04) 1px,
              transparent 2px
            ),
            radial-gradient(
              circle at 40% 80%,
              rgba(255, 255, 255, 0.06) 1px,
              transparent 2px
            );
          background-size: 7px 7px, 11px 11px, 13px 13px;
          mix-blend-mode: overlay;
          opacity: 0.55;
          pointer-events: none;
          z-index: 0;
        }
        .footer-inner {
          position: relative;
          z-index: 1;
          padding: 0 clamp(28px, 4vw, 64px);
        }

        /* -------- Section head -------- */
        .footer-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 32px;
          padding-bottom: 24px;
          /* Dashed hairline rhymes with the perforated ticket seam. */
          border-bottom: 1px dashed rgba(255, 255, 255, 0.32);
          margin-bottom: clamp(56px, 7vw, 96px);
        }
        .footer-head .left {
          display: flex;
          align-items: baseline;
          gap: 24px;
        }
        .footer-head .nm {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: var(--fs-eyebrow);
          color: rgba(255, 255, 255, 0.78);
          line-height: 1;
        }
        .footer-head .eye {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.78);
          line-height: 1;
        }
        .footer-head .tag {
          font-family: var(--font-inter);
          font-size: var(--fs-micro);
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-0);
          padding: 6px 10px;
          border: 1px solid rgba(255, 255, 255, 0.65);
          border-radius: 2px;
          line-height: 1;
          white-space: nowrap;
        }

        /* -------- Grid -------- */
        .footer-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
          gap: clamp(40px, 5vw, 80px);
          align-items: start;
        }
        .footer-col {
          min-width: 0;
        }

        /* -------- Brand column --------
           Use the BWiGA SVG as a CSS mask so the whole logo paints flat white
           regardless of how the source SVG mixes fills. */
        .footer-brand .brand-mark {
          display: inline-block;
          text-decoration: none;
          line-height: 0;
        }
        .footer-brand .brand-logo {
          display: block;
          width: clamp(200px, 22vw, 260px);
          aspect-ratio: 3 / 1;
          background-color: var(--paper-0);
          -webkit-mask: url(/bwiga-logo-clean.svg) no-repeat left center / contain;
          mask: url(/bwiga-logo-clean.svg) no-repeat left center / contain;
          transition: background-color 180ms var(--ease-soft);
        }
        .footer-brand .brand-mark:hover .brand-logo,
        .footer-brand .brand-mark:focus-visible .brand-logo {
          background-color: rgba(255, 255, 255, 0.85);
        }
        .footer-brand .brand-mark:focus-visible {
          outline: 2px solid var(--paper-0);
          outline-offset: 4px;
        }
        .footer-brand .brand-tagline {
          margin: 20px 0 0;
          max-width: 38ch;
          font-family: var(--font-inter);
          font-size: 16px;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.88);
          text-wrap: pretty;
        }
        .footer-brand .brand-copy {
          margin: 18px 0 0;
          font-family: var(--font-inter);
          font-size: var(--fs-caption);
          color: rgba(255, 255, 255, 0.62);
          letter-spacing: 0.01em;
        }

        /* -------- Column eyebrows + link lists -------- */
        .footer-col .col-eye {
          margin: 0 0 18px;
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.78);
          line-height: 1;
        }
        .footer-col .col-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .footer-col .col-link {
          display: inline-block;
          font-family: var(--font-inter);
          font-size: 16px;
          font-weight: 400;
          color: var(--paper-0);
          text-decoration: none;
          line-height: 1.45;
          border-bottom: 1px solid transparent;
          transition: color 180ms var(--ease-soft),
            border-color 180ms var(--ease-soft);
        }
        .footer-col .col-link:hover,
        .footer-col .col-link:focus-visible {
          color: var(--paper-0);
          border-bottom-color: rgba(255, 255, 255, 0.85);
        }
        .footer-col .col-link:focus-visible {
          outline: 2px solid var(--paper-0);
          outline-offset: 4px;
          border-bottom-color: transparent;
        }

        /* -------- Social row -------- */
        .social-row {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.45);
          color: rgba(255, 255, 255, 0.85);
          transition: background 180ms var(--ease-soft),
            color 180ms var(--ease-soft),
            border-color 180ms var(--ease-soft),
            transform 180ms var(--ease-soft);
        }
        .social :global(svg) {
          width: 20px;
          height: 20px;
        }
        .social:hover {
          background: var(--paper-0);
          color: var(--bwiga-blue);
          border-color: var(--paper-0);
          transform: translateY(-1px);
        }
        .social:focus-visible {
          outline: 2px solid var(--paper-0);
          outline-offset: 3px;
        }

        /* -------- Bottom rule -------- */
        .footer-rule {
          margin-top: clamp(56px, 7vw, 96px);
          height: 1px;
          background: rgba(255, 255, 255, 0.22);
        }

        /* -------- Responsive -------- */
        @media (max-width: 960px) {
          .footer-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 48px 40px;
          }
          .footer-brand {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 560px) {
          .footer-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 40px;
          }
          .footer-brand {
            grid-column: auto;
          }
          .footer-head {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
        }
      `}</style>
    </section>
  );
}
