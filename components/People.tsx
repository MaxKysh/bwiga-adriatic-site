"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import content from "@/data/content.json";
import { mailto } from "@/lib/mailto";
import { SPEAKER_BODY, SPEAKER_SUBJECT } from "@/lib/mail-templates";

// -----------------------------------------------------------------------------
// Editorial chrome and a couple of pieces not in content.json.
// -----------------------------------------------------------------------------
const PEOPLE_MARK = "04";
const PEOPLE_EYEBROW = "Jury · Speakers";
const PEOPLE_TAG = "The People";

const VIEW_GRID = "View all grid →";
const COLLAPSE = "Collapse ↑";
const APPLY_LABEL = "Apply to speak";

// Featured slug — visually elevated card (slightly thicker ring + "Jury Chair"
// label). Stays in BWiGA blue per the page-wide gold rule (gold is reserved
// for the Sep 30 timeline dot and the Awards Ceremony schedule row only).
const FEATURED_SLUG = "alexey-nasybullin";
const FEATURED_LABEL = "Jury Chair";

type Filter = "all" | "jury" | "speaker";

type Card = {
  slug: string;
  name: string;
  role: "jury" | "speaker";
  roleLabel: string;
  title: string;
  photo: string;
  featured: boolean;
};

function buildCards(): Card[] {
  const jury: Card[] = content.speakers.jury.map((p) => ({
    slug: p.slug,
    name: p.name,
    role: "jury",
    roleLabel: p.slug === FEATURED_SLUG ? FEATURED_LABEL : "Jury",
    title: p.title,
    photo: `/speakers/jury/${p.slug}.webp`,
    featured: p.slug === FEATURED_SLUG,
  }));
  const speakers: Card[] = content.speakers.speakers.map((p) => ({
    slug: p.slug,
    name: p.name,
    role: "speaker",
    roleLabel: "Speaker",
    title: p.title,
    photo: `/speakers/speakers/${p.slug}.webp`,
    featured: false,
  }));
  return [...jury, ...speakers];
}

