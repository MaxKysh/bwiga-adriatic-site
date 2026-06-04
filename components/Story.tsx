"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import content from "@/data/content.json";
import Counter from "./Counter";

// -----------------------------------------------------------------------------
// Local editorial constants — section chrome + curated numbers that aren't part
// of content.json's body text. Lifted from the design file so the page reads
// the same as the prototype. If editors need them tweakable, promote them to
// data/content.json under `story.*`.
// -----------------------------------------------------------------------------
const STORY_MARK = "02";
const STORY_EYEBROW = "About · Gallery · Top Media";
const STORY_TAG = "The Story";
const STORY_TITLE = (
  <>
    Two editions in, the Adriatic&rsquo;s <em>landmark</em> night for Web3 and iGaming.
  </>
);

type Stat = { value: string; suffix?: string; label: string };
const STORY_STATS: Stat[] = [
  { value: "20", suffix: "+", label: "Conferences" },
  { value: "10", label: "Years" },
  { value: "5", label: "Countries hosted" },
  { value: "30", suffix: "+", label: "Countries on guest list" },
  { value: "100", suffix: "+", label: "Projects per edition" },
];

const GALLERY_EYEBROW = "Photo Gallery · Belgrade '26 · Tivat '25";
const MEDIA_EYEBROW = "Top Media About Us";
const MEDIA_META = "11 outlets · 2024–2026";

// Slide auto-advance interval (matches design's --auto-ms default).
const AUTO_MS = 5500;

