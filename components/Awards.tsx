"use client";

import { useEffect, useRef } from "react";
import content from "@/data/content.json";
import { mailto } from "@/lib/mailto";
import { NOMINATION_BODY, NOMINATION_SUBJECT } from "@/lib/mail-templates";
import Counter from "./Counter";

// -----------------------------------------------------------------------------
// Local editorial constants — section chrome and short timeline labels that
// don't live in content.json. Dates and category names DO come from JSON.
// -----------------------------------------------------------------------------
const AWARDS_MARK = "03";
const AWARDS_EYEBROW = "28 Nominations · Timeline · Apply";
const AWARDS_TAG = "The Awards";
const META_LABEL = "The 2026 Slate";
const META_STATS = [
  { value: "28", label: "Categories" },
  { value: "4", label: "Special · TBA" },
  { value: "30+", label: "Winners" },
  { value: "100+", label: "Nominees" },
];
const TBA_COUNT = 4;
const TBA_NAME = "To be announced";

// Pithy display labels for the 4 timeline steps. Dates come from
// content.competition_timeline[] (May 15 / Sep 15 / Sep 28 / Sep 30).
// The marketing-shortened labels are kept local so the JSON can stay legalistic.
const TIMELINE_DISPLAY_LABELS = [
  "Applications open",
  "Online voting",
  "Jury decision",
  "Awards Night",
];
// Map JSON's full label set onto its short display label.
// Index-aligned to content.competition_timeline[] order.
const TIMELINE_EYEBROW = "Competition Timeline";

const SUBMIT_LABEL = "Submit your nomination";
const SUBMIT_NOTE = "Crypto payment via processor";

const pad2 = (n: number) => (n < 10 ? "0" : "") + n;