export default function People() {
  const all = useMemo(buildCards, []);
  const juryCount = useMemo(() => all.filter((c) => c.role === "jury").length, [all]);
  const speakerCount = useMemo(
    () => all.filter((c) => c.role === "speaker").length,
    [all]
  );

  const [filter, setFilter] = useState<Filter>("all");
  const [isGrid, setIsGrid] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const trackRef = useRef<HTMLUListElement>(null);
  const draggingRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  // ---- Arrows + scroll position bookkeeping ---------------------------------
  const updateArrows = () => {
    const t = trackRef.current;
    if (!t || isGrid) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    setCanPrev(t.scrollLeft > 2);
    setCanNext(t.scrollLeft + t.clientWidth < t.scrollWidth - 2);
  };
  useEffect(() => {
    updateArrows();
    const t = trackRef.current;
    if (!t) return;
    const onScroll = () => updateArrows();
    t.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      t.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateArrows);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGrid, filter]);

  // ---- When filter changes, jump the rail back to the start -----------------
  useEffect(() => {
    const t = trackRef.current;
    if (!t || isGrid) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollTo({ left: 0, behavior: reduced ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // ---- Arrow click handlers -------------------------------------------------
  const stepWidth = () => {
    const t = trackRef.current;
    if (!t) return 280;
    const first = t.querySelector<HTMLElement>("li:not(.is-hidden)");
    if (!first) return 280;
    const gap = parseFloat(getComputedStyle(t).columnGap || getComputedStyle(t).gap || "18");
    return first.getBoundingClientRect().width + (Number.isFinite(gap) ? gap : 18);
  };
  const goPrev = () => {
    const t = trackRef.current;
    if (!t || isGrid) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollBy({ left: -stepWidth() * 2, behavior: reduced ? "auto" : "smooth" });
  };
  const goNext = () => {
    const t = trackRef.current;
    if (!t || isGrid) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollBy({ left: stepWidth() * 2, behavior: reduced ? "auto" : "smooth" });
  };

  // ---- Drag-to-pan with pointer events --------------------------------------
  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;

    const onDown = (e: PointerEvent) => {
      if (isGrid) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      draggingRef.current = {
        active: true,
        startX: e.clientX,
        startScroll: t.scrollLeft,
        moved: false,
      };
      t.classList.add("is-dragging");
      try {
        t.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    };
    const onMove = (e: PointerEvent) => {
      const s = draggingRef.current;
      if (!s.active) return;
      const dx = e.clientX - s.startX;
      if (Math.abs(dx) > 4) s.moved = true;
      t.scrollLeft = s.startScroll - dx;
    };
    const onUp = (e: PointerEvent) => {
      const s = draggingRef.current;
      if (!s.active) return;
      s.active = false;
      t.classList.remove("is-dragging");
      try {
        t.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    };
    // Block accidental clicks after a drag.
    const onClickCapture = (e: MouseEvent) => {
      if (draggingRef.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        draggingRef.current.moved = false;
      }
    };

    t.addEventListener("pointerdown", onDown);
    t.addEventListener("pointermove", onMove);
    t.addEventListener("pointerup", onUp);
    t.addEventListener("pointercancel", onUp);
    t.addEventListener("pointerleave", onUp);
    t.addEventListener("click", onClickCapture, true);
    return () => {
      t.removeEventListener("pointerdown", onDown);
      t.removeEventListener("pointermove", onMove);
      t.removeEventListener("pointerup", onUp);
      t.removeEventListener("pointercancel", onUp);
      t.removeEventListener("pointerleave", onUp);
      t.removeEventListener("click", onClickCapture, true);
    };
  }, [isGrid]);

  // ---- FLIP transition between slider ↔ grid --------------------------------
  const handleToggleGrid = () => {
    const t = trackRef.current;
    if (!t) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(t.querySelectorAll<HTMLElement>(".pcard"));

    if (reduced) {
      setIsGrid((v) => !v);
      return;
    }

    // FIRST positions.
    const first = els.map((c) => c.getBoundingClientRect());
    // Mutate to LAST by toggling state synchronously via flushSync? React 18
    // schedules state — we can ride the next paint with rAF instead.
    setIsGrid((v) => !v);
    requestAnimationFrame(() => {
      els.forEach((c, i) => {
        const a = c.getBoundingClientRect();
        const dx = first[i].left - a.left;
        const dy = first[i].top - a.top;
        const sx = a.width ? first[i].width / a.width : 1;
        const sy = a.height ? first[i].height / a.height : 1;
        if (
          Math.abs(dx) < 0.5 &&
          Math.abs(dy) < 0.5 &&
          Math.abs(sx - 1) < 0.01 &&
          Math.abs(sy - 1) < 0.01
        )
          return;
        c.animate(
          [
            {
              transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
              opacity: 0.65,
            },
            { transform: "none", opacity: 1 },
          ],
          { duration: 540, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" }
        );
      });
    });
  };

  return (
    <section className="people" id="people" aria-label="Speakers and jury">
      <div className="people-inner">
        <div className="people-head">
          <div className="left">
            <span className="nm">{PEOPLE_MARK}</span>
            <span className="eye">{PEOPLE_EYEBROW}</span>
          </div>
          <div className="tag">{PEOPLE_TAG}</div>
        </div>

        <div className="people-controls">
          <div className="people-tabs" role="tablist" aria-label="Filter by role">
            {(
              [
                { id: "all", label: "all", count: all.length },
                { id: "jury", label: "jury", count: juryCount },
                { id: "speaker", label: "speakers", count: speakerCount },
              ] as { id: Filter; label: string; count: number }[]
            ).map((t) => (
              <button
                key={t.id}
                className={`ptab ${filter === t.id ? "is-active" : ""}`}
                type="button"
                role="tab"
                aria-selected={filter === t.id}
                onClick={() => setFilter(t.id)}
              >
                {t.label} <b>&middot; {t.count}</b>
              </button>
            ))}
          </div>

          <div className="people-actions">
            <button
              type="button"
              className={`pgrid-toggle ${isGrid ? "is-grid" : ""}`}
              aria-pressed={isGrid}
              onClick={handleToggleGrid}
            >
              <span className="label">{VIEW_GRID}</span>
              <span className="label-alt">{COLLAPSE}</span>
            </button>
            <div className="people-arrows" role="group" aria-label="Slider navigation">
              <button
                type="button"
                className="parrow"
                aria-label="Previous"
                disabled={!canPrev}
                onClick={goPrev}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M9 2L4 7L9 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="parrow"
                aria-label="Next"
                disabled={!canNext}
                onClick={goNext}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M5 2L10 7L5 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className={`people-rail ${isGrid ? "is-grid" : ""}`}>
          <ul className={`people-track ${isGrid ? "is-grid" : ""}`} ref={trackRef}>
            {all.map((c) => {
              const hidden = filter !== "all" && c.role !== filter;
              return (
                <li
                  key={c.slug}
                  className={`pcard ${hidden ? "is-hidden" : ""} ${c.featured ? "is-featured" : ""}`}
                  data-role={c.role}
                >
                  <div className="pcard-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.photo}
                      alt={c.name}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <span className="pcard-role">{c.roleLabel}</span>
                  <div className="pcard-body">
                    <h3 className="pcard-name">{c.name}</h3>
                    <p className="pcard-title">{c.title}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="people-apply">
          <a
            className="btn btn-primary"
            href={mailto(
              content.contacts.email,
              SPEAKER_SUBJECT,
              SPEAKER_BODY
            )}
          >
            <span className="label">
              {APPLY_LABEL}
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
        .people {
          position: relative;
          border-top: 1px solid var(--hairline);
          background: var(--ink-0);
          padding: clamp(56px, 6vw, 96px) 0;
          scroll-margin-top: 24px;
          overflow: hidden;
        }
        .people-inner {
          padding: 0 clamp(28px, 4vw, 64px);
          max-width: none;
        }

        /* ---------- Head ---------- */
        .people-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--hairline);
          margin-bottom: 56px;
        }
        .people-head .left {
          display: flex;
          align-items: baseline;
          gap: 24px;
        }
        .people-head .nm {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: var(--fs-eyebrow);
          color: var(--paper-2);
          line-height: 1;
        }
        .people-head .eye {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-2);
          line-height: 1;
        }
        .people-head .tag {
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

        /* ---------- Controls ---------- */
        .people-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          margin-bottom: clamp(32px, 4vw, 56px);
        }
        .people-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ptab {
          font-family: var(--font-inter);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: var(--paper-1);
          padding: 10px 20px;
          background: transparent;
          border: 1px solid var(--hairline);
          border-radius: 4px;
          cursor: pointer;
          /* Shared hover-bus props across ptab / pgrid-toggle / parrow. */
          transition: background 220ms var(--ease-soft),
            color 220ms var(--ease-soft),
            border-color 220ms var(--ease-soft),
            transform 220ms var(--ease-soft),
            box-shadow 280ms var(--ease-soft);
          font-feature-settings: "tnum";
        }
        .ptab b {
          font-weight: 600;
          color: var(--paper-0);
          margin-left: 4px;
        }
        /* Unified hover treatment — applied to all three nav-style buttons
           (tabs, grid-toggle, prev/next arrows) so the cluster reads as one
           interaction language. Slight lift + brand-blue border + a soft
           blue halo behind the button. */
        .ptab:not(.is-active):hover,
        .pgrid-toggle:not(.is-grid):hover,
        .parrow:not(:disabled):hover {
          color: var(--paper-0);
          background: rgba(48, 131, 198, 0.1);
          border-color: var(--bwiga-blue);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(48, 131, 198, 0.22);
        }
        .ptab.is-active {
          background: var(--paper-0);
          color: var(--ink-1);
          border-color: var(--paper-0);
        }
        .ptab.is-active b {
          color: var(--ink-1);
        }
        .ptab:focus-visible {
          outline: 2px solid var(--bwiga-blue);
          outline-offset: 2px;
        }

        .people-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pgrid-toggle {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--paper-0);
          padding: 12px 18px;
          background: transparent;
          border: 1px solid var(--hairline-strong);
          border-radius: 4px;
          cursor: pointer;
          transition: background 220ms var(--ease-soft),
            color 220ms var(--ease-soft),
            border-color 220ms var(--ease-soft),
            transform 220ms var(--ease-soft),
            box-shadow 280ms var(--ease-soft);
        }
        .pgrid-toggle .label-alt {
          display: none;
        }
        .pgrid-toggle.is-grid .label {
          display: none;
        }
        .pgrid-toggle.is-grid .label-alt {
          display: inline;
        }
        .pgrid-toggle:focus-visible {
          outline: 2px solid var(--bwiga-blue);
          outline-offset: 2px;
        }

        .people-arrows {
          display: flex;
          gap: 6px;
        }
        .parrow {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          background: transparent;
          border: 1px solid var(--hairline-strong);
          border-radius: 4px;
          color: var(--paper-0);
          cursor: pointer;
          transition: background 220ms var(--ease-soft),
            color 220ms var(--ease-soft),
            border-color 220ms var(--ease-soft),
            transform 220ms var(--ease-soft),
            box-shadow 280ms var(--ease-soft),
            opacity 220ms var(--ease-soft);
          padding: 0;
        }
        .parrow:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .parrow svg {
          display: block;
        }

        /* ---------- Slider rail ---------- */
        .people-rail {
          position: relative;
          /* Negative vertical margins cancel out the track's top/bottom
             padding visually — the layout flows as if the track had no
             padding, but the track still has internal room for the hover
             shadow/glow to render without being clipped. */
          margin: -48px calc(-1 * clamp(28px, 4vw, 64px)) -48px 0;
        }
        .people-rail.is-grid {
          margin: 0;
        }
        .people-track {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          gap: clamp(14px, 1.4vw, 22px);
          overflow-x: auto;
          /* CSS quirk: when overflow-x is set to anything other than visible,
             overflow-y: visible is silently treated as auto. So vertical
             content (hover-lift + drop shadow + glow) IS clipped against
             the track's box. Workaround: bake the needed vertical buffer
             into the track via padding, and pull the rail up/down with
             matching negative margins so the visual layout is unchanged. */
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -ms-overflow-style: none;
          overscroll-behavior-x: contain;
          cursor: grab;
          padding-left: 0;
          /* 48px top: hover lifts -8px, drop-shadow extends ~32px up, glow
             ~48px. Bottom matches for symmetric breathing room. */
          padding-top: 48px;
          padding-bottom: 48px;
          padding-right: clamp(40px, 6vw, 96px);
          mask-image: linear-gradient(
            90deg,
            #000 0,
            #000 calc(100% - 48px),
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            90deg,
            #000 0,
            #000 calc(100% - 48px),
            transparent 100%
          );
        }
        .people-track::-webkit-scrollbar {
          display: none;
        }
        .people-track.is-dragging {
          cursor: grabbing;
          scroll-snap-type: none;
          user-select: none;
        }

        /* ---------- Card ---------- */
        .pcard {
          flex: 0 0 auto;
          width: clamp(240px, 19vw, 300px);
          /* Slightly taller (2:3 instead of 5:7) so name → title gets more
             vertical breathing room with margin-top:auto pinning the title. */
          aspect-ratio: 2 / 3;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
          padding: 28px 22px 32px;
          border-radius: 8px;
          /* Pure top-to-bottom multi-stop linear gradient — no radial layer.
             A radial ellipse always has a defined boundary (the curve where
             its fade hits 0), which the eye picks up as a "seam" right
             around where the photo circle ends. A multi-stop linear has no
             boundary, just an even darkening from brand-blue at the top
             through to near-black at the bottom. */
          background: linear-gradient(
            180deg,
            #2c5e93 0%,
            #1f4a7a 30%,
            #133456 65%,
            #0a1a2e 100%
          );
          overflow: hidden;
          scroll-snap-align: start;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06) inset,
            0 14px 28px rgba(0, 0, 0, 0.35);
          transition: transform 350ms cubic-bezier(0.16, 1, 0.3, 1),
            background 350ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 350ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 260ms var(--ease-soft);
        }
        .pcard::before {
          content: "";
          position: absolute;
          top: -40%;
          left: -30%;
          width: 160%;
          height: 80%;
          background: linear-gradient(
            115deg,
            transparent 40%,
            rgba(255, 255, 255, 0.04) 50%,
            transparent 60%
          );
          pointer-events: none;
          transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pcard:hover {
          transform: translateY(-8px);
          background: linear-gradient(
            180deg,
            #3a72a8 0%,
            #285c92 30%,
            #163d63 65%,
            #0a1a2e 100%
          );
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.14) inset,
            0 32px 64px rgba(0, 0, 0, 0.55),
            0 0 0 1px rgba(48, 131, 198, 0.2),
            0 0 48px rgba(48, 131, 198, 0.4);
        }
        .pcard:hover::before {
          transform: translateX(30%);
        }

        /* ------------- GOLD/BRONZE THEME for jury cards --------------
           Champagne palette (--bwiga-gold = #D9B26A) scaled to match the
           luminance of the blue card recipe (≈60% / ≈15% of full brand
           hue). Equivalent visual intensity to the speaker card, just in
           warm tones — same gradient angles, same alpha, same hover lift. */
        .pcard[data-role="jury"] {
          background: linear-gradient(
            180deg,
            #a78656 0%,
            #826b40 30%,
            #4a3f25 65%,
            #211b10 100%
          );
        }
        .pcard[data-role="jury"]:hover {
          background: linear-gradient(
            180deg,
            #c19c66 0%,
            #a38650 30%,
            #5a4d2d 65%,
            #211b10 100%
          );
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.14) inset,
            0 32px 64px rgba(0, 0, 0, 0.55),
            0 0 0 1px rgba(217, 178, 106, 0.22),
            0 0 48px rgba(217, 178, 106, 0.4);
        }
        .pcard[data-role="jury"] .pcard-photo {
          background: radial-gradient(
            circle at 50% 30%,
            #4a3f2a 0%,
            #2a1f10 45%,
            #14100a 100%
          );
          box-shadow: 0 0 0 1px rgba(232, 201, 136, 0.45),
            0 0 0 3px rgba(217, 178, 106, 0.1),
            0 6px 14px rgba(0, 0, 0, 0.25);
        }
        .pcard[data-role="jury"]:hover .pcard-photo {
          box-shadow: 0 0 0 2px rgba(232, 201, 136, 1),
            0 0 0 6px rgba(217, 178, 106, 0.22),
            0 0 28px rgba(232, 201, 136, 0.55),
            0 6px 14px rgba(0, 0, 0, 0.2);
        }
        .pcard[data-role="jury"] .pcard-role {
          color: #e8c988;
          border-color: rgba(232, 201, 136, 0.3);
          background: rgba(217, 178, 106, 0.1);
        }
        .pcard[data-role="jury"] .pcard-role::before {
          background: #e8c988;
          box-shadow: 0 0 6px rgba(232, 201, 136, 0.8);
        }
        .pcard[data-role="jury"]:hover .pcard-role {
          color: #fff;
          border-color: rgba(232, 201, 136, 0.65);
          background: rgba(217, 178, 106, 0.22);
        }
        .pcard[data-role="jury"]:hover .pcard-role::before {
          box-shadow: 0 0 10px rgba(232, 201, 136, 1);
        }

        /* Portrait well */
        .pcard-photo {
          position: relative;
          /* % is relative to the .pcard's content width, so the photo
             scales with the CARD (not the viewport). This keeps the photo
             from outgrowing narrow grid-mode cards while still hitting a
             healthy size on wide slider cards. Capped at 196px on large
             screens; floors out around 100px on the narrowest layouts. */
          width: min(56%, 196px);
          min-width: 100px;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          overflow: hidden;
          background: radial-gradient(circle at 50% 30%, #3d4a78 0%, #1e2542 45%, #0c1124 100%);
          box-shadow: 0 0 0 1px rgba(79, 161, 220, 0.45),
            0 0 0 3px rgba(48, 131, 198, 0.1),
            0 6px 14px rgba(0, 0, 0, 0.25);
          transition: box-shadow 400ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
          flex: 0 0 auto;
        }
        .pcard:hover .pcard-photo {
          transform: scale(1.06);
          box-shadow: 0 0 0 2px rgba(79, 161, 220, 1),
            0 0 0 6px rgba(48, 131, 198, 0.22),
            0 0 28px rgba(79, 161, 220, 0.55),
            0 6px 14px rgba(0, 0, 0, 0.2);
        }
        .pcard-photo :global(img) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pcard:hover .pcard-photo :global(img) {
          transform: scale(1.06);
        }

        /* Role chip */
        .pcard-role {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: var(--font-inter);
          font-weight: 600;
          font-size: 10.5px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.62);
          padding: 5px 12px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 999px;
          background: rgba(48, 131, 198, 0.1);
          transition: color 350ms, border-color 350ms, background 350ms;
        }
        .pcard-role::before {
          content: "";
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--bwiga-blue-bright);
          box-shadow: 0 0 6px rgba(79, 161, 220, 0.8);
          transition: box-shadow 350ms;
        }
        .pcard:hover .pcard-role {
          color: var(--paper-0);
          border-color: rgba(79, 161, 220, 0.65);
          background: rgba(48, 131, 198, 0.22);
        }
        .pcard:hover .pcard-role::before {
          box-shadow: 0 0 10px rgba(79, 161, 220, 1);
        }

        /* Body — fills the rest of the card so margin-top:auto on the title
           glues it to the card's bottom. Name sits at the top of the body. */
        .pcard-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
          flex: 1 1 auto;
          width: 100%;
          margin-top: 8px;
        }
        .pcard-name {
          font-family: var(--font-inter);
          font-weight: 300;
          font-size: 24px;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: var(--paper-0);
          margin: 0;
          text-wrap: balance;
        }
        .pcard-title {
          font-family: var(--font-inter);
          font-size: 13.5px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.78);
          max-width: 26ch;
          margin: 0;
          margin-top: auto;
          text-wrap: pretty;
          /* Hard cap at two lines — ellipsis if content overflows. Keeps
             card heights aligned regardless of how long a JSON title is. */
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Hidden by filter */
        .pcard.is-hidden {
          opacity: 0;
          transform: translateY(8px) scale(0.96);
          pointer-events: none;
          width: 0 !important;
          margin-right: calc(-1 * clamp(14px, 1.4vw, 22px));
          padding-left: 0;
          padding-right: 0;
        }

        /* Grid mode */
        .people-track.is-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: clamp(14px, 1.4vw, 22px);
          overflow: visible;
          scroll-snap-type: none;
          padding-right: 0;
          mask-image: none;
          -webkit-mask-image: none;
          cursor: default;
        }
        /* Grid mode — let card fill its cell (uniform gutters) but drop the
           strict 2/3 aspect-ratio so wide cards on 4K don't stretch to a
           huge vertical card with a giant empty band under the body title.
           A min-height keeps the layout consistent for shorter titles. */
        .people-track.is-grid .pcard {
          width: auto;
          aspect-ratio: auto;
          min-height: 400px;
        }

        /* Apply CTA — reuses the same primary button recipe as Hero/Awards. */
        .people-apply {
          margin-top: clamp(40px, 5vw, 64px);
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-wrap: wrap;
          gap: 16px;
        }
        .people-apply .btn {
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
        .people-apply .btn .label {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: color 850ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .people-apply .btn::before {
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
        .people-apply .btn:hover {
          transform: scale(1.03);
        }
        .people-apply .btn:hover::before {
          transform: translateY(0);
        }
        .people-apply .btn:hover .label {
          color: var(--bwiga-blue);
        }
        .people-apply .btn:active {
          transform: scale(0.98);
        }

        /* Responsive */
        @media (max-width: 1280px) {
          /* 4 cols on narrow laptops — 5 was too tight (clipped titles),
             3 was too sparse. */
          .people-track.is-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .pcard {
            width: clamp(210px, 23vw, 260px);
          }
        }
        @media (max-width: 1100px) {
          .people-track.is-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .pcard {
            width: clamp(200px, 30vw, 260px);
          }
        }
        @media (max-width: 720px) {
          .people-controls {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          .people-actions {
            justify-content: space-between;
          }
          .people-head {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
          .people-track.is-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .pcard {
            width: clamp(180px, 60vw, 280px);
          }
          .people-apply .btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pcard,
          .pcard-photo,
          .pcard-photo :global(img),
          .pgrid-toggle,
          .parrow,
          .ptab,
          .people-track,
          .pcard.is-hidden {
            transition: none !important;
          }
          .pcard:hover {
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
