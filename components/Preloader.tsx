"use client";

import { useEffect, useRef, useState } from "react";

// -----------------------------------------------------------------------------
// Full-screen preloader с анимированной B-маркой + прогрессом загрузки.
//
// Зачем: на медленном интернете между приходом HTML и применением
// Tailwind/global.css виден миг unstyled контента (FOUC). Overlay перекрывает
// страницу сразу из SSR-вывода (критичные стили — inline), а внутри крутится
// пульсирующая марка + прогресс-бар.
//
// Прогресс честный по сигналам, но сглаженный:
//   - Пока грузится: current плавно тянется к 92% (медленный lerp 0.035).
//   - window.load отстрелял → loaded=true → current быстро (lerp 0.18)
//     добирается до 100%.
//   - На 100% ждём min-display (600ms суммарно) и гасим overlay.
// Это даёт ощущение реального прогресса без точного byte-tracking'а
// (который потребовал бы инструментирования всех ресурсов).
//
// Анимация марки — CSS keyframes через styled-jsx (инлайнятся в SSR HTML,
// доступны на первом кадре). Критичная раскладка overlay — inline style,
// чтобы dark-фон лёг даже без styled-jsx.
// -----------------------------------------------------------------------------
const MIN_DISPLAY_MS = 600;

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const startRef = useRef(0);

  // После fade-out'а preloader'а (~450ms по CSS transition) выставляем
  // body.intro-done. ScrollReveal вешает .rh-word на hero h1 при mount'е,
  // их маски ждут именно этот класс (см. globals.css). Так heading-wipe
  // на hero стартует ПОСЛЕ того как первичный загрузочный экран ушёл,
  // а не одновременно с ним.
  useEffect(() => {
    if (!hidden) return;
    const t = window.setTimeout(() => {
      document.body.classList.add("intro-done");
    }, 500); // 450ms transition + небольшой запас
    return () => window.clearTimeout(t);
  }, [hidden]);

  useEffect(() => {
    startRef.current = performance.now();
    let raf = 0;
    let current = 0;
    let loaded = false;

    const finish = () => {
      const elapsed = performance.now() - startRef.current;
      const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
      window.setTimeout(() => setHidden(true), wait);
    };

    const tick = () => {
      const target = loaded ? 100 : 92;
      current += (target - current) * (loaded ? 0.18 : 0.035);
      if (loaded && current > 99.4) current = 100;
      setProgress(current);
      if (current >= 100) {
        finish();
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };

    const onLoad = () => {
      loaded = true;
    };
    if (document.readyState === "complete") loaded = true;
    else window.addEventListener("load", onLoad, { once: true });

    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="preloader"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#05070D",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "36px",
        opacity: hidden ? 0 : 1,
        visibility: hidden ? "hidden" : "visible",
        pointerEvents: hidden ? "none" : "auto",
        transition: "opacity 450ms ease, visibility 0s linear 450ms",
      }}
    >
      <div className="pl-mark">
        <svg
          viewBox="160 235 615 525"
          width="150"
          height="128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="BWiGA"
        >
          {/* B-силуэт с 4-конечной звездой (cutout). */}
          <path
            className="pl-b"
            d="M653.4 500.1C714.8 491 762 438.1 762 374.1C762 304 705.3 247.1 635.2 246.8H248.2V753.4H635.2C705.3 753.1 762 696.2 762 626.1C762 562.1 714.8 509.2 653.4 500.1ZM594.2 511.2C531 529.3 481.6 578.7 463.5 641.9L452.4 680.6L441.3 641.9C423.2 578.7 373.8 529.3 310.6 511.2L271.9 500.1L310.6 489C373.8 470.9 423.2 421.5 441.3 358.3L452.4 319.6L463.5 358.3C481.6 421.5 531 470.9 594.2 489L632.9 500.1L594.2 511.2Z"
            fill="#378ECD"
          />
          {/* Вертикальная черта слева. */}
          <path
            className="pl-bar-mark"
            d="M227 246.6H168V753.2H227V246.6Z"
            fill="#378ECD"
          />
        </svg>
      </div>

      <div className="pl-progress">
        <div className="pl-track">
          <span className="pl-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="pl-pct">{Math.round(progress)}%</div>
      </div>

      <style jsx>{`
        .pl-mark {
          /* Дыхание: лёгкий scale + усиление glow. 2.2s бесконечный цикл. */
          animation: plPulse 2.2s ease-in-out infinite;
          line-height: 0;
        }
        .pl-mark svg {
          display: block;
        }
        /* Лёгкое мерцание самой звезды-cutout через прыгающую яркость B. */
        .pl-b {
          animation: plFlicker 2.2s ease-in-out infinite;
        }

        .pl-progress {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .pl-track {
          width: 200px;
          max-width: 50vw;
          height: 3px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          overflow: hidden;
        }
        .pl-fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #3083c6, #4fa1dc);
          box-shadow: 0 0 12px rgba(79, 161, 220, 0.6);
          transition: width 120ms linear;
        }
        .pl-pct {
          font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo,
            monospace;
          font-size: 12px;
          letter-spacing: 0.16em;
          color: rgba(255, 255, 255, 0.7);
          font-variant-numeric: tabular-nums;
        }

        @keyframes plPulse {
          0%,
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 8px rgba(55, 142, 205, 0.35));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 24px rgba(55, 142, 205, 0.7));
          }
        }
        @keyframes plFlicker {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.82;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pl-mark,
          .pl-b {
            animation: none;
          }
          .pl-fill {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
