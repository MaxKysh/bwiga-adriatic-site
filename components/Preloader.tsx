"use client";

import { useEffect, useState } from "react";

// -----------------------------------------------------------------------------
// Full-screen preloader. Purpose: на медленном интернете между приходом HTML
// и применением Tailwind/global.css + styled-jsx чанков виден миг unstyled
// контента (FOUC). Preloader перекрывает страницу immediate из SSR-вывода
// (стили — inline, ничего ждать не нужно), потом плавно гаснет когда
// window.load уже отстрелял + 500ms минимума прошло.
//
// Логика hide:
//   - На mount фиксируем start time.
//   - Слушаем window.load (если document уже complete — стартуем onReady сразу).
//   - В onReady: считаем сколько прошло, ждём оставшееся до 500ms, потом hidden=true.
//   - CSS transition opacity 400ms унесёт overlay к нулю, pointerEvents
//     отключаются сразу чтобы не блокировать клики во время фейда.
// -----------------------------------------------------------------------------
const MIN_DISPLAY_MS = 500;

export default function Preloader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const onReady = () => {
      const elapsed = performance.now() - start;
      const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
      window.setTimeout(() => setHidden(true), wait);
    };
    if (document.readyState === "complete") {
      onReady();
    } else {
      window.addEventListener("load", onReady, { once: true });
    }
    return () => window.removeEventListener("load", onReady);
  }, []);

  // Inline styles — чтобы overlay был стилизован даже до загрузки
  // global.css / Tailwind. Hex'ы соответствуют var(--ink-0) и var(--paper-0)
  // из globals.css, но дублированы здесь как литералы — namespace стилей
  // отдельный, никаких зависимостей.
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#05070D",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: hidden ? 0 : 1,
        visibility: hidden ? "hidden" : "visible",
        pointerEvents: hidden ? "none" : "auto",
        transition: "opacity 400ms ease, visibility 0s linear 400ms",
      }}
    >
      {/* Логотип через native <img> чтобы не зависеть от next/image
          (тот тоже подгружается через JS bundle, который при медленном
          интернете может прийти позже HTML). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bwiga-logo-clean.svg"
        alt=""
        width={220}
        height={64}
        style={{ opacity: 0.85, maxWidth: "60vw", height: "auto" }}
      />
    </div>
  );
}
