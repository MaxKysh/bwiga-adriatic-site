"use client";

import content from "@/data/content.json";
import { mailto } from "@/lib/mailto";
import { PARTNER_BODY, PARTNER_SUBJECT } from "@/lib/mail-templates";

// -----------------------------------------------------------------------------
// Section chrome. The tag deliberately echoes a different vocabulary from the
// other sections — "Together" rather than "The Partners" — to match the
// designer's intent of framing the wall as a shared roster, not a buy list.
// -----------------------------------------------------------------------------
const PARTNERS_MARK = "07";
const PARTNERS_EYEBROW = "Partners · Media";
const PARTNERS_TAG = "Together";
const PARTNERS_TITLE_PREFIX = "Brands that ";
const PARTNERS_TITLE_ACCENT = "back";
const PARTNERS_TITLE_SUFFIX = " the night.";
const PARTNERS_META =
  "The companies and outlets standing behind BWiGA — sponsors of the awards, partners on the program, and the publications carrying the story across Web3 and iGaming.";

const GROUP_MAIN_EYE = "Partners";
const GROUP_MEDIA_EYE = "Media Partners";
const BECOME_PARTNER_CTA = "Become a partner";

const pad2 = (n: number) => String(n).padStart(2, "0");

// Map content.json's "assets/partners/foo.webp" onto the in-public copy.
function toPublic(src: string): string {
  return "/" + src.replace(/^assets\//, "");
}

// Slugs whose logo file is a 0-byte placeholder in the source repo. Drop them
// at render time so the grid doesn't show an empty slot with broken-image alt
// text. When the missing file is supplied, remove the slug here.
const KNOWN_MISSING_LOGOS = new Set<string>();

// Logos that ship as dark-ink-on-transparent — invisible on the dark tile.
// We grayscale-invert them at rest so they read as light silhouettes; on hover
// the filter is removed and they return to their native artwork on the white
// tile. Add slugs here as new dark logos arrive.
const INVERT_LOGOS = new Set<string>([
  // Partners
  "it-com-domains",
  "infi-multichain",
  "chipsa",
  "brofist",
  "lenkep",
  "grow-bank",
  "titan",
  "cycle",
  "icoda",
  "mmpro-group",
  "gordon",
  "kripto-dnevnik",
  // Media partners
  "coin-gabbar",
  "bitcoinist",
  "newsbtc",
  "metattalks",
  "igaming-news",
  "the-news-crypto",
  "amb-crypto",
  "museigen",
  "crypto-12",
  "cpa-club",
  "vizi",
]);

type Tile = { name: string; slug: string; logo: string; url?: string };

function buildTiles(list: typeof content.partners.list): Tile[] {
  return list
    .filter((p) => !KNOWN_MISSING_LOGOS.has(p.slug))
    .map((p) => ({
      name: p.name,
      slug: p.slug,
      logo: toPublic(p.logo_local),
      url: p.url,
    }));
}

export default function Partners() {
  const partners = buildTiles(content.partners.list);
  const media = buildTiles(content.media_partners.list);

  return (
    <section className="partners" id="partners" aria-label="Partners and media partners">
      <div className="partners-inner">
        {/* ---- Section head ---- */}
        <div className="partners-head">
          <div className="left">
            <span className="nm">{PARTNERS_MARK}</span>
            <span className="eye">{PARTNERS_EYEBROW}</span>
          </div>
          <div className="tag">{PARTNERS_TAG}</div>
        </div>

        {/* ---- Intro (parity with awards-intro / story-intro) ---- */}
        <div className="partners-intro">
          <h2 className="title">
            {PARTNERS_TITLE_PREFIX}
            <em>{PARTNERS_TITLE_ACCENT}</em>
            {PARTNERS_TITLE_SUFFIX}
          </h2>
          <p className="meta">{PARTNERS_META}</p>
        </div>

        {/* ---- Group 1: Main partners ---- */}
        <div className="partners-group">
          <div className="partners-group-head">
            <span className="eye">{GROUP_MAIN_EYE}</span>
            <span className="ct">{pad2(partners.length)}</span>
          </div>
          <ul className="partners-grid">
            {partners.map((tile) => (
              <li key={tile.slug}>
                <a
                  className="partners-tile"
                  data-invert={INVERT_LOGOS.has(tile.slug) ? "true" : undefined}
                  href={tile.url ?? "#"}
                  target={tile.url ? "_blank" : undefined}
                  rel={tile.url ? "noopener noreferrer" : undefined}
                  aria-label={tile.url ? `${tile.name} — opens in a new tab` : tile.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="logo"
                    src={tile.logo}
                    alt={tile.name}
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- Group 2: Media partners ---- */}
        <div className="partners-group">
          <div className="partners-group-head">
            <span className="eye">{GROUP_MEDIA_EYE}</span>
            <span className="ct">{pad2(media.length)}</span>
          </div>
          <ul className="partners-grid is-media">
            {media.map((tile) => (
              <li key={tile.slug}>
                <a
                  className="partners-tile"
                  data-invert={INVERT_LOGOS.has(tile.slug) ? "true" : undefined}
                  href={tile.url ?? "#"}
                  target={tile.url ? "_blank" : undefined}
                  rel={tile.url ? "noopener noreferrer" : undefined}
                  aria-label={tile.url ? `${tile.name} — opens in a new tab` : tile.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="logo"
                    src={tile.logo}
                    alt={tile.name}
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- CTA, bottom-left ---- */}
        <div className="partners-cta">
          <a
            className="partners-btn"
            href={mailto(
              content.contacts.email,
              PARTNER_SUBJECT,
              PARTNER_BODY
            )}
          >
            <span className="partners-btn-label">
              {BECOME_PARTNER_CTA}
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
      </div>

      <style jsx>{`
        .partners {
          position: relative;
          border-top: 1px solid var(--hairline);
          background: var(--ink-0);
          padding: clamp(56px, 6vw, 96px) 0;
          scroll-margin-top: 24px;
        }
        .partners-inner {
          padding: 0 clamp(28px, 4vw, 64px);
          max-width: none;
        }

        /* -------- Section head -------- */
        .partners-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--hairline);
          margin-bottom: 56px;
        }
        .partners-head .left {
          display: flex;
          align-items: baseline;
          gap: 24px;
        }
        .partners-head .nm {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: var(--fs-eyebrow);
          color: var(--paper-2);
          line-height: 1;
        }
        .partners-head .eye {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-2);
          line-height: 1;
        }
        .partners-head .tag {
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

        /* -------- Intro — same proportions as story-intro / place-intro
           (1.1fr / 1fr) so the section reads as part of the same family. */
        .partners-intro {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: clamp(40px, 6vw, 96px);
          align-items: end;
          margin-bottom: clamp(48px, 6vw, 80px);
        }
        .partners-intro .title {
          font-family: var(--font-inter);
          font-weight: 300;
          font-size: clamp(38px, 4.6vw, 68px);
          line-height: 1.02;
          letter-spacing: -0.01em;
          color: var(--paper-0);
          text-wrap: balance;
          margin: 0;
        }
        .partners-intro .title :global(em) {
          color: var(--bwiga-blue);
          font-style: italic;
          font-weight: 300;
        }
        .partners-intro .meta {
          font-family: var(--font-inter);
          font-size: 18px;
          line-height: 1.55;
          color: var(--paper-1);
          margin: 0;
        }

        /* -------- Group sub-head -------- */
        .partners-group + .partners-group {
          margin-top: clamp(48px, 5vw, 80px);
        }
        .partners-group-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--hairline);
          margin-bottom: clamp(20px, 2vw, 32px);
        }
        .partners-group-head .eye {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-0);
          line-height: 1;
        }
        .partners-group-head .ct {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: var(--fs-eyebrow);
          color: var(--paper-2);
          letter-spacing: 0.04em;
          font-feature-settings: "tnum";
        }

        /* -------- Logo tile grid --------
           8 columns on desktop with the same gap rhythm as the People
           speaker slider (clamp 14-22px). Smaller tiles, more density,
           the wall reads as a roster rather than five oversized logos. */
        .partners-grid,
        .partners-grid.is-media {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(8, minmax(0, 1fr));
          gap: clamp(14px, 1.4vw, 22px);
        }

        /* Tile — dark grey on the dark page so the wall reads as a quiet
           roster, not a row of bright stickers. Logos arrive as black-on-
           transparent / colour-on-transparent assets, so we silhouette them
           to white at rest (brightness 0 + invert 1) and let the full
           colour flood back on hover. Effective on any source logo. */
        .partners-tile {
          position: relative;
          display: grid;
          place-items: center;
          aspect-ratio: 1 / 1;
          padding: clamp(10px, 1.1vw, 18px);
          box-sizing: border-box;
          background: linear-gradient(180deg, #1c2030 0%, #131722 100%);
          border-radius: 6px;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset,
            0 4px 10px rgba(0, 0, 0, 0.45);
          text-decoration: none;
          transition: background 250ms var(--ease-soft),
            box-shadow 250ms var(--ease-soft), transform 250ms var(--ease-soft);
        }
        .partners-tile:hover {
          /* Pure white on hover — gives every logo (black, white, or full
             colour) a neutral surface so the original artwork reads cleanly. */
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset,
            0 12px 28px rgba(0, 0, 0, 0.55);
        }
        .partners-tile:focus-visible {
          outline: 2px solid var(--bwiga-blue);
          outline-offset: 2px;
        }
        .partners-tile :global(img.logo) {
          max-width: 78%;
          max-height: 60%;
          width: auto;
          height: auto;
          object-fit: contain;
          /* Black-and-white at rest, full colour on hover. No opacity dimming
             (it killed flat-colour logos that ship with a built-in dark fill).
             Slight contrast bump compensates for the desaturation. */
          filter: grayscale(1) contrast(1.05);
          transition: filter 300ms var(--ease-soft),
            transform 300ms var(--ease-soft);
        }
        /* Dark-on-transparent artwork — silhouette to light at rest so the
           wordmark/icon reads on the dark tile. Removed on hover (white tile
           lets the native dark logo show as intended). */
        .partners-tile[data-invert] :global(img.logo) {
          filter: grayscale(1) invert(1) contrast(1.05);
        }
        .partners-tile:hover :global(img.logo) {
          filter: none;
          transform: scale(1.04);
        }

        /* -------- CTA -------- */
        .partners-cta {
          margin-top: clamp(48px, 6vw, 80px);
          display: flex;
          justify-content: flex-start;
        }
        .partners-btn {
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
        .partners-btn-label {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: color 850ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .partners-btn::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 100%;
          background: var(--paper-0);
          transform: translateY(101%);
          transition: transform 850ms cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1;
        }
        .partners-btn:hover {
          transform: scale(1.03);
        }
        .partners-btn:hover::before {
          transform: translateY(0);
        }
        .partners-btn:hover .partners-btn-label {
          color: var(--bwiga-blue);
        }
        .partners-btn:active {
          transform: scale(0.98);
        }

        /* -------- Responsive -------- */
        @media (max-width: 1280px) {
          .partners-grid,
          .partners-grid.is-media {
            grid-template-columns: repeat(6, minmax(0, 1fr));
          }
        }
        @media (max-width: 900px) {
          .partners-grid,
          .partners-grid.is-media {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .partners-intro {
            grid-template-columns: 1fr;
            gap: 24px;
            align-items: start;
          }
          .partners-head {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
        @media (max-width: 480px) {
          .partners-grid,
          .partners-grid.is-media {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .partners-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .partners-tile,
          .partners-tile :global(img.logo) {
            transition: none;
          }
          .partners-tile:hover {
            transform: none;
          }
          .partners-tile:hover :global(img.logo) {
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