// Map content.json paths ("assets/event-photos/foo.webp") onto the in-public
// path ("/event-photos/foo.webp"), filtered to files we actually copied over.
function toPublicPath(src: string): string {
  return "/" + src.replace(/^assets\//, "");
}

// All photos shipped in /public/event-photos/. Interleaved (named ceremony
// shots ↔ on-the-ground IMG_* candids) per the design's "don't cluster by
// mood" curation hint. Edit by syncing with the source repo
// (bwiga-adriatic/assets/event-photos/) — keep this list in lockstep.
const AVAILABLE_GALLERY = [
  "adriatic-2025-ceremony.webp",
  "IMG_4053.webp",
  "adriatic-2025-keynote-stage.webp",
  "IMG_4055.webp",
  "adriatic-2025-live-band.webp",
  "IMG_4056.webp",
  "adriatic-2025-evening-venue-aerial.webp",
  "IMG_4057.webp",
  "adriatic-2025-marina-networking.webp",
  "IMG_4058.webp",
  "adriatic-2025-daytime-networking.webp",
  "IMG_4064.webp",
  "adriatic-2025-terrace-conversation.webp",
  "IMG_4069.webp",
  "adriatic-2025-attendees-group.webp",
  "IMG_4070.webp",
  "adriatic-2025-catering-desserts.webp",
  "IMG_4072.webp",
  "IMG_4073.webp",
  "IMG_4074.webp",
  "IMG_4076.webp",
];

// Pull descriptors for the top-media chips from data/content.json. The design
// adds a short tagline per outlet — we lift those verbatim. Fall back to a
// generic "Coverage" tag for anything not in the lookup.
const MEDIA_DESCRIPTORS: Record<string, string> = {
  "Business Insider": "News · Montenegro '26",
  "CoinMarketCap": "Community feature",
  Binance: "Square · long read",
  Benzinga: "Press release · Montenegro '26",
  "Forbes Liberia": "News · Montenegro '26",
  Techbullion: "100 global Web3 & AI projects",
  "Bitget (Video Report)": "Instagram reel",
  "Bitget News": "Exchange newsroom",
  "Coinstelegram - Top-20": "Top-20 people running crypto",
  "iGaming News - Top-5 Events": "Top-5 events to watch · 2026",
  Coingabbar: "Adriatic '25 · Montenegro",
};

function getMonogram(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// -----------------------------------------------------------------------------
// Gallery slide — 5-blind staggered shutter transition lifted from the design
// system's "22-photography" pattern. Each blind shows 1/5 of the image; the
// shutters open top-to-bottom, staggered 80ms apart (reversed on prev).
// -----------------------------------------------------------------------------
function Slide({
  src,
  isActive,
  isLeaving,
  dir,
  loaded,
}: {
  src: string;
  isActive: boolean;
  isLeaving: boolean;
  dir: "next" | "prev";
  loaded: boolean;
}) {
  const cls = [
    "gslide",
    isActive ? "is-active" : "",
    isLeaving ? "is-leaving" : "",
    isActive && dir === "prev" ? "dir-prev" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Ленивый рендер background-image: пока слайд не «активирован» хотя бы раз
  // (current, next, prev) — Safari iOS не декодирует JPEG в video memory.
  // При 21 слайде × 5 blinds × 1-4MB декодированных это даёт огромный выигрыш
  // по памяти.
  const bg = loaded ? { backgroundImage: `url(${src})` } : undefined;

  return (
    <div className={cls} aria-hidden={!isActive}>
      <div className="gblinds">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="gblind">
            <div className="gimg" style={bg} />
            <div className="gshutter" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Story() {
  // ---------------------------------------------------------------------------
  // Story body — first 2 paragraphs from content.json so editors can edit copy
  // without touching JSX.
  // ---------------------------------------------------------------------------
  const body = content.about.body.slice(0, 2);

  // ---------------------------------------------------------------------------
  // Gallery slides — intersect content.json gallery list with files actually
  // shipped in /public/event-photos, then cap at AVAILABLE_GALLERY for now.
  // ---------------------------------------------------------------------------
  const slides = useMemo(
    () =>
      AVAILABLE_GALLERY.map((name) => toPublicPath(`assets/event-photos/${name}`)),
    []
  );

  const [idx, setIdx] = useState(0);
  const [leavingIdx, setLeavingIdx] = useState<number | null>(null);
  const [dir, setDir] = useState<"next" | "prev">("next");
  // Два независимых источника паузы:
  //   hoverPaused — мышь/фокус над галереей (или ручная навигация).
  //   offScreen   — стейдж не в viewport'е.
  // Эффект auto-advance смотрит на их OR. Это важно, чтобы IntersectionObserver
  // не «снимал» hover-паузу при возврате в viewport.
  const [hoverPaused, setHoverPaused] = useState(false);
  const [offScreen, setOffScreen] = useState(false);
  const paused = hoverPaused || offScreen;
  const progressRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Какие слайды уже «активировались» — стартуем с [0, 1] (current + next).
  // При смене idx добавляем idx, idx+1, idx-1 (purchased lookahead в обе стороны).
  // Eviction не делаем — после полного просмотра все 21 в Set'е, но это всё
  // ещё лучше чем все 21 одновременно при первой загрузке.
  const [loadedSlides, setLoadedSlides] = useState<Set<number>>(
    () => new Set([0, 1])
  );

  const go = (next: number, direction: "next" | "prev") => {
    setLeavingIdx(idx);
    setDir(direction);
    setIdx(next);
    window.setTimeout(() => setLeavingIdx(null), 800);
  };

  const goNext = () => go((idx + 1) % slides.length, "next");
  const goPrev = () => go((idx - 1 + slides.length) % slides.length, "prev");

  // Подгружаем bg-image у [idx, idx+1, idx-1]: текущий + соседи в обе
  // стороны (на случай Prev'а).
  useEffect(() => {
    setLoadedSlides((prev) => {
      const next = new Set(prev);
      next.add(idx);
      next.add((idx + 1) % slides.length);
      next.add((idx - 1 + slides.length) % slides.length);
      return next;
    });
  }, [idx, slides.length]);

  // Off-screen pause — пока стейдж не в viewport'е, не крутим авто-advance.
  // Это не «гасит» hover-pause: они независимы.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setOffScreen(!e.isIntersecting)),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Auto-advance — pause on hover/focus or when reduced motion is requested.
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

  // Restart the progress bar on each slide change.
  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    el.classList.remove("is-running");
    // Force reflow so the transition replays from 0 → 1.
    void el.offsetWidth;
    if (!paused) el.classList.add("is-running");
  }, [idx, paused]);

  // Keep the active thumb centered in the strip — without ever scrolling the
  // page. `scrollIntoView({ block: 'nearest' })` still nudges the window when
  // the strip itself isn't fully on-screen, so we drive scrollLeft directly.
  useEffect(() => {
    const wrap = thumbsRef.current;
    if (!wrap) return;
    const active = wrap.querySelector<HTMLButtonElement>(".gthumb.is-active");
    if (!active) return;
    const target = active.offsetLeft - (wrap.clientWidth - active.clientWidth) / 2;
    const max = wrap.scrollWidth - wrap.clientWidth;
    const clamped = Math.max(0, Math.min(max, target));
    wrap.scrollTo({ left: clamped, behavior: "smooth" });
  }, [idx]);

  // Keyboard navigation when the gallery has focus.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Top Media — duplicate the list in-place so the marquee loops without seam,
  // then drive it with the Web Animations API so we can interpolate playback
  // rate smoothly (CSS animation-play-state only toggles 0↔1 instantly).
  // ---------------------------------------------------------------------------
  const media = content.about.media_mentions;
  const marqueeItems = useMemo(() => [...media, ...media], [media]);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const clippingsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const wrap = marqueeRef.current;
    const ul = clippingsRef.current;
    if (!wrap || !ul) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const anim = ul.animate(
      [
        { transform: "translate3d(0, 0, 0)" },
        { transform: "translate3d(-50%, 0, 0)" },
      ],
      { duration: 38000, iterations: Infinity, easing: "linear" }
    );

    // Inertia: each frame, lerp current rate toward target. 0.06 ≈ ~400ms
    // settle — feels like a heavy reel slowing down, not an abrupt stop.
    let rate = 1;
    let target = 1;
    let raf: number | null = null;

    const step = () => {
      const d = target - rate;
      if (Math.abs(d) < 0.0015) {
        rate = target;
        anim.playbackRate = rate;
        raf = null;
        return;
      }
      rate += d * 0.06;
      anim.playbackRate = rate;
      raf = requestAnimationFrame(step);
    };
    const ease = (to: number) => {
      target = to;
      if (raf == null) raf = requestAnimationFrame(step);
    };
    const onEnter = () => ease(0);
    const onLeave = () => ease(1);

    wrap.addEventListener("mouseenter", onEnter);
    wrap.addEventListener("mouseleave", onLeave);
    // Also pause when focus lands inside (keyboard users tabbing through chips).
    wrap.addEventListener("focusin", onEnter);
    wrap.addEventListener("focusout", onLeave);

    // Off-screen pause — пока маркиза вне viewport'а, полностью останавливаем
    // WAAPI-анимацию (не просто playbackRate=0, а anim.pause() — это снимает
    // ленту с композитора и освобождает GPU-ресурсы). На iOS Safari это
    // критично: бесконечная transform-анимация с will-change держит слой
    // постоянно горячим даже когда не виден.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) anim.play();
          else anim.pause();
        });
      },
      { rootMargin: "100px 0px" }
    );
    io.observe(wrap);

    return () => {
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("mouseleave", onLeave);
      wrap.removeEventListener("focusin", onEnter);
      wrap.removeEventListener("focusout", onLeave);
      if (raf != null) cancelAnimationFrame(raf);
      io.disconnect();
      anim.cancel();
    };
  }, [marqueeItems.length]);

  return (
    <section className="story" id="about" aria-label="About BWiGA">
      {/* --- About header + intro --- */}
      <div className="story-inner">
        <div className="story-head">
          <div className="left">
            <span className="nm">{STORY_MARK}</span>
            <span className="eye">{STORY_EYEBROW}</span>
          </div>
          <div className="tag">{STORY_TAG}</div>
        </div>

        <div className="story-intro">
          <h2 className="story-title">{STORY_TITLE}</h2>
          <div className="story-body">
            {body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        <ul className="inline-stats">
          {STORY_STATS.map((s, i) => (
            <li key={`${s.value}-${s.label}-${i}`}>
              <b>
                <Counter value={s.value} delay={i * 220} />
                {s.suffix ? <span className="plus">{s.suffix}</span> : null}
              </b>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* --- Photo gallery (full-bleed) --- */}
      <div className="gallery">
        <div className="gallery-head">
          <div className="eye">{GALLERY_EYEBROW}</div>
          <div className="meta">
            <b>{String(idx + 1).padStart(2, "0")}</b>
            <span>/ {String(slides.length).padStart(2, "0")}</span>
          </div>
        </div>

        <div
          className="gallery-stage"
          ref={stageRef}
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
          onFocus={() => setHoverPaused(true)}
          onBlur={() => setHoverPaused(false)}
          tabIndex={0}
          role="region"
          aria-label="Photo gallery"
          aria-roledescription="carousel"
        >
          {slides.map((src, i) => (
            <Slide
              key={src}
              src={src}
              isActive={i === idx}
              isLeaving={i === leavingIdx}
              dir={dir}
              loaded={loadedSlides.has(i)}
            />
          ))}
          <div className="gallery-arrows">
            <button type="button" aria-label="Previous photo" onClick={goPrev}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M15 18 9 12 15 6" />
              </svg>
            </button>
            <button type="button" aria-label="Next photo" onClick={goNext}>
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
          {slides.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`gthumb ${i === idx ? "is-active" : ""}`}
              aria-label={`Show photo ${i + 1} of ${slides.length}`}
              onClick={() => go(i, i > idx ? "next" : "prev")}
            >
              {/* <img loading="lazy"> вместо background-image: браузер сам
                  делает intersection-based decode, а на iOS Safari это
                  избавляет от моментальной декодинг-загрузки всех 21
                  полноразмерных JPEG'ов в видеопамять на странице.
                  width/height — intrinsic ratio для CLS. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                width="116"
                height="62"
              />
            </button>
          ))}
        </div>
      </div>

      {/* --- Top media (chips marquee) --- */}
      <div className="story-inner">
        <div className="media-head">
          <div className="eye">{MEDIA_EYEBROW}</div>
          <div className="ct">{MEDIA_META}</div>
        </div>
      </div>
      <div className="clip-marquee" ref={marqueeRef}>
        <ul className="clippings" ref={clippingsRef}>
          {marqueeItems.map((m, i) => {
            const host = getHost(m.url);
            const fav = host
              ? `https://www.google.com/s2/favicons?domain=${host}&sz=64`
              : null;
            const desc = MEDIA_DESCRIPTORS[m.name] ?? "Coverage";
            return (
              <li key={`${m.url}-${i}`} aria-hidden={i >= media.length ? true : undefined}>
                <a className="clip" href={m.url} target="_blank" rel="noopener noreferrer">
                  <span className="clip-top">
                    <span className="fav">
                      {fav ? (
                        // Plain <img> on purpose — 18px favicons don't benefit from
                        // next/image and avoid an extra remotePatterns entry.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={fav}
                          alt=""
                          loading="lazy"
                          onError={(e) => {
                            const parent = (e.currentTarget.parentNode as HTMLElement | null);
                            if (parent) {
                              parent.classList.add("placeholder");
                              e.currentTarget.replaceWith(
                                Object.assign(document.createElement("span"), {
                                  textContent: getMonogram(m.name),
                                })
                              );
                            }
                          }}
                        />
                      ) : (
                        <span>{getMonogram(m.name)}</span>
                      )}
                    </span>
                    <span className="nm">{m.name}</span>
                  </span>
                  <span className="desc">{desc}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <style jsx>{`
        .story {
          position: relative;
          border-top: 1px solid var(--hairline);
          background: var(--ink-0);
          padding: clamp(56px, 6vw, 96px) 0;
          scroll-margin-top: 24px;
        }
        .story-inner {
          padding: 0 clamp(28px, 4vw, 64px);
        }

        .story-head,
        .media-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--hairline);
          margin-bottom: 56px;
        }
        .story-head .left {
          display: flex;
          align-items: baseline;
          gap: 24px;
        }
        .story-head .eye,
        .media-head .eye {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          line-height: 1;
          color: var(--paper-2);
        }
        .story-head .nm {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: var(--fs-eyebrow);
          line-height: 1;
          color: var(--paper-2);
        }
        .story-head .tag {
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
        .media-head .ct {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: var(--fs-eyebrow);
          color: var(--paper-2);
          line-height: 1;
        }

        .story-intro {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: clamp(40px, 6vw, 96px);
          margin-bottom: clamp(48px, 6vw, 80px);
          align-items: start;
        }
        .story-title {
          font-family: var(--font-inter);
          font-weight: 300;
          font-size: clamp(38px, 4.6vw, 68px);
          line-height: 1.02;
          letter-spacing: -0.01em;
          color: var(--paper-0);
          text-wrap: balance;
          margin: 0;
        }
        .story-title :global(em) {
          color: var(--bwiga-blue);
          font-style: italic;
          font-weight: 300;
        }
        .story-body {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .story-body p {
          margin: 0;
          font-family: var(--font-inter);
          font-size: 18px;
          line-height: 1.6;
          color: var(--paper-1);
          text-wrap: pretty;
        }

        /* Grid layout with predictable column count per breakpoint so the
           divider is always to the RIGHT of each cell — no orphan border on
           wrapped rows. Cells without a divider on the right are: the very
           last (last-child) and the right-edge of every wrap (nth-child rules
           inside each breakpoint). */
        .inline-stats {
          list-style: none;
          margin: 0 0 clamp(64px, 8vw, 120px);
          padding: 0;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          row-gap: 0;
        }
        .inline-stats li {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 4px clamp(24px, 3vw, 44px) 4px 0;
          border-right: 1px solid var(--hairline);
        }
        .inline-stats li:last-child {
          border-right: 0;
          padding-right: 0;
        }
        .inline-stats b {
          font-family: var(--font-inter);
          font-weight: 300;
          font-size: clamp(32px, 3vw, 48px);
          color: var(--paper-0);
          letter-spacing: -0.01em;
          line-height: 1;
          font-feature-settings: "tnum";
          display: inline-flex;
          align-items: baseline;
        }
        .inline-stats b .plus {
          font-size: 0.6em;
          vertical-align: 0.2em;
          line-height: 1;
          margin-left: 1px;
        }
        .inline-stats span {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-2);
        }

        /* ---------- Gallery (full-bleed) ---------- */
        .gallery {
          margin-bottom: clamp(64px, 8vw, 120px);
        }
        .gallery-head {
          display: flex;
          justify-content: space-between;
          /* center, не baseline: если eye переносится в 2 строки, счётчик
             всё равно остаётся вертикально по центру заголовочного блока. */
          align-items: center;
          gap: 32px;
          padding: 0 clamp(28px, 4vw, 64px);
          /* Sits flush above the stage — no hairline, no margin. */
          margin-bottom: 16px;
        }
        .gallery-head .eye {
          font-family: var(--font-inter);
          font-size: var(--fs-eyebrow);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--paper-2);
          /* 1.35 даёт воздух между строками когда заголовок переносится. */
          line-height: 1.35;
        }
        .gallery-head .meta {
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: var(--fs-eyebrow);
          color: var(--paper-2);
          line-height: 1;
          /* Никогда не переносить «02 / 04» — даже если родитель ужмётся. */
          white-space: nowrap;
          flex-shrink: 0;
        }
        .gallery-head .meta b {
          font-family: var(--font-inter);
          font-weight: 600;
          color: var(--paper-0);
          font-size: var(--fs-h5);
          line-height: 1;
          min-width: 1.5ch;
          text-align: right;
          font-feature-settings: "tnum";
        }

        .gallery-stage {
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
        .gallery-stage :global(.gslide) {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          z-index: 0;
          transition: opacity 0.32s ease-in;
        }
        .gallery-stage :global(.gslide.is-active) {
          opacity: 1;
          pointer-events: auto;
          z-index: 2;
          transition: opacity 0s;
        }
        .gallery-stage :global(.gslide.is-leaving) {
          opacity: 0;
          z-index: 1;
        }
        .gallery-stage :global(.gblinds) {
          position: absolute;
          inset: 0;
          display: flex;
        }
        .gallery-stage :global(.gblind) {
          flex: 1;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        .gallery-stage :global(.gblind .gimg) {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 500%;
          background-size: cover;
          background-position: center top;
          will-change: transform;
        }
        .gallery-stage :global(.gblind:nth-child(1) .gimg) {
          transform: translateX(0%);
        }
        .gallery-stage :global(.gblind:nth-child(2) .gimg) {
          transform: translateX(-20%);
        }
        .gallery-stage :global(.gblind:nth-child(3) .gimg) {
          transform: translateX(-40%);
        }
        .gallery-stage :global(.gblind:nth-child(4) .gimg) {
          transform: translateX(-60%);
        }
        .gallery-stage :global(.gblind:nth-child(5) .gimg) {
          transform: translateX(-80%);
        }
        .gallery-stage :global(.gblind .gshutter) {
          position: absolute;
          inset: 0;
          background: var(--ink-1);
          clip-path: inset(0 0 0 0);
          transition: clip-path var(--blind-each) var(--ease-expo);
        }
        .gallery-stage :global(.gslide.is-active .gblind .gshutter) {
          clip-path: inset(100% 0 0 0);
        }
        .gallery-stage :global(.gslide.is-active .gblind:nth-child(1) .gshutter) {
          transition-delay: 0ms;
        }
        .gallery-stage :global(.gslide.is-active .gblind:nth-child(2) .gshutter) {
          transition-delay: 80ms;
        }
        .gallery-stage :global(.gslide.is-active .gblind:nth-child(3) .gshutter) {
          transition-delay: 160ms;
        }
        .gallery-stage :global(.gslide.is-active .gblind:nth-child(4) .gshutter) {
          transition-delay: 240ms;
        }
        .gallery-stage :global(.gslide.is-active .gblind:nth-child(5) .gshutter) {
          transition-delay: 320ms;
        }
        .gallery-stage :global(.gslide.is-leaving .gblind .gshutter) {
          clip-path: inset(100% 0 0 0);
          transition: none;
        }
        .gallery-stage :global(.gslide.is-active.dir-prev .gblind:nth-child(5) .gshutter) {
          transition-delay: 0ms;
        }
        .gallery-stage :global(.gslide.is-active.dir-prev .gblind:nth-child(4) .gshutter) {
          transition-delay: 80ms;
        }
        .gallery-stage :global(.gslide.is-active.dir-prev .gblind:nth-child(3) .gshutter) {
          transition-delay: 160ms;
        }
        .gallery-stage :global(.gslide.is-active.dir-prev .gblind:nth-child(2) .gshutter) {
          transition-delay: 240ms;
        }
        .gallery-stage :global(.gslide.is-active.dir-prev .gblind:nth-child(1) .gshutter) {
          transition-delay: 320ms;
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
        .gthumb {
          position: relative;
          flex: 0 0 116px;
          height: 62px;
          background-color: var(--ink-1);
          cursor: pointer;
          opacity: 0.42;
          transition: opacity 240ms var(--ease-soft);
          border: 0;
          border-radius: 4px;
          padding: 0;
          overflow: hidden;
        }
        .gthumb :global(img) {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }
        .gthumb::after {
          content: "";
          position: absolute;
          inset: 0;
          box-shadow: inset 0 0 0 0 var(--bwiga-blue);
          transition: box-shadow 240ms var(--ease-soft);
        }
        .gthumb:hover {
          opacity: 0.85;
        }
        .gthumb.is-active {
          opacity: 1;
        }
        .gthumb.is-active::after {
          box-shadow: inset 0 0 0 2px var(--bwiga-blue);
        }

        /* ---------- Top media marquee ---------- */
        .clip-marquee {
          position: relative;
          width: 100%;
          overflow: hidden;
          padding: 6px 0;
          -webkit-mask-image: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.55) 0,
            #000 clamp(12px, 1.6vw, 24px),
            #000 calc(100% - clamp(12px, 1.6vw, 24px)),
            rgba(0, 0, 0, 0.55) 100%
          );
          mask-image: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.55) 0,
            #000 clamp(12px, 1.6vw, 24px),
            #000 calc(100% - clamp(12px, 1.6vw, 24px)),
            rgba(0, 0, 0, 0.55) 100%
          );
        }
        .clippings {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: nowrap;
          align-items: stretch;
          gap: 14px;
          width: max-content;
          will-change: transform;
          /* Animation itself is driven by WAAPI in JS so we can interpolate
             playbackRate with inertia on hover. No CSS keyframe needed. */
        }
        @media (prefers-reduced-motion: reduce) {
          .clippings {
            transform: none !important;
          }
        }

        .clippings li {
          display: flex;
          flex: 0 0 auto;
        }
        .clip {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px 20px;
          width: 240px;
          /* Stretch to the tallest card in the strip — pairs with
             align-items: stretch on .clippings and display: flex on the li. */
          height: 100%;
          min-height: 96px;
          background: #eceef2;
          color: #1a1a1a;
          text-decoration: none;
          border: 1px solid rgba(0, 0, 0, 0.06);
          transition: background 220ms var(--ease-soft),
            color 220ms var(--ease-soft), box-shadow 320ms var(--ease-soft);
        }
        /* Push the descriptor to the bottom so every card has its rule at the
           same Y position even when names wrap to two lines. */
        .clip .desc {
          margin-top: auto;
        }
        .clip-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .clip .fav {
          width: 18px;
          height: 18px;
          flex: 0 0 18px;
          display: inline-grid;
          place-items: center;
          color: inherit;
        }
        .clip .fav :global(img) {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .clip .fav.placeholder {
          font-family: var(--font-inter);
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 0.04em;
          color: rgba(0, 0, 0, 0.55);
          border: 1px solid rgba(0, 0, 0, 0.18);
        }
        .clip .nm {
          font-family: var(--font-inter);
          font-weight: 600;
          font-size: 15px;
          letter-spacing: -0.005em;
          color: rgba(0, 0, 0, 0.88);
          line-height: 1.2;
        }
        .clip .desc {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          color: rgba(0, 0, 0, 0.55);
          text-transform: uppercase;
          line-height: 1.3;
          padding-top: 10px;
          border-top: 1px solid rgba(0, 0, 0, 0.12);
        }
        .clip:hover {
          background: var(--bwiga-blue);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
        }
        .clip:hover .nm {
          color: #fff;
        }
        .clip:hover .desc {
          color: rgba(255, 255, 255, 0.75);
          border-top-color: rgba(255, 255, 255, 0.3);
        }
        .clip:hover .fav.placeholder {
          color: rgba(255, 255, 255, 0.85);
          border-color: rgba(255, 255, 255, 0.4);
        }

        /* ---------- Responsive ---------- */
        @media (max-width: 1100px) {
          /* 3-col grid → items wrap 3 + 2. Right-edge cells (3rd and last)
             drop the border-right so wraps don't show a stray vertical line. */
          .inline-stats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            row-gap: clamp(20px, 2vw, 28px);
          }
          .inline-stats li:nth-child(3n) {
            border-right: 0;
            padding-right: 0;
          }
        }
        @media (max-width: 900px) {
          .story-intro {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .gallery-stage {
            height: 65vh;
            min-height: 360px;
          }
          .gthumb {
            flex: 0 0 96px;
            height: 54px;
          }
        }
        @media (max-width: 640px) {
          .gallery-thumbs {
            gap: 4px;
            padding-top: 4px;
          }
          .gthumb {
            flex: 0 0 80px;
            height: 46px;
          }
          .gallery-stage {
            height: 55vh;
            min-height: 320px;
          }
          /* 2-col grid → items wrap 2 + 2 + 1. Right-edge cells: 2nd, 4th,
             5th (last-child). The grid declaration override re-enables
             border-right on the 3rd (it's no longer at the right edge). */
          .inline-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .inline-stats li {
            border-right: 1px solid var(--hairline);
            padding-right: clamp(20px, 4vw, 32px);
          }
          .inline-stats li:nth-child(2n),
          .inline-stats li:last-child {
            border-right: 0;
            padding-right: 0;
          }
          .story-head,
          .media-head {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
          .gallery-arrows button {
            width: 40px;
            height: 40px;
          }
          .clip {
            width: 220px;
          }
        }
      `}</style>
    </section>
  );
}
