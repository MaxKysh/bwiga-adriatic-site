"use client";

import Counter from "./Counter";

// "By the numbers" panel — sits between Hero and Story. Brand-blue surface,
// the bookend rhyme to the Footer (page opens and closes on the same
// brand-blue note). The big numerals replace the inline stat-row that used
// to live in Hero; meta sublines are editorial and live as constants below.

const STATS_EYEBROW = "By the numbers · Adriatic 2026";

const STATS = [
  {
    num: "30",
    label: "Nominations",
    meta: (
      <>
        <b>
          <Counter value="28" />
        </b>{" "}
        categories ·{" "}
        <b>
          <Counter value="4" />
        </b>{" "}
        special
      </>
    ),
  },
  {
    num: "30",
    label: "Countries",
    meta: <>Balkans · EU · CIS</>,
  },
  {
    num: "30",
    label: "Speakers",
    meta: <>Founders, investors &amp; regulators</>,
  },
  {
    num: "100",
    sup: "+",
    label: "Companies",
    meta: <>Web3 · iGaming · AI</>,
  },
];

export default function StatsPanel() {
  return (
    <section className="stats-panel" id="numbers" aria-label="By the numbers">
      <div className="stats-panel-inner">
        <div className="head">
          <div className="eye">{STATS_EYEBROW}</div>
        </div>

        <div className="grid">
          {STATS.map((s, i) => (
            <div key={i} className="c">
              <div className="num">
                <Counter value={s.num} delay={i * 220} />
                {s.sup ? <sup>{s.sup}</sup> : null}
              </div>
              <div className="lbl">{s.label}</div>
              <div className="meta">{s.meta}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .stats-panel {
          position: relative;
          padding: 0;
          background: var(--ink-0);
        }
        /* Brand-blue surface, less intense than the original prototype:
           starts at the brand hex and sinks to a deep blue-ink in the
           bottom-right. No white highlight, no "shiny ticket" feel —
           matches the Footer treatment so the page opens and closes on
           the same brand-blue note. */
        .stats-panel-inner {
          position: relative;
          margin: 0;
          padding: clamp(28px, 3vw, 48px) clamp(28px, 4vw, 64px)
            clamp(32px, 3.4vw, 56px);
          color: var(--paper-0);
          background: radial-gradient(
              ellipse 90% 90% at 100% 100%,
              rgba(5, 15, 30, 0.55),
              transparent 70%
            ),
            linear-gradient(160deg, #3083c6 0%, #1e5f95 50%, #0f3d66 100%);
          isolation: isolate;
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.35),
            0 32px 56px rgba(5, 7, 13, 0.45);
        }
        /* Paper-grain noise — same micro-dots as the footer so both blue
           panels feel like the same material. */
        .stats-panel-inner::before {
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
        }

        /* Head — dashed white hairline, matches the Footer head divider. */
        .head {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 24px;
          margin-bottom: clamp(20px, 2vw, 32px);
          padding-bottom: 14px;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.32);
        }
        .eye {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.78);
        }

        /* 4-cell grid. minmax(0, 1fr) — без auto-min cell не пытается
           расширяться под широкое содержимое (100+ в 4-й колонке), все
           ячейки гарантированно равной ширины. */
        .grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        .c {
          position: relative;
          padding: 12px clamp(16px, 1.6vw, 28px) 8px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* inline-flex + baseline + nowrap — раньше Counter (inline-block,
           vertical-align: baseline) и sup (vertical-align: top) жили на одной
           inline-строке, и в узких ячейках sup переносился на новую строку
           → весь блок .num становился двустрочным, толкая .lbl и .meta вниз
           к концу ячейки. С inline-flex дети сидят на одной flex-линии,
           nowrap страхует от внутреннего wrap'а. */
        .num {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
          white-space: nowrap;
          font-family: var(--font-inter);
          font-weight: 300;
          /* Monumental numeral — matches the design's fs-display-2 clamp. */
          font-size: clamp(56px, 9vw, 128px);
          line-height: 0.92;
          letter-spacing: -0.02em;
          color: var(--paper-0);
          font-feature-settings: "tnum";
          text-shadow: 0 1px 0 rgba(0, 0, 0, 0.18);
        }
        .num sup {
          font-size: 0.36em;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.78);
          line-height: 1;
          /* В inline-flex baseline-row sup опускается на baseline вместе с
             числом. align-self: flex-start поднимает его к верху строки —
             визуально как настоящий superscript. */
          align-self: flex-start;
          margin-top: 0.18em;
        }
        .lbl {
          font-family: var(--font-inter);
          font-weight: 600;
          font-size: var(--fs-eyebrow);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-0);
        }
        .meta {
          font-family: var(--font-inter);
          font-size: 18px;
          line-height: 1.45;
          color: rgba(255, 255, 255, 0.82);
        }
        .meta :global(b) {
          color: var(--paper-0);
          font-weight: 600;
        }

        /* Responsive */
        @media (max-width: 1023px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
            row-gap: 32px;
          }
        }
        @media (max-width: 540px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
