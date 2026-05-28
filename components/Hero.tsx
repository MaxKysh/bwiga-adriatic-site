"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import content from "@/data/content.json";
import YouTubeModal from "./YouTubeModal";
import { mailto } from "@/lib/mailto";
import {
  NOMINATION_BODY,
  NOMINATION_SUBJECT,
  WHITELIST_BODY,
  WHITELIST_SUBJECT,
} from "@/lib/mail-templates";

// Statuette is R3F + DOM-heavy. SSR-skip it and lazy-load on the client only.
const Statuette = dynamic(
  () => import("./Statuette").then((m) => m.Statuette ?? m.default),
  {
    ssr: false,
    loading: () => <div className="statuette-skeleton">Statuette · loading</div>,
  }
);

const PAST_LABEL = "Past Editions";
const SCROLL_LABEL = "scroll";

function extractYouTubeId(url: string): string | null {
  // Handles youtu.be/<id> and youtube.com/watch?v=<id>
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split(/[/?#]/)[0] || null;
    const v = u.searchParams.get("v");
    if (v) return v;
    const segs = u.pathname.split("/");
    const i = segs.findIndex((s) => s === "embed");
    if (i >= 0 && segs[i + 1]) return segs[i + 1];
    return null;
  } catch {
    return null;
  }
}

export default function Hero() {
  const [openVideo, setOpenVideo] = useState<string | null>(null);

  const videos = content.about.videos;
  const adriaticId = extractYouTubeId(videos[0]?.youtube ?? "") ?? "kIbMj-zygCI";
  const belgradeId = extractYouTubeId(videos[1]?.youtube ?? "") ?? "lYH-xv6glKM";

  return (
    <section className="hero" id="hero" aria-label="Hero">
      <div className="hero-bg-poster" aria-hidden />
      <video
        className="hero-bg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/img/hero-poster.jpg"
        aria-hidden
      >
        <source media="(min-width: 1024px)" src="/video/hero-bg-loop-1080.webm" type="video/webm" />
        <source media="(min-width: 1024px)" src="/video/hero-bg-loop-1080.mp4" type="video/mp4" />
        <source media="(max-width: 1023px)" src="/video/hero-bg-loop-720.webm" type="video/webm" />
        <source media="(max-width: 1023px)" src="/video/hero-bg-loop-720.mp4" type="video/mp4" />
      </video>

      <div className="hero-grid">
        <div className="hero-rightcol">
          <div className="hero-topright">
            <div className="meta">
              <b>September 30, 2026</b>
              <br />
              {content.event.venue.short_name} &middot; {content.event.venue.city}
            </div>
          </div>

          <div className="hero-stage">
            <Statuette />
          </div>

          <div className="past">
            <div className="past-label">{PAST_LABEL}</div>
            <div className="past-tiles">
              <button
                className="past-tile"
                type="button"
                aria-label={`Watch ${videos[0]?.title ?? "Adriatic 2025"} recap`}
                onClick={() => setOpenVideo(adriaticId)}
              >
                <Image
                  src="/img/poster-adriatic-2025.jpg"
                  alt=""
                  fill
                  sizes="172px"
                  style={{ objectFit: "cover" }}
                />
                <span className="play" aria-hidden>
                  <svg viewBox="0 0 12 12">
                    <path d="M2 1.5L10 6L2 10.5Z" fill="currentColor" />
                  </svg>
                </span>
                <span className="tile-meta">
                  <span>Adriatic &rsquo;25</span>
                </span>
              </button>
              <button
                className="past-tile"
                type="button"
                aria-label={`Watch ${videos[1]?.title ?? "Belgrade 2026"} recap`}
                onClick={() => setOpenVideo(belgradeId)}
              >
                <Image
                  src="/img/poster-belgrade-2026.jpg"
                  alt=""
                  fill
                  sizes="172px"
                  style={{ objectFit: "cover" }}
                />
                <span className="play" aria-hidden>
                  <svg viewBox="0 0 12 12">
                    <path d="M2 1.5L10 6L2 10.5Z" fill="currentColor" />
                  </svg>
                </span>
                <span className="tile-meta">
                  <span>Belgrade &rsquo;26</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="hero-main">
          <div className="eyebrow">
            {content.event.short_name} &middot; {content.event.edition}
          </div>

          <h1 className="hero-title">
            Balkan Web3<br />
            <span className="accent">&amp;</span> iGaming Awards
          </h1>

          <p className="hero-sub">{content.hero.tagline_primary}</p>

          <p className="substat">{content.hero.tagline_secondary}</p>

          <div className="cta-row">
            <a
              className="btn btn-primary"
              href={mailto(
                content.contacts.email,
                WHITELIST_SUBJECT,
                WHITELIST_BODY
              )}
            >
              <span className="label">
                {content.hero.cta_primary.label}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M2 7H12 M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                </svg>
              </span>
            </a>
            <a
              className="btn btn-ghost"
              href={mailto(
                content.contacts.email,
                NOMINATION_SUBJECT,
                NOMINATION_BODY
              )}
            >
              <span className="label">
                {content.hero.cta_secondary.label}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M2 7H12 M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>

      <div className="scroll-hint" aria-hidden>
        <span className="center">
          <span className="lab">{SCROLL_LABEL}</span>
          <span className="line" />
        </span>
      </div>

      <YouTubeModal videoId={openVideo} onClose={() => setOpenVideo(null)} />

      <style jsx>{`
        .hero {
          position: relative;
          min-height: 100svh;
          width: 100%;
          overflow: hidden;
          isolation: isolate;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.65);
          z-index: 1;
          background: var(--ink-0);
          display: block;
        }
        .hero-bg-poster {
          position: absolute;
          inset: -4%;
          width: 108%;
          height: 108%;
          background: var(--ink-0) url("/img/hero-poster.jpg") center / cover no-repeat;
          filter: brightness(0.62) saturate(1.05);
          z-index: 0;
          transform-origin: 50% 55%;
          /* Only ken-burns pan (compositor-friendly transform). Dropped the
             previous heroBreathe keyframe — it animated filter brightness
             every frame which forces a CPU repaint of the full poster,
             expensive on 4K viewports. */
          animation: heroPan 28s ease-in-out infinite alternate;
          will-change: transform;
        }
        @keyframes heroPan {
          0% {
            transform: scale(1.06) translate3d(-1.2%, -0.6%, 0);
          }
          100% {
            transform: scale(1.12) translate3d(1.4%, 0.8%, 0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-bg-poster {
            animation: none;
            transform: scale(1.06);
          }
        }
        /* Left-to-right gradient under text */
        .hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(5, 7, 13, 0.92) 0%,
            rgba(5, 7, 13, 0.78) 28%,
            rgba(5, 7, 13, 0.4) 55%,
            rgba(5, 7, 13, 0) 78%
          );
          z-index: 1;
          pointer-events: none;
        }
        /* Bottom-to-top gradient under the past-edition tiles */
        .hero::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 38%;
          background: linear-gradient(
            0deg,
            rgba(5, 7, 13, 0.7) 0%,
            rgba(5, 7, 13, 0.18) 60%,
            rgba(5, 7, 13, 0) 100%
          );
          z-index: 1;
          pointer-events: none;
        }

        .hero-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.9fr);
          grid-template-rows: 1fr;
          min-height: 100svh;
          padding: 32px clamp(28px, 4vw, 56px) 28px;
        }

        .hero-rightcol {
          grid-column: 2 / 3;
          display: grid;
          grid-template-rows: auto 1fr auto;
          align-self: stretch;
          min-height: 0;
          /* Leave a band at the bottom for the scroll-hint area. The past
             tiles are absolutely positioned over this band (desktop only)
             so the statuette ends just above it. */
          padding-bottom: clamp(96px, 10vw, 132px);
        }
        .hero-topright {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 14px;
          padding-top: 8px;
        }
        .meta {
          font-family: var(--font-inter);
          /* Smaller on narrow viewports — meta label is uppercase + wide
             tracking, balloons fast otherwise. */
          font-size: clamp(11px, 1vw, 15px);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-2);
          line-height: 1.4;
          text-align: right;
        }
        .meta b {
          color: var(--paper-0);
          font-weight: 700;
          letter-spacing: 0.16em;
        }

        .hero-stage {
          position: relative;
          align-self: stretch;
          justify-self: stretch;
          min-height: 380px;
          background:
            radial-gradient(60% 50% at 50% 55%, rgba(48, 131, 198, 0.22) 0%, rgba(48, 131, 198, 0) 70%);
        }
        .hero-stage :global(canvas) {
          position: absolute !important;
          inset: 0;
          width: 100% !important;
          height: 100% !important;
        }
        .statuette-skeleton {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: var(--paper-2);
          font-family: var(--font-inter);
          font-size: var(--fs-micro);
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .past {
          /* Pinned to the bottom-right of the hero (desktop). Offset matches
             the scroll label's bottom-band area, so the past tiles sit on
             the same vertical line as the centred "scroll" hint. */
          position: absolute;
          right: clamp(28px, 4vw, 56px);
          bottom: clamp(28px, 3vw, 44px);
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }
        .past-label {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-2);
        }
        .past-tiles {
          display: flex;
          gap: 12px;
        }
        .past-tile {
          position: relative;
          width: 172px;
          height: 97px;
          overflow: hidden;
          background: var(--ink-2);
          border: 0;
          border-radius: 4px;
          cursor: pointer;
          padding: 0;
          transition: transform 380ms var(--ease-spring), box-shadow 380ms var(--ease-soft);
        }
        .past-tile :global(img) {
          object-fit: cover;
          transition: transform 700ms var(--ease-spring);
        }
        .past-tile::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            0deg,
            rgba(5, 7, 13, 0.78) 0%,
            rgba(5, 7, 13, 0.1) 60%,
            rgba(5, 7, 13, 0) 100%
          );
          pointer-events: none;
          z-index: 1;
        }
        .past-tile .play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          color: var(--ink-0);
          transition: transform 380ms var(--ease-spring), background 280ms var(--ease-soft);
          z-index: 2;
        }
        .past-tile .play svg {
          width: 12px;
          height: 12px;
          transform: translateX(1px);
        }
        .past-tile .tile-meta {
          position: absolute;
          bottom: 8px;
          left: 10px;
          right: 10px;
          display: flex;
          justify-content: space-between;
          color: var(--paper-0);
          font-family: var(--font-inter);
          font-size: var(--fs-micro);
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          z-index: 2;
        }
        .past-tile:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 32px rgba(48, 131, 198, 0.25);
        }
        .past-tile:hover :global(img) {
          transform: scale(1.08);
        }
        .past-tile:hover .play {
          transform: translate(-50%, -50%) scale(1.12);
          background: var(--bwiga-blue);
          color: var(--paper-0);
        }

        .hero-main {
          grid-column: 1 / 2;
          grid-row: 1 / 2;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-right: clamp(24px, 4vw, 56px);
          padding-top: clamp(48px, 6vw, 96px);
          padding-bottom: clamp(48px, 6vw, 96px);
          max-width: 720px;
        }
        .eyebrow {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-2);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .eyebrow::before {
          content: "";
          display: inline-block;
          width: 28px;
          height: 1px;
          background: currentColor;
        }
        .hero-title {
          font-family: var(--font-inter);
          /* Smaller minimum and vw factor than the global --fs-h1 token so
             the title doesn't fill the whole screen on 1280-1440 laptops.
             4K cap stays at 72px. */
          font-size: clamp(36px, 4.4vw, 72px);
          font-weight: 300;
          line-height: 1.04;
          letter-spacing: -0.01em;
          margin: 0 0 28px;
          color: var(--paper-0);
          text-wrap: balance;
        }
        .hero-title .accent {
          color: var(--bwiga-blue);
          font-style: italic;
          font-weight: 300;
        }
        .hero-sub {
          font-family: var(--font-inter);
          /* Likewise scaled down on laptops; was clamp(24, 2.5vw, 36). */
          font-size: clamp(20px, 2vw, 32px);
          line-height: 1.25;
          letter-spacing: -0.01em;
          color: var(--paper-1);
          max-width: 28ch;
          margin: 0 0 36px;
          font-weight: 300;
          text-wrap: balance;
        }
        .stat-row {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 0 22px;
          margin: 0 0 14px;
          padding: 0;
          list-style: none;
          font-feature-settings: "tnum";
        }
        .stat-row li {
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
          color: var(--paper-1);
        }
        .stat-row li + li {
          padding-left: 22px;
          border-left: 1px solid var(--hairline);
        }
        .stat-row .n {
          font-family: var(--font-inter);
          font-size: var(--fs-h4);
          font-weight: 600;
          color: var(--paper-0);
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .stat-row .l {
          font-size: var(--fs-caption);
          color: var(--paper-2);
          letter-spacing: 0.04em;
        }
        .substat {
          font-size: var(--fs-caption);
          color: var(--paper-2);
          margin: 0 0 36px;
          letter-spacing: 0.02em;
        }

        .cta-row {
          display: flex;
          align-items: stretch;
          gap: 14px;
          flex-wrap: wrap;
        }
        .btn {
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
          /* Plain two-stop gradient spanning the full height — a subtle
             brand-blue lift, no highlight, no border. */
          background: linear-gradient(
            180deg,
            var(--bwiga-blue-bright) 0%,
            var(--bwiga-blue-deep) 100%
          );
          isolation: isolate;
          overflow: hidden;
          transform: scale(1);
          transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
          text-decoration: none;
        }
        .btn .label {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: color 850ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-primary::before {
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
        .btn-primary:hover {
          transform: scale(1.03);
        }
        .btn-primary:hover::before {
          transform: translateY(0);
        }
        .btn-primary:hover .label {
          color: var(--bwiga-blue);
        }
        .btn-primary:active {
          transform: scale(0.98);
        }

        .btn-ghost {
          /* No backdrop-blur — composited blur at 22px is heavy on 4K.
             Replaced with a flat translucent fill + thin hairline so the
             button still reads as a glass plate over the video. */
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 14px 24px;
          color: var(--paper-0);
          transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1),
            background 220ms ease, color 220ms ease,
            border-color 220ms ease;
        }
        .btn-ghost:hover {
          border-color: var(--paper-0);
        }
        .btn-ghost .label {
          transition: color 220ms ease;
        }
        .btn-ghost:hover {
          transform: scale(1.02);
          background: var(--paper-0);
          color: var(--bwiga-blue);
        }
        .btn-ghost:hover .label {
          color: var(--bwiga-blue);
        }
        .btn-ghost:active {
          transform: scale(0.98);
        }

        .scroll-hint {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 112px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 clamp(28px, 4vw, 56px);
          z-index: 3;
          pointer-events: none;
        }
        .scroll-hint .center {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .scroll-hint .lab {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-2);
        }
        .scroll-hint .line {
          width: 1px;
          height: 28px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0));
          overflow: hidden;
          position: relative;
          display: inline-block;
        }
        .scroll-hint .line::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 12px;
          background: var(--bwiga-blue);
          animation: scrollPulse 2.2s var(--ease-soft) infinite;
        }
        @keyframes scrollPulse {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(420%);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .scroll-hint .line::after {
            animation: none;
            opacity: 0;
          }
        }

        @media (max-width: 1023px) {
          .hero-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto;
            /* Бургер уехал в правый нижний угол — верхний отступ под него
               больше не нужен, поднимаем контент hero выше (84px → 32px). */
            padding: 32px 24px 32px;
            min-height: auto;
          }
          .hero-rightcol {
            grid-column: 1;
            grid-row: auto;
            order: 1;
            padding-bottom: 24px;
            grid-template-rows: auto auto auto;
          }
          .hero-topright {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            gap: 12px;
          }
          .hero-main {
            grid-column: 1;
            grid-row: auto;
            padding-right: 0;
            padding-bottom: 32px;
            order: 2;
            max-width: none;
          }
          .hero-stage {
            height: 360px;
            min-height: 360px;
          }
          .past {
            /* Back in normal grid flow on tablet/mobile. */
            position: static;
            right: auto;
            bottom: auto;
            align-items: flex-start;
          }
          .scroll-hint {
            display: none;
          }
        }
        @media (max-width: 540px) {
          .past-tile {
            width: 148px;
            height: 84px;
          }
          .stat-row .n {
            font-size: var(--fs-h5);
          }
          .hero-topright {
            flex-direction: column-reverse;
            align-items: flex-start;
          }
          .meta {
            text-align: left;
          }
        }
      `}</style>
    </section>
  );
}
