"use client";

import content from "@/data/content.json";
import { mailto } from "@/lib/mailto";
import {
  TICKET_BODY,
  TICKET_SUBJECT,
  WHITELIST_BODY,
  WHITELIST_SUBJECT,
} from "@/lib/mail-templates";

// -----------------------------------------------------------------------------
// Section chrome + a few editorial copy bits not in content.json.
// -----------------------------------------------------------------------------
const DAY_MARK = "05";
const DAY_EYEBROW = "Schedule · Registration";
const DAY_TAG = "The Day";
const DAY_DATE = "September 30, 2026";
const DAY_META = "Conference · Awards · After Party · 14:00 — 23:00";

// Priority ticket copy lives partly in JSON (cta, fields) and partly here.
// "Free" was misleading — Whitelist is by-application and is, if anything,
// priced above Standard. "By invitation" reads as premium without committing
// to a number until Alexey sets one.
const PRIORITY_TIER = "Priority";
// Short word that fits the same big "price" slot as €200, so both stubs
// match in height. "Invite" reads premium without naming a number.
const PRIORITY_VALUE = "Invite";
const PRIORITY_SUB = "Founders & C-level · limited";
const PRIORITY_EYE = "VIP & networking";
const PRIORITY_NAME = "Premium seats, VIP party access";
const PRIORITY_DESC =
  "Get priority for premium seats, VIP after-party access, and exclusive networking sessions.";
const PRIORITY_CORNER = "№ Prio · 30 Sep";

const STANDARD_TIER = "Standard";
const STANDARD_SUB = "per attendee · crypto pay";
const STANDARD_EYE = "Full event access";
const STANDARD_NAME = "Conference, Awards & Evening Party";
const STANDARD_DESC = "Conference hall · Awards ceremony · Evening party.";
const STANDARD_CTA = "Get a ticket";
const STANDARD_CORNER = "№ Std · 30 Sep";

// Identify the "Awards Ceremony" schedule row case-insensitively so editors
// can rephrase the title (within reason) without losing the gold treatment.
function isAwardsRow(title: string): boolean {
  return /awards\s+ceremony/i.test(title);
}

