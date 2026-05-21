"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type NavItem = { id: string; label: string };

// Labels lifted verbatim from the design file's sidebar (project/index.html
// .rail-nav). More descriptive than the earlier one-word shorthand.
const NAV: NavItem[] = [
  { id: "about", label: "About Awards" },
  { id: "awards", label: "Nominations" },
  { id: "people", label: "Speakers & Jury" },
  { id: "day", label: "Schedule & Tickets" },
  { id: "place", label: "Location & Venue" },
  { id: "partners", label: "Partners & Media" },
  { id: "contacts", label: "Contacts" },
];

export default function Sidebar() {
  const [active, setActive] = useState<string>("hero");
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const ids = ["hero", ...NAV.map((n) => n.id)];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="rail-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden />
      </button>

      <aside
        className={`rail ${open ? "rail--open" : ""}`}
        aria-label="Primary navigation"
      >
        <a className="rail-logo" href="#hero" aria-label="BWiGA home" onClick={() => setOpen(false)}>
          <Image
            src="/bwiga-logo-clean.svg"
            alt="BWiGA"
            width={220}
            height={64}
            priority
          />
        </a>

        <nav className="rail-nav">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`rail-link ${active === item.id ? "is-active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Credits — Organized by + Made in CHIPSA. Replaces the old
            vertical "Adriatic '26" mark. */}
        <div className="rail-foot">
          <a
            className="rail-credit"
            href="https://leadvolume.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="rail-credit-label">Organized by</span>
            {/* Lead Volume mark — VP9 WebM (transparent alpha) instead of
                a GIF. 17 KB vs 120 KB, decode is hardware-accelerated, and
                the browser stops decoding when the tab is backgrounded.
                The wrapper still crops 20px off the left of the asset. */}
            <span className="rail-credit-logo-wrap">
              <video
                className="rail-credit-logo"
                src="/lead-volume.webm"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-label="Lead Volume"
              />
            </span>
          </a>

          <a
            className="rail-credit-chipsa"
            href="https://igaming.chipsa.design/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="rail-credit-label">Made in</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="rail-credit-chipsa-sign"
              src="/chipsa-sign.svg"
              alt=""
              aria-hidden
              loading="lazy"
            />
            <span className="rail-credit-chipsa-name">Chipsa</span>
          </a>
        </div>
      </aside>

      <style jsx>{`
        .rail {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: var(--rail);
          /* Solid black — fully opaque, no blend with the page background.
             Also cheap to composite (no transparency, no blur). */
          background: #000;
          border-right: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          padding: 28px 28px;
          z-index: 50;
        }
        .rail-logo {
          display: block;
          width: 100%;
          color: var(--paper-0);
          position: relative;
          isolation: isolate;
          padding: 6px 8px;
          /* Subtle radial halo behind the mark — soft ambient volume on
             the dark rail, matches the volumetric treatment on buttons. */
          background: radial-gradient(
            ellipse 95% 80% at 50% 35%,
            rgba(48, 131, 198, 0.16),
            transparent 75%
          );
          border-radius: 6px;
          transition: transform 350ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .rail-logo :global(img) {
          width: 100%;
          height: auto;
          position: relative;
          z-index: 1;
        }
        .rail-logo:hover {
          transform: scale(1.05);
        }
        .rail-nav {
          margin-top: 64px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .rail-link {
          position: relative;
          font-family: var(--font-inter);
          /* Adaptive font — at narrow viewports rail is ~205px and the
             longer labels ("Schedule & Tickets", "Speakers & Jury") wrap
             at 18px. Scales back up to 18px on 1500px+ screens. */
          font-size: clamp(14px, 1.15vw, 18px);
          font-weight: 600;
          letter-spacing: 0.01em;
          color: var(--paper-2);
          padding: 8px 0 8px 16px;
          text-decoration: none;
          /* Stay on a single line; if a label is too long for the rail,
             prefer to ellipsis than to break to two lines. */
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          transition: color 220ms var(--ease-soft), padding-left 220ms var(--ease-soft);
        }
        .rail-link::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: var(--paper-2);
          transform: translateY(-50%) scale(0.6);
          opacity: 0;
          transition: background 220ms var(--ease-soft),
            opacity 220ms var(--ease-soft),
            transform 220ms var(--ease-soft);
        }
        .rail-link:hover {
          color: var(--paper-0);
        }
        .rail-link.is-active {
          color: var(--bwiga-blue);
        }
        .rail-link.is-active::before {
          background: var(--bwiga-blue);
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }
        /* Footer credits — Lead Volume (organizer) + Chipsa (design
           partner). Stacked at the bottom of the rail with generous gap
           between them. */
        .rail-foot {
          display: flex;
          flex-direction: column;
          gap: 36px;
          margin-top: 28px;
        }
        .rail-credit,
        .rail-credit-chipsa {
          text-decoration: none;
          color: inherit;
          display: flex;
        }
        .rail-credit {
          flex-direction: column;
          gap: 10px;
        }
        .rail-credit-label {
          font-family: var(--font-inter);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1;
        }
        /* Lead Volume GIF — wrapped so the asset's 20px left margin gets
           clipped. Image is ~6.667% wider than the wrap (320/300 ratio),
           pulled left by the matching margin so the visible 100% of the
           wrap maps to the cropped 300×46 region of the original GIF. */
        .rail-credit-logo-wrap {
          display: block;
          overflow: hidden;
          width: 100%;
          max-width: 190px;
        }
        .rail-credit-logo {
          display: block;
          width: calc(100% + 6.667%);
          margin-left: -6.667%;
          height: auto;
          opacity: 0.96;
          transition: opacity 220ms ease;
          /* Video elements default to filling their box — keep aspect ratio
             explicit from the source for early layout (matches 320×46 GIF). */
          aspect-ratio: 320 / 46;
        }
        .rail-credit:hover .rail-credit-logo {
          opacity: 1;
        }

        .rail-credit-chipsa {
          align-items: center;
          gap: 10px;
          font-family: var(--font-inter);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
          transition: color 220ms ease;
        }
        .rail-credit-chipsa-sign {
          width: 32px;
          height: 18px;
          flex: 0 0 auto;
          /* Subtle desaturation at rest; full gradient on hover. */
          filter: grayscale(1) brightness(2) opacity(0.85);
          transition: filter 220ms ease;
        }
        .rail-credit-chipsa-name {
          color: inherit;
        }
        .rail-credit-chipsa:hover {
          color: var(--paper-0);
        }
        .rail-credit-chipsa:hover .rail-credit-chipsa-sign {
          filter: none;
        }

        .rail-toggle {
          display: none;
          position: fixed;
          top: 14px;
          left: 14px;
          width: 44px;
          height: 44px;
          background: #000;
          border: 1px solid var(--hairline-strong);
          backdrop-filter: blur(8px);
          z-index: 60;
          place-items: center;
          cursor: pointer;
          padding: 0;
        }
        .rail-toggle span,
        .rail-toggle span::before,
        .rail-toggle span::after {
          content: "";
          display: block;
          width: 18px;
          height: 1.5px;
          background: var(--paper-0);
          position: relative;
        }
        .rail-toggle span::before {
          position: absolute;
          top: -6px;
        }
        .rail-toggle span::after {
          position: absolute;
          top: 6px;
        }

        @media (max-width: 1023px) {
          .rail-toggle {
            display: grid;
          }
          .rail {
            width: 100%;
            transform: translateX(-100%);
            transition: transform 360ms var(--ease-soft);
            align-items: flex-start;
            padding: 80px 32px 32px;
          }
          .rail--open {
            transform: translateX(0);
          }
          .rail-nav {
            margin-top: 32px;
            align-items: flex-start;
            gap: 28px;
          }
          .rail-link {
            font-size: 22px;
            padding-left: 0;
          }
          .rail-link::before {
            display: none;
          }
          .rail-foot {
            display: none;
          }
          .rail-logo :global(img) {
            width: 180px;
          }
        }
      `}</style>
    </>
  );
}
