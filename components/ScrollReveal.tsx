"use client";

import { useEffect } from "react";

// -----------------------------------------------------------------------------
// Baseline scroll-triggered fade-up.
//
// На mount:
//   1. Берём все <section> внутри <main>.
//   2. Пропускаем те, что уже в viewport на момент монтажа (Hero, обычно
//      StatsPanel). Иначе они бы мигнули opacity 0 → 1 в первом кадре.
//   3. Остальным навешиваем класс .reveal-section (initial state: opacity 0
//      + translateY 24px, см. globals.css).
//   4. Заводим IntersectionObserver: когда секция пересекает viewport
//      хотя бы на 10%, добавляем .is-in → CSS transition отрабатывает.
//   5. После reveal'а unobserve'им секцию — больше не нужна.
//
// reduced-motion: глобальный override в globals.css обнуляет transitions
// автоматически. Но для надёжности также не запускаем observer'ы — пусть
// контент просто рендерится опаковым.
// -----------------------------------------------------------------------------
export default function ScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main section")
    );
    if (sections.length === 0) return;

    const vh = window.innerHeight;
    const toReveal: HTMLElement[] = [];
    sections.forEach((s) => {
      const rect = s.getBoundingClientRect();
      // Если секция уже на экране — не прячем (Hero/StatsPanel).
      if (rect.top < vh && rect.bottom > 0) return;
      s.classList.add("reveal-section");
      toReveal.push(s);
    });

    if (toReveal.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );
    toReveal.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