export default function Awards() {
  const gridRef = useRef<HTMLUListElement>(null);

  // Stagger reveal — group items by their visual row (via getBoundingClientRect
  // top) so cards in the same row fade up together with a small per-column
  // offset. This survives breakpoint changes that swap col-count.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const items = Array.from(grid.children) as HTMLElement[];

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const top = Math.round(el.getBoundingClientRect().top);
          const rowMates = items.filter(
            (other) => Math.abs(Math.round(other.getBoundingClientRect().top) - top) < 4
          );
          const col = rowMates.indexOf(el);
          const delay = (col < 0 ? 0 : col) * 70;
          window.setTimeout(() => el.classList.add("is-in"), delay);
          io.unobserve(el);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const categories = content.nominations.categories;
  const timeline = content.competition_timeline;

  // The "active" pin starts at "Applications open" (today is well before the
  // event). Once we have a real deploy date and live JS, this can flip based
  // on Date.now() — for now hard-code to step 0.
  const activeStepIdx = 0;
  const finalStepIdx = timeline.length - 1;

  return (
    <section className="awards" id="awards" aria-label="Award nominations">
      <div className="awards-inner">
        {/* Section head */}
        <div className="awards-head">
          <div className="left">
            <span className="nm">{AWARDS_MARK}</span>
            <span className="eye">{AWARDS_EYEBROW}</span>
          </div>
          <div className="tag">{AWARDS_TAG}</div>
        </div>

        {/* Editorial intro */}
        <div className="awards-intro">
          <h2 className="title">
            Twenty-eight categories, four <em>special</em> seats &mdash; apply, vote, win.
          </h2>
          <div className="meta">
            <div className="label">{META_LABEL}</div>
            <div className="stats">
              {META_STATS.map((s, i) => (
                <div key={s.label} className="stat">
                  <b>
                    <Counter value={s.value} delay={i * 220} />
                  </b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Nominations grid — 28 from JSON + 4 TBA placeholders. */}
        <ul className="noms-grid" ref={gridRef}>
          {categories.map((c, i) => (
            <li key={c.slug}>
              <span className="nm">{pad2(i + 1)}</span>
              <h3 className="name">{c.name}</h3>
            </li>
          ))}
          {Array.from({ length: TBA_COUNT }).map((_, i) => (
            <li key={`tba-${i}`} className="is-tba">
              <span className="nm">{pad2(categories.length + i + 1)}</span>
              <h3 className="name">{TBA_NAME}</h3>
            </li>
          ))}
        </ul>

        {/* Competition timeline */}
        <div className="awards-timeline" aria-label="Competition timeline">
          <div className="awards-timeline-head">
            <div className="awards-timeline-eye">{TIMELINE_EYEBROW}</div>
          </div>
          <ol className="awards-timeline-track">
            {timeline.map((t, i) => {
              const cls = [
                "awards-timeline-step",
                i === activeStepIdx ? "is-active" : "",
                i === finalStepIdx ? "is-final" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={t.date_iso} className={cls}>
                  <span className="dot" aria-hidden />
                  <span className="date">{t.date_display}</span>
                  <span className="label">{TIMELINE_DISPLAY_LABELS[i] ?? t.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Submit CTA */}
        <div className="awards-submit">
          <a
            className="btn btn-primary"
            href={mailto(
              content.contacts.email,
              NOMINATION_SUBJECT,
              NOMINATION_BODY
            )}
          >
            <span className="label">
              {SUBMIT_LABEL}
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
          <div className="note">{SUBMIT_NOTE}</div>
        </div>
      </div>

      <style jsx>{`
        .awards {
          --paper-warm: #f5f1ea;
          --paper-line: rgba(0, 0, 0, 0.1);
          --paper-line-soft: rgba(0, 0, 0, 0.06);
          --paper-ink-1: #0f1219;
          --paper-ink-2: rgba(15, 18, 25, 0.66);
          --paper-ink-3: rgba(15, 18, 25, 0.44);
          background: var(--paper-warm);
          color: var(--paper-ink-1);
          padding: clamp(56px, 6vw, 96px) 0;
          position: relative;
          scroll-margin-top: 24px;
        }
        .awards-inner {
          padding: 0 clamp(28px, 4vw, 64px);
          max-width: none;
        }

        /* ---------- Section head ---------- */
        .awards-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 32px;
          border-bottom: 1px solid var(--paper-line);
          padding-bottom: 24px;
          margin-bottom: 56px;
        }
        .awards-head .left {
          display: flex;
          align-items: baseline;
          gap: 24px;
        }
        .awards-head .nm {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: var(--fs-eyebrow);
          color: var(--paper-ink-3);
          line-height: 1;
        }
        .awards-head .eye {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-ink-2);
          line-height: 1;
        }
        .awards-head .tag {
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

        /* ---------- Intro: H2 + meta stats ---------- */
        .awards-intro {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: clamp(32px, 5vw, 96px);
          /* Top-align so the H2 sits flush with the top of the right
             meta block (was bottom-aligned via align-items: end). */
          align-items: start;
          margin-bottom: clamp(48px, 6vw, 80px);
        }
        .awards-intro .title {
          grid-column: 1 / span 2;
          font-family: var(--font-inter);
          font-weight: 300;
          font-size: clamp(32px, 3.6vw, 56px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: var(--paper-ink-1);
          text-wrap: balance;
          margin: 0;
        }
        .awards-intro .title :global(em) {
          font-style: italic;
          color: var(--bwiga-blue);
          font-weight: 300;
        }
        .awards-intro .meta {
          grid-column: 3 / span 2;
          align-self: start;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .awards-intro .meta .label {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: 13px;
          color: var(--paper-ink-3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        /* 2×2 grid — guarantees an even wrap so the divider always sits
           BETWEEN the columns. Old flex-wrap recipe orphaned a left
           border on the 4th item when it dropped to a new row alone. */
        .awards-intro .meta .stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          row-gap: clamp(20px, 2vw, 28px);
        }
        .awards-intro .meta .stat {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 4px clamp(20px, 2.4vw, 44px);
        }
        /* Numbers first, dividers on the right side of the left column. */
        .awards-intro .meta .stat:nth-child(2n + 1) {
          padding-left: 0;
          border-right: 1px solid var(--paper-line);
        }
        .awards-intro .meta .stat:nth-child(2n) {
          padding-right: 0;
        }
        .awards-intro .meta .stat b {
          font-family: var(--font-inter);
          font-weight: 300;
          font-size: clamp(32px, 3vw, 48px);
          color: var(--paper-ink-1);
          letter-spacing: -0.01em;
          line-height: 1;
          font-feature-settings: "tnum";
        }
        .awards-intro .meta .stat span {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-ink-2);
        }

        /* ---------- Nominations grid ---------- */
        .noms-grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-auto-flow: column;
          grid-template-rows: repeat(8, auto);
          column-gap: clamp(24px, 2.4vw, 48px);
          row-gap: 4px;
        }
        .noms-grid li {
          display: flex;
          align-items: baseline;
          gap: 14px;
          padding: 10px 0;
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 600ms cubic-bezier(0.2, 0.7, 0.2, 1),
            transform 700ms cubic-bezier(0.2, 0.7, 0.2, 1);
          border-top: 1px solid var(--paper-line-soft);
        }
        .noms-grid li.is-in {
          opacity: 1;
          transform: translateY(0);
        }
        .noms-grid .nm {
          flex: 0 0 auto;
          min-width: 28px;
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: 12px;
          color: var(--paper-ink-3);
          letter-spacing: 0.06em;
          line-height: 1.4;
        }
        .noms-grid .name {
          flex: 1 1 auto;
          margin: 0;
          font-family: var(--font-inter);
          font-weight: 400;
          font-size: clamp(15px, 1.05vw, 17px);
          line-height: 1.35;
          color: var(--paper-ink-1);
        }
        .noms-grid li.is-tba .nm {
          color: var(--paper-ink-3);
        }
        .noms-grid li.is-tba .name {
          color: var(--paper-ink-3);
          font-style: italic;
        }

        /* ---------- Competition timeline ---------- */
        .awards-timeline {
          margin-top: clamp(64px, 8vw, 112px);
          border: 1px solid var(--paper-line);
          /* Top padding lifted ~1.5× (32→48) so the "Competition Timeline"
             eyebrow has more room above it inside the framed block. */
          padding: 48px clamp(24px, 3.5vw, 56px) 36px;
          background: rgba(255, 255, 255, 0.6);
        }
        .awards-timeline-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .awards-timeline-eye {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-ink-2);
        }
        .awards-timeline-track {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          list-style: none;
          margin: 0;
          padding: 0;
          position: relative;
        }
        .awards-timeline-track::before {
          content: "";
          position: absolute;
          top: 8px;
          left: calc(100% / 8);
          right: calc(100% / 8);
          height: 1px;
          background: var(--paper-line);
        }
        .awards-timeline-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          text-align: center;
          position: relative;
        }
        .awards-timeline-step .dot {
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background: var(--paper-warm);
          border: 2px solid var(--paper-ink-3);
          position: relative;
          z-index: 1;
        }
        .awards-timeline-step.is-active .dot {
          border-color: var(--bwiga-blue);
          background: var(--bwiga-blue);
          box-shadow: 0 0 0 4px rgba(48, 131, 198, 0.12);
        }
        /* The gold accent — single instance in this section, by design rule. */
        .awards-timeline-step.is-final .dot {
          border-color: var(--bwiga-gold);
          background: var(--bwiga-gold);
          box-shadow: 0 0 0 4px rgba(217, 178, 106, 0.18);
        }
        .awards-timeline-step .date {
          font-family: var(--font-inter);
          font-weight: 600;
          font-size: 16px;
          color: var(--paper-ink-1);
          line-height: 1;
        }
        .awards-timeline-step .label {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--paper-ink-2);
          max-width: 18ch;
          line-height: 1.4;
        }

        /* ---------- Submit row ----------
           Match the CTA-to-block gap used by People (.people-apply) and the
           other sections — bigger than the prototype's tight 28-40px. */
        .awards-submit {
          margin-top: clamp(40px, 5vw, 64px);
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .awards-submit .btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-inter);
          font-weight: 600;
          font-size: var(--fs-caption);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 14px 24px;
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
        }
        .awards-submit .btn .label {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: color 850ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .awards-submit .btn::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 100%;
          background: var(--paper-ink-1);
          transform: translateY(101%);
          transition: transform 850ms cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1;
        }
        .awards-submit .btn:hover {
          transform: scale(1.03);
        }
        .awards-submit .btn:hover::before {
          transform: translateY(0);
        }
        .awards-submit .btn:hover .label {
          color: var(--paper-0);
        }
        .awards-submit .btn:active {
          transform: scale(0.98);
        }
        .awards-submit .note {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          color: var(--paper-ink-3);
          text-transform: uppercase;
        }

        /* ---------- Responsive ---------- */
        @media (max-width: 1100px) {
          .awards-intro {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .awards-intro .title,
          .awards-intro .meta {
            grid-column: 1;
          }
          /* На tablet/«большом mobile» (≤1100) — две колонки. Раньше было
             три: длинные названия вроде «Mediabuying Agency of the year»
             в 3-кол сетке резались на 2 строки и выглядели плотно. */
          .noms-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-rows: repeat(15, auto);
          }
        }
        @media (max-width: 760px) {
          /* Истинно мобильные ширины: одна колонка, читается как
             вертикальный список. */
          .noms-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
            grid-auto-flow: row;
          }
          .awards-timeline-track {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .awards-timeline-track::before {
            display: none;
          }
          .awards-timeline-step {
            flex-direction: row;
            justify-content: flex-start;
            gap: 16px;
            text-align: left;
          }
          .awards-timeline-step .label {
            max-width: none;
          }
          .awards-timeline-head {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .awards-submit .btn {
            width: 100%;
            justify-content: center;
          }
          .awards-head {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>
    </section>
  );
}