export default function Day() {
  const items = content.schedule.items;
  const standard = content.registration.tickets[0];
  const whitelistCta = content.registration.whitelist_form.cta;
  const cryptoNote = "Crypto payment via processor";
  const statusLabel = content.schedule.status_label.replace(/!\s*$/, "");

  return (
    <section className="day" id="day" aria-label="The day schedule and tickets">
      <div className="day-inner">
        <div className="day-head">
          <div className="left">
            <span className="nm">{DAY_MARK}</span>
            <span className="eye">{DAY_EYEBROW}</span>
          </div>
          <div className="tag">{DAY_TAG}</div>
        </div>

        <div className="day-grid">
          {/* ---- LEFT: Schedule ---- */}
          <div className="day-schedule">
            <header className="ds-head">
              <h3 className="ds-date">{DAY_DATE}</h3>
              <p className="ds-meta">{DAY_META}</p>
            </header>

            <ol className="ds-list">
              {items.map((it) => {
                const accent = isAwardsRow(it.title);
                return (
                  <li
                    key={it.time}
                    className={`ds-row ${accent ? "ds-row--accent" : ""}`}
                  >
                    <span className="ds-time">{it.time}</span>
                    <span className="ds-title">{it.title}</span>
                  </li>
                );
              })}
            </ol>

            <p className="ds-status">
              <span className="ds-status-dot" aria-hidden />
              {statusLabel}
            </p>
          </div>

          {/* ---- RIGHT: Tickets ---- */}
          <aside className="day-tickets">
            {/* Standard — silver paper ticket. */}
            <article className="ticket ticket--silver">
              <div className="ticket-stub">
                <header className="ts-head">
                  <div className="tier">{STANDARD_TIER}</div>
                  <span className="corner">{STANDARD_CORNER}</span>
                </header>
                <div className="price">{standard.price_display}</div>
                <div className="sub">{STANDARD_SUB}</div>
              </div>
              <div className="ticket-body">
                <span className="notch top" aria-hidden />
                <span className="notch bot" aria-hidden />
                <span className="seam" aria-hidden />
                <div className="eye">{STANDARD_EYE}</div>
                <h4 className="name">{STANDARD_NAME}</h4>
                <p className="desc">{STANDARD_DESC}</p>
                <a
                  className="ticket-btn"
                  href={mailto(
                    content.contacts.email,
                    TICKET_SUBJECT,
                    TICKET_BODY
                  )}
                >
                  <span className="ticket-btn-label">
                    {STANDARD_CTA}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path
                        d="M2 7H12 M8 3L12 7L8 11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                      />
                    </svg>
                  </span>
                </a>
              </div>
            </article>

            {/* Priority — gold paper ticket. Same recipe as Standard, gold tones. */}
            <article className="ticket ticket--gold">
              <div className="ticket-stub">
                <header className="ts-head">
                  <div className="tier">{PRIORITY_TIER}</div>
                  <span className="corner">{PRIORITY_CORNER}</span>
                </header>
                <div className="price">{PRIORITY_VALUE}</div>
                <div className="sub">{PRIORITY_SUB}</div>
              </div>
              <div className="ticket-body">
                <span className="notch top" aria-hidden />
                <span className="notch bot" aria-hidden />
                <span className="seam" aria-hidden />
                <div className="eye">{PRIORITY_EYE}</div>
                <h4 className="name">{PRIORITY_NAME}</h4>
                <p className="desc">{PRIORITY_DESC}</p>
                <a
                  className="ticket-btn"
                  href={mailto(
                    content.contacts.email,
                    WHITELIST_SUBJECT,
                    WHITELIST_BODY
                  )}
                >
                  <span className="ticket-btn-label">
                    {whitelistCta}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path
                        d="M2 7H12 M8 3L12 7L8 11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                      />
                    </svg>
                  </span>
                </a>
              </div>
            </article>
            {/* Payment note — sits inside .day-tickets so it follows the
                two ticket cards as a shared footer, rather than dropping
                to the bottom of the whole day-grid (where it would float
                far below the short schedule column). */}
            <p className="day-tickets-note">{cryptoNote}</p>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .day {
          position: relative;
          border-top: 1px solid var(--hairline);
          background: var(--ink-0);
          padding: clamp(56px, 6vw, 96px) 0;
          scroll-margin-top: 24px;
        }
        .day-inner {
          padding: 0 clamp(28px, 4vw, 64px);
          max-width: none;
        }

        /* ---------- Head ---------- */
        .day-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--hairline);
          margin-bottom: 56px;
        }
        .day-head .left {
          display: flex;
          align-items: baseline;
          gap: 24px;
        }
        .day-head .nm {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: var(--fs-eyebrow);
          color: var(--paper-2);
          line-height: 1;
        }
        .day-head .eye {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-2);
          line-height: 1;
        }
        .day-head .tag {
          font-family: var(--font-inter);
          font-size: var(--fs-micro);
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--bwiga-blue);
          padding: 6px 10px;
          border: 1px solid var(--bwiga-blue);
          border-radius: 2px;
          line-height: 1;
          white-space: nowrap;
        }

        /* ---------- Grid ---------- */
        .day-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(32px, 4vw, 72px);
          align-items: start;
        }

        /* ---------- Schedule ---------- */
        .day-schedule {
          min-width: 0;
        }
        .ds-head {
          margin-bottom: clamp(24px, 2.6vw, 36px);
        }
        .ds-date {
          margin: 0 0 10px;
          font-family: var(--font-inter);
          font-weight: 300;
          font-size: clamp(32px, 3.4vw, 52px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: var(--paper-0);
        }
        .ds-meta {
          margin: 0;
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--paper-2);
        }
        .ds-list {
          list-style: none;
          margin: 0;
          padding: 0;
          border-top: 1px solid var(--hairline);
        }
        .ds-row {
          display: flex;
          align-items: baseline;
          gap: 20px;
          padding: clamp(16px, 1.6vw, 22px) clamp(14px, 1.4vw, 20px);
          border-bottom: 1px solid var(--hairline);
          position: relative;
          transition: background 220ms ease, padding 220ms ease;
        }
        .ds-row:hover {
          background: rgba(255, 255, 255, 0.02);
          padding-left: calc(clamp(14px, 1.4vw, 20px) + 8px);
          padding-right: calc(clamp(14px, 1.4vw, 20px) + 8px);
        }
        .ds-time {
          flex: 0 0 auto;
          min-width: 110px;
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: 12.5px;
          font-feature-settings: "tnum";
          letter-spacing: 0.04em;
          color: var(--paper-2);
          white-space: nowrap;
        }
        .ds-title {
          flex: 1 1 auto;
          font-family: var(--font-inter);
          font-weight: 400;
          font-size: clamp(16px, 1.2vw, 20px);
          line-height: 1.3;
          color: var(--paper-0);
          text-wrap: balance;
        }
        /* The one and only gold accent in this section — Awards Ceremony row. */
        .ds-row--accent {
          background: linear-gradient(
            90deg,
            rgba(217, 178, 106, 0.06),
            rgba(217, 178, 106, 0)
          );
        }
        .ds-row--accent::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--bwiga-gold);
        }
        .ds-row--accent .ds-time {
          color: var(--bwiga-gold);
        }
        .ds-row--accent .ds-title {
          font-weight: 600;
          color: var(--paper-0);
        }
        .ds-row--accent:hover {
          background: linear-gradient(
            90deg,
            rgba(217, 178, 106, 0.1),
            rgba(217, 178, 106, 0)
          );
        }

        .ds-status {
          margin: clamp(20px, 2vw, 28px) 0 0;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          border: 1px solid var(--hairline-strong);
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.025);
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--paper-1);
        }
        /* Status pulse in BWiGA blue — design used gold here but the
           page-wide rule reserves gold for the Awards Ceremony row and the
           Sep 30 timeline dot only. Blue keeps the affordance subtle. */
        .ds-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--bwiga-blue);
          box-shadow: 0 0 0 0 rgba(48, 131, 198, 0.5);
          animation: dsPulse 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
        }
        @keyframes dsPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(48, 131, 198, 0.45);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(48, 131, 198, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(48, 131, 198, 0);
          }
        }

        /* ---------- Tickets ---------- */
        .day-tickets {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(16px, 1.8vw, 28px);
          min-width: 0;
        }
        .ticket {
          position: relative;
          display: grid;
          grid-template-rows: auto 1fr;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.55) inset,
            0 -2px 0 rgba(0, 0, 0, 0.25) inset,
            0 2px 0 rgba(0, 0, 0, 0.55),
            0 6px 0 rgba(0, 0, 0, 0.25),
            0 14px 28px rgba(0, 0, 0, 0.45),
            0 32px 64px rgba(0, 0, 0, 0.55);
          transition: transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
            filter 320ms ease;
        }
        .ticket:hover {
          transform: translateY(-2px);
          filter: brightness(1.04);
        }

        /* ============================================================
           Ticket stub — the metal "stub" half of the paper ticket. Shared
           recipe; .ticket--silver and .ticket--gold swap STUB palette only
           via CSS custom properties. Body is identical for both variants —
           warm cream paper, regardless of which metal sits above. The
           mixed-metal-on-cream-paper combo feels deliberately "vintage".
           ============================================================ */
        .ticket {
          /* Stub defaults overridden per variant below. */
          --stub-grad-1: #f0d58f;
          --stub-grad-2: #d9b26a;
          --stub-grad-3: #a87c3c;
          --stub-shade: rgba(80, 42, 8, 0.35);
          --stub-ink: #1a140a;
          --stub-ink-soft: rgba(26, 20, 10, 0.78);
          --stub-ink-faint: rgba(26, 20, 10, 0.55);
        }
        .ticket-stub {
          position: relative;
          padding: clamp(20px, 2.2vw, 28px) clamp(20px, 2.2vw, 26px)
            clamp(18px, 2vw, 24px);
          display: flex;
          flex-direction: column;
          gap: 10px;
          color: var(--stub-ink);
          background: radial-gradient(
              ellipse 70% 90% at 20% 0%,
              rgba(255, 255, 255, 0.5),
              transparent 60%
            ),
            radial-gradient(
              ellipse 80% 80% at 100% 100%,
              var(--stub-shade),
              transparent 60%
            ),
            linear-gradient(
              155deg,
              var(--stub-grad-1) 0%,
              var(--stub-grad-2) 45%,
              var(--stub-grad-3) 100%
            );
          overflow: hidden;
          isolation: isolate;
        }
        /* Paper grain — same dot-noise as before, scoped to ::before so the
           sheen can use ::after exclusively. */
        .ticket-stub::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(
              circle at 20% 30%,
              rgba(0, 0, 0, 0.04) 1px,
              transparent 2px
            ),
            radial-gradient(
              circle at 70% 60%,
              rgba(0, 0, 0, 0.03) 1px,
              transparent 2px
            ),
            radial-gradient(
              circle at 40% 80%,
              rgba(255, 255, 255, 0.06) 1px,
              transparent 2px
            );
          background-size: 7px 7px, 11px 11px, 13px 13px;
          pointer-events: none;
          mix-blend-mode: multiply;
          opacity: 0.55;
          z-index: 1;
        }
        /* Sheen sweep — a diagonal bright stripe that travels across the
           metal stub on hover. Imitates a polished ingot catching light.
           Sits above paper grain (z-index 2) but below content (z-index 3). */
        .ticket-stub::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 38%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 62%,
            transparent 100%
          );
          transform: translateX(-130%);
          pointer-events: none;
          z-index: 2;
          mix-blend-mode: screen;
        }
        .ticket:hover .ticket-stub::after {
          animation: ticketSheen 1100ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
        }
        @keyframes ticketSheen {
          0% {
            transform: translateX(-130%);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          88% {
            opacity: 1;
          }
          100% {
            transform: translateX(130%);
            opacity: 0;
          }
        }
        .ticket-stub > * {
          position: relative;
          z-index: 3;
        }
        .ts-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .ticket-stub .corner {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          color: var(--stub-ink-faint);
          text-transform: uppercase;
          line-height: 1;
          padding-top: 2px;
          white-space: nowrap;
        }
        .ticket-stub .tier {
          font-family: var(--font-inter);
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--stub-ink-soft);
          line-height: 1;
        }
        .ticket-stub .price {
          font-family: var(--font-inter);
          font-weight: 300;
          font-size: clamp(48px, 4.6vw, 72px);
          line-height: 0.92;
          letter-spacing: -0.045em;
          color: var(--stub-ink);
          font-feature-settings: "tnum";
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        .ticket-stub .sub {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: 11px;
          color: var(--stub-ink-faint);
          letter-spacing: 0.04em;
        }

        /* Body — plain white paper for both Silver and Gold variants. */
        .ticket-body {
          position: relative;
          padding: clamp(22px, 2.2vw, 28px) clamp(20px, 2.2vw, 26px)
            clamp(22px, 2.2vw, 28px);
          display: flex;
          flex-direction: column;
          gap: 12px;
          color: #1a140a;
          background: #ffffff;
        }
        .ticket-body::before {
          /* Drop the warm edge glow — keeping ::before as an empty rule slot
             so the cascade doesn't pick up an old declaration somewhere. */
          content: none;
        }
        .ticket-body::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(
              circle at 20% 30%,
              rgba(0, 0, 0, 0.03) 1px,
              transparent 2px
            ),
            radial-gradient(
              circle at 70% 60%,
              rgba(0, 0, 0, 0.02) 1px,
              transparent 2px
            );
          background-size: 9px 9px, 13px 13px;
          pointer-events: none;
          mix-blend-mode: multiply;
          opacity: 0.55;
        }
        .ticket-body > * {
          position: relative;
          z-index: 1;
        }
        .ticket-body .eye {
          font-family: var(--font-inter);
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #8a6f2d;
        }
        .ticket-body .name {
          font-family: var(--font-inter);
          font-weight: 300;
          font-size: clamp(20px, 1.8vw, 26px);
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: #1a140a;
          margin: 0;
        }
        .ticket-body .desc {
          font-family: var(--font-inter);
          font-size: 13.5px;
          line-height: 1.55;
          color: rgba(26, 20, 10, 0.72);
          margin: 0;
        }
        .ticket-body .note {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          color: rgba(26, 20, 10, 0.55);
          margin: 0;
        }
        /* Crypto-payment caption — sits under both tickets as a quiet
           footer. Replaces the inline ticket-action note row which
           overflowed narrow ticket columns on laptop sizes. */
        .day-tickets-note {
          grid-column: 1 / -1;
          margin: 12px 0 0;
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--paper-2);
          text-align: center;
        }

        /* -------- Silver variant — bright polished platinum -------------- */
        .ticket--silver {
          --stub-grad-1: #f1f4f9;
          --stub-grad-2: #d5dbe6;
          --stub-grad-3: #aab3c4;
          --stub-shade: rgba(40, 50, 75, 0.22);
          --stub-ink: #0c1018;
          --stub-ink-soft: rgba(12, 16, 24, 0.82);
          --stub-ink-faint: rgba(12, 16, 24, 0.58);
        }

        /* -------- Gold variant — warm bronze (matches the design's foil) -- */
        .ticket--gold {
          --stub-grad-1: #f0d58f;
          --stub-grad-2: #d9b26a;
          --stub-grad-3: #a87c3c;
          --stub-shade: rgba(80, 42, 8, 0.35);
          --stub-ink: #1a140a;
          --stub-ink-soft: rgba(26, 20, 10, 0.78);
          --stub-ink-faint: rgba(26, 20, 10, 0.55);
        }

        /* Local ticket-button — sits at the bottom of its body. The body
           is a flex column, so margin-top:auto on the button glues it to
           the bottom regardless of how much body copy sits above it. Both
           tickets land their buttons on the same baseline naturally. */
        .ticket-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-inter);
          font-weight: 600;
          font-size: var(--fs-caption);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 14px 22px;
          border: 0;
          border-radius: 4px;
          cursor: pointer;
          color: var(--paper-0);
          background: linear-gradient(
            180deg,
            var(--bwiga-blue-bright) 0%,
            var(--bwiga-blue-deep) 100%
          );
          isolation: isolate;
          overflow: hidden;
          transform: scale(1);
          transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
          align-self: flex-start;
          margin-top: auto;
        }
        .ticket-btn-label {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: color 850ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ticket-btn::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 100%;
          background: #1a140a;
          transform: translateY(101%);
          transition: transform 850ms cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1;
        }
        .ticket-btn:hover {
          transform: scale(1.03);
        }
        .ticket-btn:hover::before {
          transform: translateY(0);
        }
        .ticket-btn:hover .ticket-btn-label {
          color: var(--paper-0);
        }
        .ticket-btn:active {
          transform: scale(0.98);
        }

        /* Perforated seam */
        .ticket :global(.notch) {
          position: absolute;
          top: 0;
          width: 18px;
          height: 18px;
          background: var(--ink-0);
          border-radius: 50%;
          transform: translateY(-50%);
          z-index: 3;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
        }
        .ticket :global(.notch.top) {
          left: -9px;
        }
        .ticket :global(.notch.bot) {
          right: -9px;
        }
        .ticket :global(.seam) {
          position: absolute;
          left: 16px;
          right: 16px;
          top: 0;
          border-top: 1.5px dashed rgba(26, 20, 10, 0.32);
          transform: translateY(-0.5px);
          z-index: 2;
        }


        /* ---------- Responsive ---------- */
        @media (max-width: 1280px) {
          /* Stack schedule above tickets — at narrower-than-1280 widths the
             two-col layout squeezes ticket buttons (Join the Whitelist)
             past the card edge. */
          .day-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .day-head {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
        }
        @media (max-width: 720px) {
          .day-tickets {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 560px) {
          .ds-row {
            flex-direction: column;
            gap: 6px;
          }
          .ds-time {
            min-width: 0;
          }
          .ticket-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-status-dot {
            animation: none;
          }
          .ds-row,
          .ticket {
            transition: none;
          }
          .ticket:hover {
            transform: none;
            filter: none;
          }
          .ticket:hover .ticket-stub::after {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
