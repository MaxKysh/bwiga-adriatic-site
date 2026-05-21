"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import content from "@/data/content.json";

// -----------------------------------------------------------------------------
// Section chrome (matches Story / Awards / People / Day pattern) + 4 photos.
// -----------------------------------------------------------------------------
const PLACE_MARK = "06";
const PLACE_EYEBROW = "Venue · Location";
const PLACE_TAG = "The Place";
const PLACE_HEADING = "Where the night happens.";
const GALLERY_EYEBROW = "Avala Hotel · Budva, Montenegro";

const PHOTOS = [
  "/place-photos/Place1.jpg",
  "/place-photos/Place2.jpg",
  "/place-photos/Place3.jpg",
  "/place-photos/Place4.jpg",
];

const AUTO_MS = 5500;
const TRANSITION_MS = 800;

export default function Place() {
  const venue = content.event.venue;
  const description = venue.description;

  const [idx, setIdx] = useState(0);
  const [leavingIdx, setLeavingIdx] = useState<number | null>(null);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [paused, setPaused] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const go = (next: number, direction: "next" | "prev") => {
    if (next === idx) return;
    setLeavingIdx(idx);
    setDir(direction);
    setIdx(next);
    window.setTimeout(() => setLeavingIdx(null), TRANSITION_MS);
  };
  const goNext = () =>
    go((idx + 1) % PHOTOS.length, "next");
  const goPrev = () =>
    go((idx - 1 + PHOTOS.length) % PHOTOS.length, "prev");

  // Auto-advance.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mql.matches) return;
    }
    if (paused) return;
    const t = window.setTimeout(() => goNext(), AUTO_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, paused]);

  // Pause auto-advance while the stage is off-screen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => setPaused(!e.isIntersecting));
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Restart the progress bar on every slide change.
  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    el.classList.remove("is-running");
    void el.offsetWidth;
    if (!paused) el.classList.add("is-running");
  }, [idx, paused]);

  // Scroll only the thumb strip — page stays put.
  useEffect(() => {
    const wrap = thumbsRef.current;
    if (!wrap) return;
    const active = wrap.querySelector<HTMLButtonElement>(".gthumb.is-active");
    if (!active) return;
    const target = active.offsetLeft - (wrap.clientWidth - active.clientWidth) / 2;
    const max = wrap.scrollWidth - wrap.clientWidth;
    wrap.scrollTo({ left: Math.max(0, Math.min(max, target)), behavior: "smooth" });
  }, [idx]);

  const counter = useMemo(
    () => ({
      n: String(idx + 1).padStart(2, "0"),
      total: String(PHOTOS.length).padStart(2, "0"),
    }),
    [idx]
  );

  return (
    <section className="place" id="place" aria-label="Location and venue">
      {/* ---- Section head (matches Story / Awards / People / Day) ---- */}
      <div className="place-inner">
        <div className="place-head">
          <div className="left">
            <span className="nm">{PLACE_MARK}</span>
            <span className="eye">{PLACE_EYEBROW}</span>
          </div>
          <div className="tag">{PLACE_TAG}</div>
        </div>

        {/* ---- Intro (mirrors story-intro layout) ---- */}
        <div className="place-intro">
          <h2 className="place-heading">{PLACE_HEADING}</h2>
          <div className="place-body-col">
            <p className="place-body">{description}</p>
            <div className="place-ctas">
              <a
                className="place-cta place-cta--primary"
                href={venue.link_maps}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="place-cta-label">
                  Open in Maps
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M4 10L10 4 M5 4H10V9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="square"
                    />
                  </svg>
                </span>
              </a>
              <a
                className="place-cta place-cta--ghost"
                href={venue.link_website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="place-cta-label">
                  Hotel website
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M4 10L10 4 M5 4H10V9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="square"
                    />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Photo gallery (full-bleed, same recipe as Story gallery) ---- */}
      <div className="place-gallery">
        <div className="place-gallery-head">
          <div className="eye">{GALLERY_EYEBROW}</div>
          <div className="meta">
            <b>{counter.n}</b>
            <span>/ {counter.total}</span>
          </div>
        </div>

        <div
          className="place-stage"
          ref={stageRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {PHOTOS.map((src, i) => {
            const cls = [
              "gslide",
              i === idx ? "is-active" : "",
              i === leavingIdx ? "is-leaving" : "",
              i === idx && dir === "prev" ? "dir-prev" : "",
              i === leavingIdx && dir === "prev" ? "dir-prev" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div key={src} className={cls} aria-hidden={i !== idx}>
                <div className="gblinds">
                  {[0, 1, 2, 3, 4].map((b) => (
                    <div key={b} className="gblind">
                      <div className="gimg" style={{ backgroundImage: `url(${src})` }} />
                      <div className="gshutter" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="gallery-arrows">
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => {
                goPrev();
                setPaused(false);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => {
                goNext();
                setPaused(false);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M9 6 15 12 9 18" />
              </svg>
            </button>
          </div>

          <div className="g-progress" ref={progressRef} aria-hidden>
            <span />
          </div>
        </div>

        <div className="gallery-thumbs" ref={thumbsRef}>
          {PHOTOS.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`gthumb ${i === idx ? "is-active" : ""}`}
              style={{ backgroundImage: `url(${src})` }}
              aria-label={`Photo ${i + 1} of ${PHOTOS.length}`}
              onClick={() => go(i, i > idx ? "next" : "prev")}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .place {
          position: relative;
          border-top: 1px solid var(--hairline);
          background: var(--ink-0);
          padding: clamp(56px, 6vw, 96px) 0;
          scroll-margin-top: 24px;
        }
        .place-inner {
          padding: 0 clamp(28px, 4vw, 64px);
          max-width: none;
        }

        /* -------- Section head (parity with story-head / awards-head) -------- */
        .place-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--hairline);
          margin-bottom: 56px;
        }
        .place-head .left {
          display: flex;
          align-items: baseline;
          gap: 24px;
        }
        .place-head .nm {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: var(--fs-eyebrow);
          color: var(--paper-2);
          line-height: 1;
        }
        .place-head .eye {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-2);
          line-height: 1;
        }
        .place-head .tag {
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

        /* -------- Intro (parity with story-intro: 2-col on desktop) -------- */
        .place-intro {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: clamp(40px, 6vw, 96px);
          margin-bottom: clamp(48px, 6vw, 80px);
          align-items: start;
        }
        .place-heading {
          font-family: var(--font-inter);
          font-weight: 300;
          font-size: clamp(38px, 4.6vw, 68px);
          line-height: 1.02;
          letter-spacing: -0.01em;
          color: var(--paper-0);
          text-wrap: balance;
          margin: 0;
        }
        .place-body-col {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .place-body {
          margin: 0;
          font-family: var(--font-inter);
          font-size: 18px;
          line-height: 1.6;
          color: var(--paper-1);
          text-wrap: pretty;
        }
        .place-ctas {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        /* CTAs follow the same two-button vocabulary as Hero / Awards / People:
           one primary blue with a wipe, one frosted ghost. */
        .place-cta {
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
          border: 1px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          color: var(--paper-0);
          isolation: isolate;
          overflow: hidden;
          transform: scale(1);
          transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1),
            background 220ms ease, color 220ms ease;
          text-decoration: none;
        }
        .place-cta-label {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: color 850ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .place-cta--primary {
          background: linear-gradient(
            180deg,
            var(--bwiga-blue-bright) 0%,
            var(--bwiga-blue-deep) 100%
          );
        }
        .place-cta--primary::before {
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
        .place-cta--primary:hover {
          transform: scale(1.03);
        }
        .place-cta--primary:hover::before {
          transform: translateY(0);
        }
        .place-cta--primary:hover .place-cta-label {
          color: var(--bwiga-blue);
        }
        .place-cta--primary:active {
          transform: scale(0.98);
        }
        .place-cta--ghost {
          /* Flat translucent fill — was blur(22px) saturate(1.4), too
             expensive at 4K. */
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.32);
        }
        .place-cta--ghost:hover {
          transform: scale(1.02);
          background: var(--paper-0);
          color: var(--bwiga-blue);
        }
        .place-cta--ghost:hover .place-cta-label {
          color: var(--bwiga-blue);
        }
        .place-cta--ghost:active {
          transform: scale(0.98);
        }

        /* -------- Gallery block (full-bleed, like story's .gallery) -------- */
        .place-gallery {
          /* sits flush with the section's left/right edges */
        }
        .place-gallery-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 32px;
          padding: 0 clamp(28px, 4vw, 64px);
          /* Sits flush above the stage — no hairline, no margin. */
          margin-bottom: 16px;
        }
        .place-gallery-head .eye {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-2);
          line-height: 1;
        }
        .place-gallery-head .meta {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: var(--fs-eyebrow);
          color: var(--paper-2);
          line-height: 1;
        }
        .place-gallery-head .meta b {
          font-family: var(--font-inter);
          font-weight: 600;
          color: var(--paper-0);
          font-size: var(--fs-h5);
          line-height: 1;
          min-width: 1.5ch;
          text-align: right;
          font-feature-settings: "tnum";
        }

        /* -------- Photo stage (same recipe as Story gallery stage) -------- */
        .place-stage {
          --blind-each: 700ms;
          --ease-expo: cubic-bezier(0.86, 0, 0.07, 1);
          position: relative;
          width: 100%;
          height: 80vh;
          min-height: 480px;
          max-height: 920px;
          background: var(--ink-1);
          overflow: hidden;
          outline: none;
        }
        .place-stage :global(.gslide) {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          z-index: 0;
          transition: opacity 0.32s ease-in;
        }
        .place-stage :global(.gslide.is-active) {
          opacity: 1;
          pointer-events: auto;
          z-index: 2;
          transition: opacity 0s;
        }
        .place-stage :global(.gslide.is-leaving) {
          opacity: 0;
          z-index: 1;
        }
        .place-stage :global(.gblinds) {
          position: absolute;
          inset: 0;
          display: flex;
        }
        .place-stage :global(.gblind) {
          flex: 1;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        .place-stage :global(.gblind .gimg) {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 500%;
          background-size: cover;
          /* Venue / architectural shots — anchor vertically to the centre
             so the photo's mid-line stays in frame on tall viewports. The
             Story gallery uses center-top instead (faces shouldn't crop). */
          background-position: center center;
          will-change: transform;
        }
        .place-stage :global(.gblind:nth-child(1) .gimg) {
          transform: translateX(0%);
        }
        .place-stage :global(.gblind:nth-child(2) .gimg) {
          transform: translateX(-20%);
        }
        .place-stage :global(.gblind:nth-child(3) .gimg) {
          transform: translateX(-40%);
        }
        .place-stage :global(.gblind:nth-child(4) .gimg) {
          transform: translateX(-60%);
        }
        .place-stage :global(.gblind:nth-child(5) .gimg) {
          transform: translateX(-80%);
        }
        .place-stage :global(.gblind .gshutter) {
          position: absolute;
          inset: 0;
          background: var(--ink-1);
          clip-path: inset(0 0 0 0);
          transition: clip-path var(--blind-each) var(--ease-expo);
        }
        .place-stage :global(.gslide.is-active .gblind .gshutter) {
          clip-path: inset(100% 0 0 0);
        }
        .place-stage :global(.gslide.is-active .gblind:nth-child(1) .gshutter) {
          transition-delay: 0ms;
        }
        .place-stage :global(.gslide.is-active .gblind:nth-child(2) .gshutter) {
          transition-delay: 80ms;
        }
        .place-stage :global(.gslide.is-active .gblind:nth-child(3) .gshutter) {
          transition-delay: 160ms;
        }
        .place-stage :global(.gslide.is-active .gblind:nth-child(4) .gshutter) {
          transition-delay: 240ms;
        }
        .place-stage :global(.gslide.is-active .gblind:nth-child(5) .gshutter) {
          transition-delay: 320ms;
        }
        .place-stage :global(.gslide.is-leaving .gblind .gshutter) {
          clip-path: inset(100% 0 0 0);
          transition: none;
        }
        .place-stage :global(.gslide.is-active.dir-prev .gblind:nth-child(5) .gshutter) {
          transition-delay: 0ms;
        }
        .place-stage :global(.gslide.is-active.dir-prev .gblind:nth-child(4) .gshutter) {
          transition-delay: 80ms;
        }
        .place-stage :global(.gslide.is-active.dir-prev .gblind:nth-child(3) .gshutter) {
          transition-delay: 160ms;
        }
        .place-stage :global(.gslide.is-active.dir-prev .gblind:nth-child(2) .gshutter) {
          transition-delay: 240ms;
        }
        .place-stage :global(.gslide.is-active.dir-prev .gblind:nth-child(1) .gshutter) {
          transition-delay: 320ms;
        }

        /* Arrows + progress (same as Story) */
        .gallery-arrows {
          position: absolute;
          top: 50%;
          left: clamp(16px, 2vw, 24px);
          right: clamp(16px, 2vw, 24px);
          transform: translateY(-50%);
          z-index: 4;
          display: flex;
          justify-content: space-between;
          pointer-events: none;
        }
        .gallery-arrows button {
          pointer-events: auto;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(5, 7, 13, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: var(--paper-0);
          cursor: pointer;
          display: grid;
          place-items: center;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: background 200ms var(--ease-soft),
            border-color 200ms var(--ease-soft), transform 200ms var(--ease-soft);
          padding: 0;
        }
        .gallery-arrows button:hover {
          background: var(--bwiga-blue);
          border-color: var(--bwiga-blue);
        }
        .gallery-arrows svg {
          width: 18px;
          height: 18px;
          stroke: currentColor;
          stroke-width: 1.6;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .g-progress {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          background: rgba(255, 255, 255, 0.14);
          z-index: 4;
          pointer-events: none;
          overflow: hidden;
        }
        .g-progress :global(span) {
          display: block;
          height: 100%;
          width: 100%;
          background: var(--bwiga-blue);
          transform: scaleX(0);
          transform-origin: 0 50%;
          will-change: transform;
        }
        .g-progress.is-running :global(span) {
          transform: scaleX(1);
          transition: transform ${AUTO_MS}ms linear;
        }

        /* Thumbs (same as Story) */
        .gallery-thumbs {
          display: flex;
          gap: 6px;
          padding: 6px clamp(24px, 4vw, 56px) 0;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none;
          -ms-overflow-style: none;
          scroll-padding-inline: clamp(24px, 4vw, 56px);
          overscroll-behavior-inline: contain;
        }
        .gallery-thumbs::-webkit-scrollbar {
          display: none;
        }
        .gallery-thumbs :global(.gthumb) {
          position: relative;
          flex: 0 0 116px;
          height: 62px;
          background-color: var(--ink-1);
          background-size: cover;
          background-position: center top;
          cursor: pointer;
          opacity: 0.42;
          transition: opacity 240ms var(--ease-soft);
          border: 0;
          border-radius: 4px;
          padding: 0;
        }
        .gallery-thumbs :global(.gthumb)::after {
          content: "";
          position: absolute;
          inset: 0;
          box-shadow: inset 0 0 0 0 var(--bwiga-blue);
          transition: box-shadow 240ms var(--ease-soft);
        }
        .gallery-thumbs :global(.gthumb):hover {
          opacity: 0.85;
        }
        .gallery-thumbs :global(.gthumb.is-active) {
          opacity: 1;
        }
        .gallery-thumbs :global(.gthumb.is-active)::after {
          box-shadow: inset 0 0 0 2px var(--bwiga-blue);
        }

        /* -------- Responsive -------- */
        @media (max-width: 900px) {
          .place-intro {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .place-stage {
            height: 65vh;
            min-height: 360px;
          }
          .gallery-thumbs :global(.gthumb) {
            flex: 0 0 96px;
            height: 54px;
          }
        }
        @media (max-width: 640px) {
          .place-head {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .place-stage {
            height: 55vh;
            min-height: 320px;
          }
          .gallery-thumbs {
            gap: 4px;
            padding-top: 4px;
          }
          .gallery-thumbs :global(.gthumb) {
            flex: 0 0 80px;
            height: 46px;
          }
          .place-ctas {
            width: 100%;
          }
          .place-cta {
            flex: 1 1 auto;
            justify-content: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .place-stage :global(.gslide.is-active .gblind .gshutter),
          .place-stage :global(.gslide.is-leaving .gblind .gshutter) {
            transition: none;
          }
          .g-progress.is-running :global(span) {
            transition: none;
            transform: scaleX(0);
          }
        }
      `}</style>
    </section>
  );
}
